import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';

@Entity({ name: 'users' }) // This MUST match your lowercase table name
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
}
