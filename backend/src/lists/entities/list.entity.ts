import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Board } from '../../boards/entities/board.entity';
import { Card } from '../../cards/entities/card.entity';

@Entity()
export class List {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @ManyToOne(() => Board, (board) => board.lists, { onDelete: 'CASCADE' })
  board: Board;

  @OneToMany(() => Card, (card) => card.list)
  cards: Card[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
