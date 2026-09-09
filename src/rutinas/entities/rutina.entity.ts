import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { RutinaEjercicio } from './rutina-ejercicio.entity.js';
import { Sesion } from '../../sesiones/entities/sesion.entity.js';

@Entity({ name: 'rutinas' })
export class Rutina {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.rutinas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @OneToMany(() => RutinaEjercicio, (re) => re.rutina)
  ejercicios: RutinaEjercicio[];

  @OneToMany(() => Sesion, (sesion) => sesion.rutina)
  sesiones: Sesion[];
}
