import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ActivityLog,
  ActivityLogDocument,
} from './schemas/activity-log.schema';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLogDocument>,
  ) {}

  async logActivity(
    userId: string,
    action: string,
    entityId: string,
    entityType: string,
    details?: Record<string, any>,
  ): Promise<ActivityLog> {
    const newLog = new this.activityLogModel({
      userId,
      action,
      entityId,
      entityType,
      details,
    });
    return newLog.save();
  }

  async getLogsForEntity(entityId: string): Promise<ActivityLog[]> {
    return this.activityLogModel
      .find({ entityId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getLogsForUser(userId: string): Promise<ActivityLog[]> {
    return this.activityLogModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
