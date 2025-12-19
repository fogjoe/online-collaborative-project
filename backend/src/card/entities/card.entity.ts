import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { List } from '../../list/entities/list.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comments/entities/comment.entity';

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

  @ManyToMany(() => User, (user) => user.assignedCards)
  @JoinTable({
    name: 'card_assignees',
    joinColumn: { name: 'card_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignees: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Comment, (comment) => comment.card)
  comments: Comment[];
}
