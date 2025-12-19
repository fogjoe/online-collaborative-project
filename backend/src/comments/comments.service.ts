import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { User } from '../user/entities/user.entity';
import { Card } from '../card/entities/card.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Card) private cardRepo: Repository<Card>,
  ) {}

  async create(userId: number, cardId: number, content: string) {
    const card = await this.cardRepo.findOneBy({ id: cardId });
    if (!card) throw new NotFoundException('Card not found');

    const comment = this.commentRepo.create({
      content,
      user: { id: userId } as User, // Efficient shorthand
      card,
    });

    // Save and return with user details for the frontend
    return this.commentRepo.save(comment);
  }

  async findByCard(cardId: number) {
    return this.commentRepo.find({
      where: { card: { id: cardId } },
      relations: ['user'], // Load author info
      order: { createdAt: 'DESC' }, // Newest first
    });
  }
}
