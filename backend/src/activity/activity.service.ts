import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityAction } from './entities/activity.entity';
import { User } from 'src/user/entities/user.entity';
import { Project } from 'src/project/entities/project.entity';

export interface LogActivityOptions {
  projectId: number;
  actor?: User | null;
  action: ActivityAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async log({
    projectId,
    actor,
    action,
    oldValue,
    newValue,
    metadata,
  }: LogActivityOptions) {
    const activity = this.activityRepository.create({
      project: { id: projectId } as Project,
      actor: actor ? ({ id: actor.id } as User) : null,
      action,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      metadata: metadata ?? null,
    });

    await this.activityRepository.save(activity);
  }

  async listByProject(projectId: number, cursor?: string, limit = 25) {
    const take = Math.min(Math.max(limit, 1), 100);

    const qb = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.actor', 'actor')
      .where('activity.projectId = :projectId', { projectId })
      .orderBy('activity.createdAt', 'DESC')
      .addOrderBy('activity.id', 'DESC')
      .take(take + 1);

    if (cursor) {
      const [cursorTimestamp, cursorId] = cursor.split('_');
      qb.andWhere(
        '(activity.createdAt < :cursorDate OR (activity.createdAt = :cursorDate AND activity.id < :cursorId))',
        {
          cursorDate: new Date(Number(cursorTimestamp)),
          cursorId: Number(cursorId),
        },
      );
    }

    const rows = await qb.getMany();
    const hasNext = rows.length > take;
    const data = hasNext ? rows.slice(0, take) : rows;
    const nextCursor = hasNext
      ? `${data[data.length - 1].createdAt.getTime()}_${data[data.length - 1].id}`
      : null;

    return { data, nextCursor };
  }
}
