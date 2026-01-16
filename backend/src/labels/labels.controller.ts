import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ProjectRole } from 'src/project/enums/project-role.enum';

@Controller('projects/:projectId/labels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @Roles(ProjectRole.ADMIN, ProjectRole.OWNER)
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: { name: string; color: string },
  ) {
    return this.labelsService.create(projectId, body.name, body.color);
  }

  @Get()
  @Roles(
    ProjectRole.VIEWER,
    ProjectRole.MEMBER,
    ProjectRole.ADMIN,
    ProjectRole.OWNER,
  )
  findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.labelsService.findAll(projectId);
  }
}
