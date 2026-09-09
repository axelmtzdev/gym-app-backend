import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Rutina } from './rutina.entity.js';
import { Ejercicio } from '../../ejercicios/entities/ejercicio.entity.js';

@Entity({ name: 'rutina_ejercicios' })
@Unique(['rutina', 'ejercicio'])
export class RutinaEjercicio {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Rutina, (rutina) => rutina.ejercicios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rutina_id' })
  rutina: Rutina;

  @ManyToOne(() => Ejercicio, (ejercicio) => ejercicio.rutinaEjercicios)
  @JoinColumn({ name: 'ejercicio_id' })
  ejercicio: Ejercicio;

  @Column({ type: 'smallint' })
  orden: number;

  @Column({ name: 'series_objetivo', type: 'smallint' })
  seriesObjetivo: number;

  @Column({ name: 'reps_objetivo', type: 'smallint' })
  repsObjetivo: number;
}
