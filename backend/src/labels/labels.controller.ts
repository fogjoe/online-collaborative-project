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

@Controller('projects/:projectId/labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: { name: string; color: string },
  ) {
    return this.labelsService.create(projectId, body.name, body.color);
  }

  @Get()
  findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.labelsService.findAll(projectId);
  }
}
