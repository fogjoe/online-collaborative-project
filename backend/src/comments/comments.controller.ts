import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ProjectRole } from 'src/project/enums/project-role.enum';

@Controller('cards/:cardId/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  create(
    @Request() req,
    @Param('cardId', ParseIntPipe) cardId: number,
    @Body('content') content: string,
  ) {
    return this.commentsService.create(req.user, cardId, content);
  }

  @Get()
  @Roles(
    ProjectRole.VIEWER,
    ProjectRole.MEMBER,
    ProjectRole.ADMIN,
    ProjectRole.OWNER,
  )
  findAll(@Param('cardId', ParseIntPipe) cardId: number) {
    return this.commentsService.findByCard(cardId);
  }
}
