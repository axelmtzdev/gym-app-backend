import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Sesion } from './sesion.entity.js';
import { Ejercicio } from '../../ejercicios/entities/ejercicio.entity.js';
import { numericTransformer } from '../../common/numeric.transformer.js';

@Entity({ name: 'series' })
@Unique(['sesion', 'ejercicio', 'numeroSerie'])
@Check(`"peso_kg" >= 0`)
@Check(`"repeticiones" > 0`)
@Check(`"rpe" BETWEEN 1 AND 10`)
@Index(['sesion', 'ejercicio'])
@Index(['ejercicio', 'registradaEn'])
export class Serie {
  // bigint llega como string desde pg por precisión — se deja así para no
  // truncar en volúmenes altos de filas; convertir a number solo si hace falta.
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Sesion, (sesion) => sesion.series, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sesion_id' })
  sesion: Sesion;

  @ManyToOne(() => Ejercicio, (ejercicio) => ejercicio.series)
  @JoinColumn({ name: 'ejercicio_id' })
  ejercicio: Ejercicio;

  @Column({ name: 'numero_serie', type: 'smallint' })
  numeroSerie: number;

  @Column({
    name: 'peso_kg',
    type: 'numeric',
    precision: 6,
    scale: 2,
    transformer: numericTransformer,
  })
  pesoKg: number;

  @Column({ type: 'smallint' })
  repeticiones: number;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
    transformer: numericTransformer,
  })
  rpe: number | null;

  @Column({ type: 'text', nullable: true })
  nota: string | null;

  @CreateDateColumn({ name: 'registrada_en', type: 'timestamptz' })
  registradaEn: Date;
}
