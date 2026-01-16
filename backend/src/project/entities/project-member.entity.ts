import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from '../../user/entities/user.entity';
import { ProjectRole } from '../enums/project-role.enum';

@Entity('project_members')
export class ProjectMember {
  @PrimaryColumn({ name: 'project_id', type: 'int' })
  projectId: number;

  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => Project, (project) => project.projectMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, (user) => user.projectMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ProjectRole, default: ProjectRole.MEMBER })
  role: ProjectRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
