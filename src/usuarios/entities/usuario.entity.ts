import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    type Relation,
} from 'typeorm';
import { Rutina } from '../../rutinas/entities/rutina.entity.js';
import { Sesion } from '../../sesiones/entities/sesion.entity.js';
import { RefreshToken } from '../../auth/entities/refresh-token.entity.js';

@Entity({ name: 'usuarios' })
export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'varchar', length: 150, unique: true })
    email: string;

    // Nunca se expone en un DTO de respuesta — solo se lee dentro de AuthService.
    @Column({ name: 'contrasena_hash', type: 'varchar', length: 255 })
    contrasenaHash: string;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
    creadoEn: Date;

    @OneToMany(() => Rutina, (rutina) => rutina.usuario)
    rutinas: Relation<Rutina>[];

    @OneToMany(() => Sesion, (sesion) => sesion.usuario)
    sesiones: Relation<Sesion>[];

    @OneToMany(() => RefreshToken, (token) => token.usuario)
    refreshTokens: Relation<RefreshToken>[];
}