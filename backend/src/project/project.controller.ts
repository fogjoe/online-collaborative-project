import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard) // 🔒 只有登录用户能访问
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    // req.user 是 JwtStrategy 解析出来的当前用户
    return this.projectService.create(createProjectDto, req.user);
  }

  @Get()
  findAll(@Req() req) {
    return this.projectService.findAllByUser(req.user);
  }
}
