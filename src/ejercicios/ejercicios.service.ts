import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ejercicio } from './entities/ejercicio.entity.js';
import { Serie } from '../sesiones/entities/serie.entity.js';

const INCREMENTO_KG = 2.5;
const RPE_UMBRAL_PROGRESION = 7;

@Injectable()
export class EjerciciosService {
  constructor(
    @InjectRepository(Ejercicio)
    private readonly ejercicios: Repository<Ejercicio>,
    @InjectRepository(Serie)
    private readonly series: Repository<Serie>,
  ) { }

  listar() {
    return this.ejercicios.find({ order: { nombre: 'ASC' } });
  }

  async referencia(
    ejercicioId: number,
    usuarioId: string,
    sesionActualId?: string,
  ) {
    const qb = this.series
      .createQueryBuilder('serie')
      .innerJoin('serie.sesion', 'sesion')
      .where('serie.ejercicio_id = :ejercicioId', { ejercicioId })
      .andWhere('sesion.usuario_id = :usuarioId', { usuarioId })
      .orderBy('serie.registrada_en', 'DESC')
      .limit(1);

    if (sesionActualId) {
      qb.andWhere('serie.sesion_id != :sesionActualId', { sesionActualId });
    }

    const ultima = await qb.getOne();

    if (!ultima) {
      return { anterior: null, sugerencia: null };
    }

    // Si el esfuerzo la vez pasada fue moderado, sugiere subir peso;
    // si ya fue exigente (RPE alto), sugiere repetir la misma carga.
    const sube = (ultima.rpe ?? 10) <= RPE_UMBRAL_PROGRESION;

    return {
      anterior: {
        peso_kg: ultima.pesoKg,
        repeticiones: ultima.repeticiones,
        rpe: ultima.rpe,
        fecha: ultima.registradaEn,
      },
      sugerencia: {
        peso_kg: sube ? ultima.pesoKg + INCREMENTO_KG : ultima.pesoKg,
        repeticiones: ultima.repeticiones,
      },
    };
  }

  async historial(ejercicioId: number, usuarioId: string) {
    const filas = await this.series
      .createQueryBuilder('serie')
      .innerJoin('serie.sesion', 'sesion')
      .select('sesion.iniciada_en::date', 'fecha')
      .addSelect('MAX(serie.peso_kg)', 'peso_max')
      .where('serie.ejercicio_id = :ejercicioId', { ejercicioId })
      .andWhere('sesion.usuario_id = :usuarioId', { usuarioId })
      .groupBy('sesion.iniciada_en::date')
      .orderBy('fecha', 'ASC')
      .getRawMany<{ fecha: string; peso_max: string }>();

    const puntos = filas.map((f) => ({
      fecha: f.fecha,
      peso_max: parseFloat(f.peso_max),
    }));

    const pr = puntos.length ? Math.max(...puntos.map((p) => p.peso_max)) : 0;

    const tendenciaPct =
      puntos.length >= 2 && puntos[0].peso_max > 0
        ? Math.round(
          ((puntos[puntos.length - 1].peso_max - puntos[0].peso_max) /
            puntos[0].peso_max) *
          100,
        )
        : 0;

    const ultimaVez = puntos.length ? puntos[puntos.length - 1].fecha : null;

    const sesiones = await this.series
      .createQueryBuilder('serie')
      .innerJoin('serie.sesion', 'sesion')
      .select('sesion.iniciada_en', 'fecha')
      .addSelect('serie.peso_kg', 'peso_kg')
      .addSelect('serie.repeticiones', 'repeticiones')
      .addSelect('serie.rpe', 'rpe')
      .where('serie.ejercicio_id = :ejercicioId', { ejercicioId })
      .andWhere('sesion.usuario_id = :usuarioId', { usuarioId })
      .orderBy('sesion.iniciada_en', 'DESC')
      .limit(20)
      .getRawMany();

    return {
      puntos,
      pr,
      tendencia_pct: tendenciaPct,
      ultima_vez: ultimaVez,
      sesiones,
    };
  }
}
