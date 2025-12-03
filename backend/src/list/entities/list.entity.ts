import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { Card } from '../../card/entities/card.entity';
import { ListStatus } from '../enums/list-status.enum';

@Entity('lists')
export class List {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ListStatus,
    default: ListStatus.TODO,
  })
  status: ListStatus;

  /**
   * We use 'decimal' type for order to allow inserting items between others
   * without re-indexing the whole list.
   * e.g., Inserting between 1 and 2 becomes 1.5
   */
  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  order: number;

  /**
   * Relationship: Many Lists belong to One Project (Board).
   * Note: In V2, if you add a 'Board' entity, change this to point to Board.
   */
  @ManyToOne(() => Project, (project) => project.lists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * Relationship: One List contains Many Cards.
   */
  @OneToMany(() => Card, (card) => card.list)
  cards: Card[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
