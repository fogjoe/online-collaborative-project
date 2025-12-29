import { SetMetadata } from '@nestjs/common';
import { ActivityAction } from '../entities/activity.entity';
import { ExecutionContext } from '@nestjs/common';

export const ACTIVITY_LOG_METADATA = 'activity_log_metadata';

export interface ActivityLogPayload {
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface ActivityLogOptions {
  action: ActivityAction;
  projectIdParam?: string;
  buildPayload?: (
    context: ExecutionContext,
    result: unknown,
  ) => Promise<ActivityLogPayload> | ActivityLogPayload;
}

export const ActivityLog = (options: ActivityLogOptions) =>
  SetMetadata(ACTIVITY_LOG_METADATA, options);
