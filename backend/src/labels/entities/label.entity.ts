import { Card } from 'src/card/entities/card.entity';
import { Project } from 'src/project/entities/project.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
} from 'typeorm';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g., "Urgent"

  @Column()
  color: string; // e.g., "#EF4444" (Tailwind Red)

  // Label belongs to one Project
  @ManyToOne(() => Project, (project) => project.labels, {
    onDelete: 'CASCADE',
  })
  project: Project;

  // Label is on many Cards
  @ManyToMany(() => Card, (card) => card.labels)
  cards: Card[];
}
