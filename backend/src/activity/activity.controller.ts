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
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ProjectRole } from 'src/project/enums/project-role.enum';

@Controller('projects/:projectId/activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @Roles(
    ProjectRole.VIEWER,
    ProjectRole.MEMBER,
    ProjectRole.ADMIN,
    ProjectRole.OWNER,
  )
  async list(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Number(limit) : 25;
    return this.activityService.listByProject(projectId, cursor, take);
  }
}
