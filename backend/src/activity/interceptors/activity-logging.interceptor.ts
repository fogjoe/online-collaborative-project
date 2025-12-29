import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityService } from '../activity.service';
import {
  ACTIVITY_LOG_METADATA,
  ActivityLogOptions,
} from '../decorators/log-activity.decorator';
import { Request } from 'express';

@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly activityService: ActivityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<ActivityLogOptions>(
      ACTIVITY_LOG_METADATA,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const actor = request.user as any;
    const { projectIdParam = 'projectId' } = options;
    const rawProjectId =
      request.params[projectIdParam] ?? request.body?.[projectIdParam];
    const projectId = Number(rawProjectId);

    if (!projectId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        void (async () => {
          try {
            const payload = options.buildPayload
              ? await options.buildPayload(context, result)
              : undefined;

            await this.activityService.log({
              projectId,
              actor: actor ?? null,
              action: options.action,
              oldValue: payload?.oldValue ?? null,
              newValue: payload?.newValue ?? null,
              metadata: payload?.metadata ?? null,
            });
          } catch (error) {
            // Do not block response if logging fails
            console.error('Failed to log activity', error);
          }
        })();
      }),
    );
  }
}
