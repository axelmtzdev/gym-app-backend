import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Rutina } from './entities/rutina.entity.js';
import { RutinaGrupo } from './entities/rutina-grupo.entity.js';
import { RutinaEjercicio } from './entities/rutina-ejercicio.entity.js';
import { Sesion, EstadoSesion } from '../sesiones/entities/sesion.entity.js';
import { CrearRutinaDto } from './dto/crear-rutina.dto.js';
import { ActualizarRutinaDto } from './dto/actualizar-rutina.dto.js';
import { CrearRutinaEjercicioDto } from './dto/crear-rutina-ejercicio.dto.js';
import { ActualizarRutinaEjercicioDto } from './dto/actualizar-rutina-ejercicio.dto.js';

@Injectable()
export class RutinasService {
  constructor(
    @InjectRepository(Rutina)
    private readonly rutinas: Repository<Rutina>,
    @InjectRepository(RutinaEjercicio)
    private readonly rutinaEjercicios: Repository<RutinaEjercicio>,
    @InjectRepository(Sesion)
    private readonly sesiones: Repository<Sesion>,
    private readonly dataSource: DataSource,
  ) { }

  async listar(usuarioId: string) {
    const rutinas = await this.rutinas.find({
      where: { usuario: { id: usuarioId } },
      relations: { grupos: true },
      order: { nombre: 'ASC' },
    });

    if (rutinas.length === 0) {
      return [];
    }

    const conteos = await this.rutinaEjercicios
      .createQueryBuilder('re')
      .select('re.rutina_id', 'rutinaId')
      .addSelect('COUNT(*)', 'total')
      .where('re.rutina_id IN (:...ids)', { ids: rutinas.map((r) => r.id) })
      .groupBy('re.rutina_id')
      .getRawMany<{ rutinaId: string; total: string }>();

    const totalPorRutina = new Map(
      conteos.map((c) => [c.rutinaId, parseInt(c.total, 10)]),
    );

    return rutinas.map((rutina) => ({
      id: rutina.id,
      nombre: rutina.nombre,
      descripcion: rutina.descripcion,
      activa: rutina.activa,
      creado_en: rutina.creadoEn,
      grupos: rutina.grupos.map((g) => g.grupoMuscular),
      total_ejercicios: totalPorRutina.get(rutina.id) ?? 0,
    }));
  }

  async crear(dto: CrearRutinaDto, usuarioId: string) {
    return this.dataSource.transaction(async (manager) => {
      const rutina = await manager.save(
        manager.create(Rutina, {
          usuario: { id: usuarioId } as any,
          nombre: dto.nombre,
          descripcion: dto.descripcion ?? null,
        }),
      );

      await manager.save(
        dto.grupos.map((grupoMuscular) =>
          manager.create(RutinaGrupo, {
            rutinaId: rutina.id,
            grupoMuscular,
          }),
        ),
      );

      return {
        id: rutina.id,
        nombre: rutina.nombre,
        descripcion: rutina.descripcion,
        activa: rutina.activa,
        grupos: dto.grupos,
      };
    });
  }

  async actualizar(id: string, dto: ActualizarRutinaDto, usuarioId: string) {
    return this.dataSource.transaction(async (manager) => {
      const rutina = await manager.findOne(Rutina, {
        where: { id, usuario: { id: usuarioId } },
      });
      if (!rutina) {
        throw new NotFoundException('Rutina no encontrada');
      }

      if (dto.nombre !== undefined) rutina.nombre = dto.nombre;
      if (dto.descripcion !== undefined) rutina.descripcion = dto.descripcion;
      if (dto.activa !== undefined) rutina.activa = dto.activa;
      await manager.save(rutina);

      if (dto.grupos) {
        await manager.delete(RutinaGrupo, { rutinaId: id });
        await manager.save(
          dto.grupos.map((grupoMuscular) =>
            manager.create(RutinaGrupo, { rutinaId: id, grupoMuscular }),
          ),
        );
      }

      const grupos =
        dto.grupos ??
        (
          await manager.find(RutinaGrupo, { where: { rutinaId: id } })
        ).map((g) => g.grupoMuscular);

      return {
        id: rutina.id,
        nombre: rutina.nombre,
        descripcion: rutina.descripcion,
        activa: rutina.activa,
        grupos,
      };
    });
  }

  async obtener(id: string, usuarioId: string) {
    const rutina = await this.rutinas.findOne({
      where: { id, usuario: { id: usuarioId } },
      relations: { ejercicios: { ejercicio: true }, grupos: true },
    });

    if (!rutina) {
      throw new NotFoundException('Rutina no encontrada');
    }

    const ejerciciosOrdenados = [...rutina.ejercicios].sort(
      (a, b) => a.orden - b.orden,
    );

    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const entrenamientosEstaSemana = await this.sesiones
      .createQueryBuilder('sesion')
      .where('sesion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('sesion.estado = :estado', { estado: EstadoSesion.COMPLETADA })
      .andWhere('sesion.iniciada_en >= :inicioSemana', { inicioSemana })
      .getCount();

    return {
      id: rutina.id,
      nombre: rutina.nombre,
      descripcion: rutina.descripcion,
      entrenamientos_esta_semana: entrenamientosEstaSemana,
      grupos: rutina.grupos.map((g) => g.grupoMuscular),
      ejercicios: ejerciciosOrdenados.map((re) => ({
        id: re.id,
        ejercicio_id: re.ejercicio.id,
        nombre: re.ejercicio.nombre,
        orden: re.orden,
        series_objetivo: re.seriesObjetivo,
        reps_objetivo: re.repsObjetivo,
      })),
    };
  }

  async agregarEjercicio(
    rutinaId: string,
    dto: CrearRutinaEjercicioDto,
    usuarioId: string,
  ) {
    await this.obtenerPropia(rutinaId, usuarioId);

    const rutinaEjercicio = this.rutinaEjercicios.create({
      rutina: { id: rutinaId } as any,
      ejercicio: { id: dto.ejercicio_id } as any,
      orden: dto.orden,
      seriesObjetivo: dto.series_objetivo,
      repsObjetivo: dto.reps_objetivo,
    });

    try {
      return await this.rutinaEjercicios.save(rutinaEjercicio);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        throw new ConflictException(
          'Ese ejercicio ya está en la rutina',
        );
      }
      throw error;
    }
  }

  async actualizarEjercicio(
    rutinaId: string,
    rutinaEjercicioId: number,
    dto: ActualizarRutinaEjercicioDto,
    usuarioId: string,
  ) {
    await this.obtenerPropia(rutinaId, usuarioId);

    const rutinaEjercicio = await this.rutinaEjercicios.findOne({
      where: { id: rutinaEjercicioId, rutina: { id: rutinaId } },
    });
    if (!rutinaEjercicio) {
      throw new NotFoundException('Ejercicio de la rutina no encontrado');
    }

    if (dto.orden !== undefined) rutinaEjercicio.orden = dto.orden;
    if (dto.series_objetivo !== undefined)
      rutinaEjercicio.seriesObjetivo = dto.series_objetivo;
    if (dto.reps_objetivo !== undefined)
      rutinaEjercicio.repsObjetivo = dto.reps_objetivo;

    return this.rutinaEjercicios.save(rutinaEjercicio);
  }

  async eliminarEjercicio(
    rutinaId: string,
    rutinaEjercicioId: number,
    usuarioId: string,
  ) {
    await this.obtenerPropia(rutinaId, usuarioId);

    const rutinaEjercicio = await this.rutinaEjercicios.findOne({
      where: { id: rutinaEjercicioId, rutina: { id: rutinaId } },
    });
    if (!rutinaEjercicio) {
      throw new NotFoundException('Ejercicio de la rutina no encontrado');
    }

    await this.rutinaEjercicios.remove(rutinaEjercicio);
  }

  private async obtenerPropia(id: string, usuarioId: string) {
    const rutina = await this.rutinas.findOne({
      where: { id, usuario: { id: usuarioId } },
    });
    if (!rutina) {
      throw new NotFoundException('Rutina no encontrada');
    }
    return rutina;
  }
}
