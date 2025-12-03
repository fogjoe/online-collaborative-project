import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCardDto } from './dto/create-card.dto';
import { Card } from './entities/card.entity';
import { List } from '../list/entities/list.entity';
import { ReorderCardDto } from './dto/reorder-card.dto';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
  ) {}

  async create(createCardDto: CreateCardDto) {
    const { listId, title, description } = createCardDto;

    const list = await this.listRepository.findOneBy({ id: listId });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Calculate order (append to end of list)
    const lastCard = await this.cardRepository.findOne({
      where: { list: { id: listId } },
      order: { order: 'DESC' },
    });
    const newOrder = lastCard ? lastCard.order + 1 : 1;

    const newCard = this.cardRepository.create({
      title,
      description,
      order: newOrder,
      list,
      isCompleted: false,
    });

    return this.cardRepository.save(newCard);
  }

  async reorder(dto: ReorderCardDto) {
    const { cardId, targetListId, newOrder } = dto;

    // 1. Find the card
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list'], // Load the list relation to check current list
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    // 2. Check if moving to a different list
    if (card.list.id !== targetListId) {
      const targetList = await this.listRepository.findOneBy({
        id: targetListId,
      });
      if (!targetList) {
        throw new NotFoundException(
          `Target List with ID ${targetListId} not found`,
        );
      }
      // Update relationship
      card.list = targetList;
    }

    // 3. Update the order
    // Ensure newOrder is not null (fallback to existing order or a default if logic fails)
    card.order = newOrder ?? card.order;

    // 4. Save updates
    const savedCard = await this.cardRepository.save(card);
    return {
      message: `The card named ${savedCard.title} moved to new position`,
      result: savedCard,
    };
  }

  async toggle(id: number) {
    const card = await this.cardRepository.findOneBy({ id });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    card.isCompleted = !card.isCompleted;
    return this.cardRepository.save(card);
  }
}
