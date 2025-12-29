import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('projects/:projectId/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async list(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Number(limit) : 25;
    return this.activityService.listByProject(projectId, cursor, take);
  }
}
