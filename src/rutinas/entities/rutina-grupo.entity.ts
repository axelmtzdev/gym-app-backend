import { Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { Rutina } from './rutina.entity.js';

@Entity({ name: 'rutina_grupos' })
export class RutinaGrupo {
  @PrimaryColumn({ name: 'rutina_id', type: 'uuid' })
  rutinaId: string;

  @ManyToOne(() => Rutina, (rutina) => rutina.grupos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rutina_id' })
  rutina: Relation<Rutina>;

  @PrimaryColumn({ name: 'grupo_muscular', type: 'varchar', length: 20 })
  grupoMuscular: string;
}
