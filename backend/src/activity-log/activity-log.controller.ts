import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('activity-logs')
@UseGuards(AuthGuard('jwt'))
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get('entity/:entityId')
  async getLogsForEntity(@Param('entityId') entityId: string) {
    return this.activityLogService.getLogsForEntity(entityId);
  }

  @Get('user/:userId')
  async getLogsForUser(@Param('userId') userId: string) {
    return this.activityLogService.getLogsForUser(userId);
  }
}
