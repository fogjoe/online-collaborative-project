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

@Controller('cards/:cardId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Request() req,
    @Param('cardId', ParseIntPipe) cardId: number,
    @Body('content') content: string,
  ) {
    return this.commentsService.create(req.user, cardId, content);
  }

  @Get()
  findAll(@Param('cardId', ParseIntPipe) cardId: number) {
    return this.commentsService.findByCard(cardId);
  }
}
