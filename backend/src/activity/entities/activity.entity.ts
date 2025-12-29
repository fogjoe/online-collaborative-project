import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';

export type ActivityAction =
  | 'created_card'
  | 'updated_card'
  | 'moved_card'
  | 'added_comment'
  | 'invited_member';

@Entity('activities')
@Index(['project', 'createdAt', 'id'])
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  actor: User | null;

  @Column({ type: 'varchar', length: 50 })
  action: ActivityAction;

  @Column({ type: 'jsonb', nullable: true, name: 'old_value' })
  oldValue: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'new_value' })
  newValue: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
