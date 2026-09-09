import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { Rutina } from '../../rutinas/entities/rutina.entity.js';
import { Serie } from './serie.entity.js';

export enum EstadoSesion {
  EN_CURSO = 'en_curso',
  COMPLETADA = 'completada',
  ABANDONADA = 'abandonada',
}

@Entity({ name: 'sesiones' })
@Check(`"estado" IN ('en_curso', 'completada', 'abandonada')`)
@Index(['usuario', 'iniciadaEn'])
export class Sesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.sesiones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => Rutina, (rutina) => rutina.sesiones, { nullable: true })
  @JoinColumn({ name: 'rutina_id' })
  rutina: Relation<Rutina> | null;

  @CreateDateColumn({ name: 'iniciada_en', type: 'timestamptz' })
  iniciadaEn: Date;

  @Column({ name: 'finalizada_en', type: 'timestamptz', nullable: true })
  finalizadaEn: Date | null;

  // "¿Cómo te sentiste hoy?" en Resumen — el mismo campo que llena
  // PATCH /sesiones/:id al terminar el entrenamiento desde Registro.
  @Column({ name: 'nota_general', type: 'text', nullable: true })
  notaGeneral: string | null;

  @Column({ type: 'varchar', length: 20, default: EstadoSesion.EN_CURSO })
  estado: EstadoSesion;

  @OneToMany(() => Serie, (serie) => serie.sesion)
  series: Relation<Serie>[];
}
