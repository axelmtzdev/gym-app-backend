import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { RutinaEjercicio } from '../../rutinas/entities/rutina-ejercicio.entity.js';
import { Serie } from '../../sesiones/entities/serie.entity.js';

@Entity({ name: 'ejercicios' })
export class Ejercicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ name: 'grupo_muscular', type: 'varchar', length: 30 })
  grupoMuscular: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  equipo: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @OneToMany(() => RutinaEjercicio, (re) => re.ejercicio)
  rutinaEjercicios: Relation<RutinaEjercicio>[];

  @OneToMany(() => Serie, (serie) => serie.ejercicio)
  series: Relation<Serie>[];
}
