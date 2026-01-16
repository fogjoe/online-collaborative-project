import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { ActivityService } from 'src/activity/activity.service';
import { WebsocketService } from 'src/websocket/websocket.service';
import { ProjectAccessService } from 'src/common/authorization/project-access.service';
import { ProjectRole } from 'src/project/enums/project-role.enum';

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
    private readonly activityService: ActivityService,
    private readonly websocketService: WebsocketService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async create(createCardDto: CreateCardDto, actor: User) {
    const { listId, title, description, dueDate } = createCardDto;

    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['project'],
    });
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
      dueDate: dueDate ? new Date(dueDate) : null,
      lastDueSoonReminderAt: null,
      lastOverdueNotificationAt: null,
      createdBy: actor,
    });

    const savedCard = await this.cardRepository.save(newCard);

    await this.activityService.log({
      projectId: list.project.id,
      actor,
      action: 'created_card',
      newValue: {
        cardId: savedCard.id,
        title: savedCard.title,
        description: savedCard.description,
      },
      metadata: {
        listId: list.id,
        listName: list.name,
      },
    });

    // Emit WebSocket event for real-time update
    this.websocketService.emitCardCreated({
      projectId: list.project.id,
      listId: list.id,
      card: {
        id: savedCard.id,
        title: savedCard.title,
        description: savedCard.description,
        order: savedCard.order,
        isCompleted: savedCard.isCompleted,
        assignees: [],
        labels: [],
        attachments: [],
        dueDate: savedCard.dueDate,
      },
      actor: {
        id: actor.id,
        username: actor.username,
      },
    });

    return savedCard;
  }

  async reorder(dto: ReorderCardDto, actor: User) {
    const { cardId, targetListId, newOrder } = dto;

    // 1. Find the card
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.project', 'createdBy', 'assignees'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    await this.ensureCanEditCard(card, actor);

    const previousList = card.list;
    let moved = false;

    // 2. Check if moving to a different list
    if (card.list.id !== targetListId) {
      const targetList = await this.listRepository.findOne({
        where: { id: targetListId },
        relations: ['project'],
      });
      if (!targetList) {
        throw new NotFoundException(
          `Target List with ID ${targetListId} not found`,
        );
      }
      // Update relationship
      card.list = targetList;
      moved = true;
    }

    // 3. Update the order
    // Ensure newOrder is not null (fallback to existing order or a default if logic fails)
    card.order = newOrder ?? card.order;

    // 4. Save updates
    const savedCard = await this.cardRepository.save(card);

    if (moved) {
      const destinationList = card.list;
      await this.activityService.log({
        projectId: destinationList.project.id,
        actor,
        action: 'moved_card',
        metadata: {
          cardId: savedCard.id,
          cardTitle: savedCard.title,
          fromList: { id: previousList.id, name: previousList.name },
          toList: { id: destinationList.id, name: destinationList.name },
        },
      });
    }

    // Emit WebSocket event for card moved/reordered
    this.websocketService.emitCardMoved({
      projectId: card.list.project.id,
      cardId: savedCard.id,
      fromListId: previousList.id,
      toListId: targetListId,
      newOrder: savedCard.order,
      actor: {
        id: actor.id,
        username: actor.username,
      },
    });

    return {
      message: `The card named ${savedCard.title} moved to new position`,
      result: savedCard,
    };
  }

  async toggle(id: number, actor: User) {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['list', 'list.project', 'createdBy', 'assignees'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    await this.ensureCanEditCard(card, actor);

    card.isCompleted = !card.isCompleted;
    const savedCard = await this.cardRepository.save(card);

    // Emit WebSocket event for card toggle
    this.websocketService.emitCardUpdated({
      projectId: card.list.project.id,
      cardId: savedCard.id,
      updates: {
        isCompleted: savedCard.isCompleted,
      },
      actor: {
        id: actor.id,
        username: actor.username,
      },
    });

    return savedCard;
  }

  async update(id: number, updateCardDto: UpdateCardDto, actor: User) {
    const { labelIds, dueDate, ...partialData } = updateCardDto;
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['labels', 'list', 'list.project', 'createdBy', 'assignees'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    await this.ensureCanEditCard(card, actor);

    const oldValue = {
      title: card.title,
      description: card.description,
      labelIds: card.labels.map((label) => label.id),
      dueDate: card.dueDate,
    };

    // Merge the updates into the existing card
    // properties in dto will overwrite card properties
    const updatedCard = this.cardRepository.merge(card, partialData);

    if (dueDate !== undefined) {
      updatedCard.dueDate = dueDate ? new Date(dueDate) : null;
      updatedCard.lastDueSoonReminderAt = null;
      updatedCard.lastOverdueNotificationAt = null;
    }

    if (labelIds !== undefined) {
      const labels = labelIds.length
        ? await this.labelRepository.findBy({ id: In(labelIds) })
        : [];
      updatedCard.labels = labels;
    }

    const saved = await this.cardRepository.save(updatedCard);

    await this.activityService.log({
      projectId: card.list.project.id,
      actor,
      action: 'updated_card',
      oldValue,
      newValue: {
        title: saved.title,
        description: saved.description,
        labelIds: saved.labels?.map((label) => label.id) ?? [],
        dueDate: saved.dueDate,
      },
      metadata: { cardId: saved.id },
    });

    // Emit WebSocket event for card updated
    this.websocketService.emitCardUpdated({
      projectId: card.list.project.id,
      cardId: saved.id,
      updates: {
        title: saved.title,
        description: saved.description,
        labels: saved.labels?.map((label) => ({
          id: label.id,
          name: label.name,
          color: label.color,
        })),
        dueDate: saved.dueDate,
      },
      actor: {
        id: actor.id,
        username: actor.username,
      },
    });

    return saved;
  }

  async remove(id: number, actor: User) {
    // First fetch the card with relations to get projectId
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['list', 'list.project', 'createdBy', 'assignees'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    await this.ensureCanEditCard(card, actor);

    const projectId = card.list.project.id;
    const listId = card.list.id;

    await this.cardRepository.delete(id);

    // Emit WebSocket event for card deleted
    this.websocketService.emitCardDeleted({
      projectId,
      cardId: id,
      listId,
      actor: {
        id: actor.id,
        username: actor.username,
      },
    });

    return { message: 'Card deleted successfully' };
  }

  // Assign a User to a Card
  async assignMember(cardId: number, dto: AssignUserDto, actor: User) {
    const { userId } = dto;

    // 1. Find Card with existing assignees
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['assignees', 'list', 'list.project', 'createdBy'],
    });

    if (!card) throw new NotFoundException('Card not found');

    await this.ensureCanEditCard(card, actor);

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
  async removeMember(cardId: number, userId: number, actor: User) {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['assignees', 'list', 'list.project', 'createdBy'],
    });

    if (!card) throw new NotFoundException('Card not found');

    await this.ensureCanEditCard(card, actor);

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
        'createdBy',
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

  async toggleLabel(cardId: number, labelId: number, actor: User) {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: [
        'labels',
        'assignees',
        'comments',
        'list',
        'list.project',
        'createdBy',
      ],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    await this.ensureCanEditCard(card, actor);

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

  private async ensureCanEditCard(card: Card, actor: User) {
    const projectId = card.list.project.id;
    const role = await this.projectAccessService.getUserRole(
      projectId,
      actor.id,
    );

    if (role === ProjectRole.OWNER || role === ProjectRole.ADMIN) {
      return;
    }

    if (role === ProjectRole.MEMBER) {
      const isOwner = card.createdBy?.id === actor.id;
      const isAssignee = card.assignees?.some((u) => u.id === actor.id);

      if (isOwner || isAssignee) {
        return;
      }
    }

    throw new ForbiddenException('You do not have access to modify this card');
  }
}
