import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rutina } from './entities/rutina.entity.js';
import { Sesion, EstadoSesion } from '../sesiones/entities/sesion.entity.js';

@Injectable()
export class RutinasService {
  constructor(
    @InjectRepository(Rutina)
    private readonly rutinas: Repository<Rutina>,
    @InjectRepository(Sesion)
    private readonly sesiones: Repository<Sesion>,
  ) { }

  listar(usuarioId: string) {
    return this.rutinas.find({
      where: { usuario: { id: usuarioId } },
      order: { nombre: 'ASC' },
    });
  }

  async obtener(id: string, usuarioId: string) {
    const rutina = await this.rutinas.findOne({
      where: { id, usuario: { id: usuarioId } },
      relations: { ejercicios: { ejercicio: true } },
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
      ejercicios: ejerciciosOrdenados.map((re) => ({
        ejercicio_id: re.ejercicio.id,
        nombre: re.ejercicio.nombre,
        orden: re.orden,
        series_objetivo: re.seriesObjetivo,
        reps_objetivo: re.repsObjetivo,
      })),
    };
  }
}
