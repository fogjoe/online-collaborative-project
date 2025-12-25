import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateCardDto } from './dto/create-card.dto';
import { Card } from './entities/card.entity';
import { List } from '../list/entities/list.entity';
import { ReorderCardDto } from './dto/reorder-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { User } from 'src/user/entities/user.entity';
import { AssignUserDto } from './dto/assign-user.dto';
import { Label } from 'src/labels/entities/label.entity';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Label)
    private labelRepository: Repository<Label>,
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

  async update(id: number, updateCardDto: UpdateCardDto) {
    const { labelIds, ...partialData } = updateCardDto;
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['labels'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    // Merge the updates into the existing card
    // properties in dto will overwrite card properties
    const updatedCard = this.cardRepository.merge(card, partialData);

    if (labelIds !== undefined) {
      const labels = labelIds.length
        ? await this.labelRepository.findBy({ id: In(labelIds) })
        : [];
      updatedCard.labels = labels;
    }

    return this.cardRepository.save(updatedCard);
  }

  async remove(id: number) {
    const result = await this.cardRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    return { message: 'Card deleted successfully' };
  }

  // Assign a User to a Card
  async assignMember(cardId: number, dto: AssignUserDto) {
    const { userId } = dto;

    // 1. Find Card with existing assignees
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['assignees'],
    });

    if (!card) throw new NotFoundException('Card not found');

    // 2. Find User
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    // 3. Check if already assigned
    const isAssigned = card.assignees.some((a) => a.id === user.id);
    if (isAssigned) {
      return { message: 'User already assigned', card };
    }

    // 4. Add and Save
    card.assignees.push(user);
    return this.cardRepository.save(card);
  }

  // Unassign a User from a Card
  async removeMember(cardId: number, userId: number) {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['assignees'],
    });

    if (!card) throw new NotFoundException('Card not found');

    // Filter out the user
    card.assignees = card.assignees.filter((u) => u.id !== userId);

    return this.cardRepository.save(card);
  }

  async findOne(id: number) {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: [
        'labels',
        'assignees',
        'comments',
        'comments.user',
        'attachments',
      ],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    return card;
  }

  async toggleLabel(cardId: number, labelId: number) {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['labels', 'assignees', 'comments'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const labelIndex = card.labels.findIndex((l) => l.id === labelId);

    if (labelIndex > -1) {
      // Remove if exists
      card.labels.splice(labelIndex, 1);
    } else {
      // Add if not exists
      card.labels.push({ id: labelId } as Label);
    }

    return this.cardRepository.save(card);
  }
}
