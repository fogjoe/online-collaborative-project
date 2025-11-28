import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { List } from '../../list/entities/list.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Order of the card within the list.
   * Uses decimal for efficient drag-and-drop reordering.
   */
  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  order: number;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  /**
   * Relationship: Many Cards belong to One List.
   */
  @ManyToOne(() => List, (list) => list.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list: List;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
