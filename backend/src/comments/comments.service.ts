import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { User } from '../user/entities/user.entity';
import { Card } from '../card/entities/card.entity';
import { ActivityService } from 'src/activity/activity.service';
import { WebsocketService } from 'src/websocket/websocket.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Card) private cardRepo: Repository<Card>,
    private readonly activityService: ActivityService,
    private readonly websocketService: WebsocketService,
  ) {}

  async create(user: User, cardId: number, content: string) {
    const card = await this.cardRepo.findOne({
      where: { id: cardId },
      relations: ['list', 'list.project'],
    });
    if (!card) throw new NotFoundException('Card not found');

    const comment = this.commentRepo.create({
      content,
      user: { id: user.id } as User, // Efficient shorthand
      card,
    });

    const savedComment = await this.commentRepo.save(comment);

    await this.activityService.log({
      projectId: card.list.project.id,
      actor: user,
      action: 'added_comment',
      newValue: { content },
      metadata: {
        cardId: card.id,
        cardTitle: card.title,
        commentId: savedComment.id,
      },
    });

    // Emit WebSocket event for comment added
    this.websocketService.emitCommentAdded({
      projectId: card.list.project.id,
      cardId: card.id,
      comment: {
        id: savedComment.id,
        content: savedComment.content,
        createdAt: savedComment.createdAt.toISOString(),
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
      },
    });

    return savedComment;
  }

  async findByCard(cardId: number) {
    return this.commentRepo.find({
      where: { card: { id: cardId } },
      relations: ['user'], // Load author info
      order: { createdAt: 'DESC' }, // Newest first
    });
  }
}
