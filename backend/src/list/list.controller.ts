import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ListService } from './list.service';
import { CreateListDto } from './dto/create-list.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ProjectRole } from 'src/project/enums/project-role.enum';

@Controller('lists')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Post()
  @Roles(ProjectRole.ADMIN, ProjectRole.OWNER)
  create(@Body() createListDto: CreateListDto) {
    return this.listService.create(createListDto);
  }

  @Get('project/:projectId')
  @Roles(
    ProjectRole.VIEWER,
    ProjectRole.MEMBER,
    ProjectRole.ADMIN,
    ProjectRole.OWNER,
  )
  findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.listService.findAllByProject(projectId);
  }
}
