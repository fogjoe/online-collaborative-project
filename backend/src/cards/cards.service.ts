import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(createCardDto: CreateCardDto, userId: string): Promise<Card> {
    const card = this.cardsRepository.create({
      title: createCardDto.title,
      description: createCardDto.description,
      order: createCardDto.order ?? 0,
      list: { id: createCardDto.listId },
    });
    const savedCard = await this.cardsRepository.save(card);

    await this.activityLogService.logActivity(
      userId,
      'create_card',
      savedCard.id,
      'Card',
      { title: savedCard.title, listId: createCardDto.listId },
    );

    return savedCard;
  }

  async findAllByList(listId: string): Promise<Card[]> {
    return this.cardsRepository.find({
      where: { list: { id: listId } },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id },
      relations: ['list'],
    });
    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }
    return card;
  }

  async update(id: string, updateCardDto: any, userId: string): Promise<Card> {
    const card = await this.findOne(id);
    const oldListId = card.list.id;
    const oldOrder = card.order;

    // If listId or order is changing, handle reordering
    if (
      (updateCardDto.listId && updateCardDto.listId !== oldListId) ||
      (updateCardDto.order !== undefined && updateCardDto.order !== oldOrder)
    ) {
      const newListId = updateCardDto.listId || oldListId;
      const newOrder =
        updateCardDto.order !== undefined ? updateCardDto.order : oldOrder;

      if (newListId !== oldListId) {
        // Moving to different list
        // Shift old list items
        await this.cardsRepository
          .createQueryBuilder()
          .update(Card)
          .set({ order: () => '"order" - 1' })
          .where('listId = :listId AND "order" > :order', {
            listId: oldListId,
            order: oldOrder,
          })
          .execute();

        // Shift new list items
        await this.cardsRepository
          .createQueryBuilder()
          .update(Card)
          .set({ order: () => '"order" + 1' })
          .where('listId = :listId AND "order" >= :order', {
            listId: newListId,
            order: newOrder,
          })
          .execute();
      } else {
        // Reordering in same list
        if (newOrder > oldOrder) {
          // Moved down
          await this.cardsRepository
            .createQueryBuilder()
            .update(Card)
            .set({ order: () => '"order" - 1' })
            .where(
              'listId = :listId AND "order" > :oldOrder AND "order" <= :newOrder',
              {
                listId: oldListId,
                oldOrder,
                newOrder,
              },
            )
            .execute();
        } else if (newOrder < oldOrder) {
          // Moved up
          await this.cardsRepository
            .createQueryBuilder()
            .update(Card)
            .set({ order: () => '"order" + 1' })
            .where(
              'listId = :listId AND "order" >= :newOrder AND "order" < :oldOrder',
              {
                listId: oldListId,
                newOrder,
                oldOrder,
              },
            )
            .execute();
        }
      }
    }

    if (updateCardDto.listId) {
      card.list = { id: updateCardDto.listId } as any;
    }

    Object.assign(card, updateCardDto);
    const updatedCard = await this.cardsRepository.save(card);

    await this.activityLogService.logActivity(
      userId,
      'update_card',
      updatedCard.id,
      'Card',
      { updates: updateCardDto },
    );

    return updatedCard;
  }

  async remove(id: string): Promise<void> {
    const result = await this.cardsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }
  }
}
