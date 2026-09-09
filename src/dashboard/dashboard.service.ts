import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sesion, EstadoSesion } from '../sesiones/entities/sesion.entity.js';
import { Serie } from '../sesiones/entities/serie.entity.js';

const DIAS_SIN_TRABAJAR_ALERTA = 7;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sesion)
    private readonly sesiones: Repository<Sesion>,
    @InjectRepository(Serie)
    private readonly series: Repository<Serie>,
  ) { }

  async obtener(usuarioId: string) {
    const [racha, mes, recomendaciones] = await Promise.all([
      this.calcularRacha(usuarioId),
      this.calcularMes(usuarioId),
      this.calcularRecomendaciones(usuarioId),
    ]);

    return { racha_dias: racha, mes, recomendaciones };
  }

  private async calcularRacha(usuarioId: string): Promise<number> {
    const fechas = await this.sesiones
      .createQueryBuilder('sesion')
      .select('DISTINCT sesion.iniciada_en::date', 'fecha')
      .where('sesion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('sesion.estado = :estado', {
        estado: EstadoSesion.COMPLETADA,
      })
      .orderBy('fecha', 'DESC')
      .limit(60)
      .getRawMany<{ fecha: string }>();

    let racha = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const { fecha } of fechas) {
      const dia = new Date(fecha);
      const diff = Math.round(
        (cursor.getTime() - dia.getTime()) / (24 * 60 * 60 * 1000),
      );
      // Cuenta días consecutivos: hoy o ayer respecto al cursor, si no, corta la racha.
      if (diff === 0 || diff === 1) {
        racha += 1;
        cursor = dia;
      } else {
        break;
      }
    }

    return racha;
  }

  private async calcularMes(usuarioId: string) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const entrenamientos = await this.sesiones
      .createQueryBuilder('sesion')
      .where('sesion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('sesion.estado = :estado', {
        estado: EstadoSesion.COMPLETADA,
      })
      .andWhere('sesion.iniciada_en >= :inicioMes', { inicioMes })
      .getCount();

    const volumen = await this.series
      .createQueryBuilder('serie')
      .innerJoin('serie.sesion', 'sesion')
      .select('SUM(serie.peso_kg * serie.repeticiones)', 'volumen')
      .where('sesion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('sesion.iniciada_en >= :inicioMes', { inicioMes })
      .getRawOne<{ volumen: string | null }>();

    const semanas = await this.sesiones
      .createQueryBuilder('sesion')
      .select("date_trunc('week', sesion.iniciada_en)", 'semana')
      .addSelect('COUNT(*)', 'entrenamientos')
      .where('sesion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('sesion.estado = :estado', {
        estado: EstadoSesion.COMPLETADA,
      })
      .andWhere('sesion.iniciada_en >= :inicioMes', { inicioMes })
      .groupBy('semana')
      .orderBy('semana', 'ASC')
      .getRawMany<{ semana: string; entrenamientos: string }>();

    return {
      entrenamientos,
      volumen_total: volumen?.volumen ? parseFloat(volumen.volumen) : 0,
      semanas: semanas.map((s, i) => ({
        etiqueta: `Sem ${i + 1}`,
        entrenamientos: parseInt(s.entrenamientos, 10),
      })),
    };
  }

  private async calcularRecomendaciones(usuarioId: string) {
    const recomendaciones: {
      tipo: 'atencion' | 'positivo';
      mensaje: string;
    }[] = [];

    const porGrupo = await this.series
      .createQueryBuilder('serie')
      .innerJoin('serie.sesion', 'sesion')
      .innerJoin('serie.ejercicio', 'ejercicio')
      .select('ejercicio.grupo_muscular', 'grupo')
      .addSelect('MAX(sesion.iniciada_en)', 'ultima_vez')
      .where('sesion.usuario_id = :usuarioId', { usuarioId })
      .groupBy('ejercicio.grupo_muscular')
      .getRawMany<{ grupo: string; ultima_vez: string }>();

    const ahora = Date.now();
    for (const fila of porGrupo) {
      const dias = Math.floor(
        (ahora - new Date(fila.ultima_vez).getTime()) / (24 * 60 * 60 * 1000),
      );
      if (dias >= DIAS_SIN_TRABAJAR_ALERTA) {
        recomendaciones.push({
          tipo: 'atencion',
          mensaje: `${fila.grupo} no se ha trabajado en ${dias} días.`,
        });
      }
    }

    const [rpeEstaSemana, rpeSemanaAnterior] = await Promise.all([
      this.rpePromedioEntre(usuarioId, 7, 0),
      this.rpePromedioEntre(usuarioId, 14, 7),
    ]);

    if (
      rpeEstaSemana !== null &&
      rpeSemanaAnterior !== null &&
      rpeEstaSemana < rpeSemanaAnterior
    ) {
      recomendaciones.push({
        tipo: 'positivo',
        mensaje: `Tu RPE promedio bajó a ${rpeEstaSemana.toFixed(1)} esta semana.`,
      });
    }

    return recomendaciones;
  }

  private async rpePromedioEntre(
    usuarioId: string,
    diasAtrasInicio: number,
    diasAtrasFin: number,
  ) {
    const desde = new Date(
      Date.now() - diasAtrasInicio * 24 * 60 * 60 * 1000,
    );
    const hasta = new Date(Date.now() - diasAtrasFin * 24 * 60 * 60 * 1000);

    const fila = await this.series
      .createQueryBuilder('serie')
      .innerJoin('serie.sesion', 'sesion')
      .select('AVG(serie.rpe)', 'rpe')
      .where('sesion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('sesion.iniciada_en >= :desde', { desde })
      .andWhere('sesion.iniciada_en < :hasta', { hasta })
      .getRawOne<{ rpe: string | null }>();

    return fila?.rpe ? parseFloat(fila.rpe) : null;
  }
}
