import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Sesion, EstadoSesion } from './entities/sesion.entity.js';
import { Serie } from './entities/serie.entity.js';
import { CrearSesionDto } from './dto/crear-sesion.dto.js';
import { ActualizarSesionDto } from './dto/actualizar-sesion.dto.js';
import { CrearSerieDto } from './dto/crear-serie.dto.js';

@Injectable()
export class SesionesService {
  constructor(
    @InjectRepository(Sesion)
    private readonly sesiones: Repository<Sesion>,
    @InjectRepository(Serie)
    private readonly series: Repository<Serie>,
  ) { }

  crear(dto: CrearSesionDto, usuarioId: string) {
    const sesion = this.sesiones.create({
      usuario: { id: usuarioId } as any,
      rutina: { id: dto.rutina_id } as any,
      estado: EstadoSesion.EN_CURSO,
    });
    return this.sesiones.save(sesion);
  }

  async actualizar(id: string, dto: ActualizarSesionDto, usuarioId: string) {
    const sesion = await this.obtenerPropia(id, usuarioId);

    if (dto.estado) {
      sesion.estado = dto.estado;
      if (dto.estado === EstadoSesion.COMPLETADA) {
        sesion.finalizadaEn = new Date();
      }
    }
    if (dto.nota_general !== undefined) {
      sesion.notaGeneral = dto.nota_general;
    }

    return this.sesiones.save(sesion);
  }

  async resumen(id: string, usuarioId: string) {
    const sesion = await this.obtenerPropia(id, usuarioId);

    const totales = await this.series
      .createQueryBuilder('serie')
      .select('COUNT(*)', 'series_completadas')
      .addSelect('SUM(serie.peso_kg * serie.repeticiones)', 'volumen_total')
      .addSelect('AVG(serie.rpe)', 'rpe_promedio')
      .where('serie.sesion_id = :id', { id })
      .getRawOne<{
        series_completadas: string;
        volumen_total: string | null;
        rpe_promedio: string | null;
      }>();

    const porEjercicio = await this.series
      .createQueryBuilder('serie')
      .innerJoin('serie.ejercicio', 'ejercicio')
      .select('ejercicio.id', 'ejercicio_id')
      .addSelect('ejercicio.nombre', 'nombre')
      .addSelect('AVG(serie.peso_kg)', 'peso_promedio')
      .where('serie.sesion_id = :id', { id })
      .groupBy('ejercicio.id')
      .addGroupBy('ejercicio.nombre')
      .getRawMany();

    const duracionMin = sesion.finalizadaEn
      ? Math.round(
        (sesion.finalizadaEn.getTime() - sesion.iniciadaEn.getTime()) /
        60000,
      )
      : null;

    const volumenAnterior = await this.volumenSesionAnterior(
      sesion,
      usuarioId,
    );
    const volumenActual = parseFloat(totales?.volumen_total ?? '0');
    const comparacionPct = volumenAnterior
      ? Math.round(
        ((volumenActual - volumenAnterior) / volumenAnterior) * 100,
      )
      : null;

    return {
      duracion_min: duracionMin,
      volumen_total: volumenActual,
      series_completadas: parseInt(totales?.series_completadas ?? '0', 10),
      rpe_promedio: totales?.rpe_promedio
        ? parseFloat(parseFloat(totales.rpe_promedio).toFixed(1))
        : null,
      comparacion_anterior: { volumen_delta_pct: comparacionPct },
      ejercicios: porEjercicio.map((e) => ({
        ejercicio_id: e.ejercicio_id,
        nombre: e.nombre,
        peso_promedio: parseFloat(e.peso_promedio),
      })),
    };
  }

  async registrarSerie(
    sesionId: string,
    dto: CrearSerieDto,
    usuarioId: string,
  ) {
    await this.obtenerPropia(sesionId, usuarioId);

    const serie = this.series.create({
      sesion: { id: sesionId } as any,
      ejercicio: { id: dto.ejercicio_id } as any,
      numeroSerie: dto.numero_serie,
      pesoKg: dto.peso_kg,
      repeticiones: dto.repeticiones,
      rpe: dto.rpe ?? null,
      nota: dto.nota ?? null,
    });

    try {
      return await this.series.save(serie);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        throw new ConflictException(
          'Ya existe esa serie para este ejercicio en la sesión',
        );
      }
      throw error;
    }
  }

  private async obtenerPropia(id: string, usuarioId: string) {
    const sesion = await this.sesiones.findOne({
      where: { id, usuario: { id: usuarioId } },
      relations: { rutina: true },
    });
    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }
    return sesion;
  }

  private async volumenSesionAnterior(
    sesionActual: Sesion,
    usuarioId: string,
  ) {
    if (!sesionActual.rutina) return null;

    const anterior = await this.sesiones
      .createQueryBuilder('sesion')
      .where('sesion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('sesion.rutina_id = :rutinaId', {
        rutinaId: sesionActual.rutina.id,
      })
      .andWhere('sesion.id != :sesionId', { sesionId: sesionActual.id })
      .andWhere('sesion.estado = :estado', {
        estado: EstadoSesion.COMPLETADA,
      })
      .orderBy('sesion.iniciada_en', 'DESC')
      .getOne();

    if (!anterior) return null;

    const total = await this.series
      .createQueryBuilder('serie')
      .select('SUM(serie.peso_kg * serie.repeticiones)', 'volumen')
      .where('serie.sesion_id = :id', { id: anterior.id })
      .getRawOne<{ volumen: string | null }>();

    return total?.volumen ? parseFloat(total.volumen) : null;
  }
}
