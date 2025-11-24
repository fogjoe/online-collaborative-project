import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard) // 🔒 Only logged in users can access
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    // req.user is the current user parsed by JwtStrategy
    return this.projectService.create(createProjectDto, req.user);
  }

  @Get()
  findAll(@Req() req) {
    return this.projectService.findAllByUser(req.user);
  }
}
