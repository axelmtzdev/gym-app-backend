import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Entity({ name: 'refresh_tokens' })
@Index(['usuario'])
@Index(['tokenHash'])
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Usuario, (usuario) => usuario.refreshTokens, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'usuario_id' })
    usuario: Relation<Usuario>;

    // Se guarda el hash del refresh token, nunca el valor plano —
    // simétrico a contrasena_hash en Usuario.
    @Column({ name: 'token_hash', type: 'varchar', length: 255 })
    tokenHash: string;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
    creadoEn: Date;

    @Column({ name: 'expira_en', type: 'timestamptz' })
    expiraEn: Date;

    @Column({ type: 'boolean', default: false })
    revocado: boolean;
}