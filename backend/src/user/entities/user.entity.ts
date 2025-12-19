import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { Card } from 'src/card/entities/card.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string; // Note: 'password_hash' in DB, 'passwordHash' in code

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // A User can have many Projects
  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @ManyToMany(() => Project, (project) => project.members)
  memberProjects: Project[];

  // New: Cards assigned to me
  @ManyToMany(() => Card, (card) => card.assignees)
  assignedCards: Card[];

  @Column({ nullable: true })
  avatarUrl: string;
}
