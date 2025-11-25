import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity'; // Assuming 1 Project = 1 Board for V1
import { Card } from '../../card/entities/card.entity';

@Entity('lists')
export class List {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

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
