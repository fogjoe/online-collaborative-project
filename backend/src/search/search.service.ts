import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from 'src/card/entities/card.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';

type SearchType = 'projects' | 'cards' | 'comments';

interface SearchQuery {
  q: string;
  types: SearchType[];
  projectId?: number;
  assignedUserId?: number;
  labelIds?: number[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isCompleted?: boolean;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async search(query: SearchQuery, user: User) {
    const trimmedQuery = query.q?.trim();
    if (!trimmedQuery) {
      return { projects: [], cards: [], comments: [] };
    }

    const shouldSearch = (type: SearchType) => query.types.includes(type);

    const [projects, cards, comments] = await Promise.all([
      shouldSearch('projects')
        ? this.searchProjects(trimmedQuery, query, user)
        : Promise.resolve([]),
      shouldSearch('cards')
        ? this.searchCards(trimmedQuery, query, user)
        : Promise.resolve([]),
      shouldSearch('comments')
        ? this.searchComments(trimmedQuery, query, user)
        : Promise.resolve([]),
    ]);

    return { projects, cards, comments };
  }

  private searchProjects(query: string, filters: SearchQuery, user: User) {
    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.owner', 'owner')
      .leftJoin('project.projectMembers', 'member')
      .where('(owner.id = :userId OR member.userId = :userId)', {
        userId: user.id,
      })
      .andWhere(
        `to_tsvector('simple', coalesce(project.name, '') || ' ' || coalesce(project.description, '')) @@ plainto_tsquery('simple', :query)`,
        { query },
      )
      .distinct(true)
      .select('project.id', 'id')
      .addSelect('project.name', 'name')
      .addSelect('project.description', 'description')
      .addSelect(
        `ts_rank(to_tsvector('simple', coalesce(project.name, '') || ' ' || coalesce(project.description, '')), plainto_tsquery('simple', :query))`,
        'rank',
      )
      .orderBy('rank', 'DESC')
      .limit(10);

    if (filters.projectId) {
      qb.andWhere('project.id = :projectId', {
        projectId: filters.projectId,
      });
    }

    return qb.getRawMany();
  }

  private searchCards(query: string, filters: SearchQuery, user: User) {
    const qb = this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.list', 'list')
      .leftJoin('list.project', 'project')
      .leftJoin('project.owner', 'owner')
      .leftJoin('project.projectMembers', 'member')
      .leftJoin('card.assignees', 'assignee')
      .leftJoin('card.labels', 'label')
      .where('(owner.id = :userId OR member.userId = :userId)', {
        userId: user.id,
      })
      .andWhere(
        `to_tsvector('simple', coalesce(card.title, '') || ' ' || coalesce(card.description, '')) @@ plainto_tsquery('simple', :query)`,
        { query },
      )
      .distinct(true)
      .select('card.id', 'id')
      .addSelect('card.title', 'title')
      .addSelect('card.description', 'description')
      .addSelect('card.isCompleted', 'isCompleted')
      .addSelect('card.dueDate', 'dueDate')
      .addSelect('list.id', 'listId')
      .addSelect('project.id', 'projectId')
      .addSelect('project.name', 'projectName')
      .addSelect(
        `ts_rank(to_tsvector('simple', coalesce(card.title, '') || ' ' || coalesce(card.description, '')), plainto_tsquery('simple', :query))`,
        'rank',
      )
      .orderBy('rank', 'DESC')
      .limit(15);

    if (filters.projectId) {
      qb.andWhere('project.id = :projectId', {
        projectId: filters.projectId,
      });
    }

    if (filters.assignedUserId) {
      qb.andWhere('assignee.id = :assignedUserId', {
        assignedUserId: filters.assignedUserId,
      });
    }

    if (filters.labelIds?.length) {
      qb.andWhere('label.id IN (:...labelIds)', {
        labelIds: filters.labelIds,
      });
    }

    if (filters.isCompleted !== undefined) {
      qb.andWhere('card.isCompleted = :isCompleted', {
        isCompleted: filters.isCompleted,
      });
    }

    if (filters.dueDateFrom) {
      qb.andWhere('card.dueDate >= :dueDateFrom', {
        dueDateFrom: filters.dueDateFrom,
      });
    }

    if (filters.dueDateTo) {
      qb.andWhere('card.dueDate <= :dueDateTo', {
        dueDateTo: filters.dueDateTo,
      });
    }

    return qb.getRawMany();
  }

  private searchComments(query: string, filters: SearchQuery, user: User) {
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.card', 'card')
      .leftJoin('card.list', 'list')
      .leftJoin('list.project', 'project')
      .leftJoin('project.owner', 'owner')
      .leftJoin('project.projectMembers', 'member')
      .where('(owner.id = :userId OR member.userId = :userId)', {
        userId: user.id,
      })
      .andWhere(
        `to_tsvector('simple', coalesce(comment.content, '')) @@ plainto_tsquery('simple', :query)`,
        { query },
      )
      .distinct(true)
      .select('comment.id', 'id')
      .addSelect('comment.content', 'content')
      .addSelect('comment.createdAt', 'createdAt')
      .addSelect('card.id', 'cardId')
      .addSelect('card.title', 'cardTitle')
      .addSelect('project.id', 'projectId')
      .addSelect('project.name', 'projectName')
      .addSelect(
        `ts_rank(to_tsvector('simple', coalesce(comment.content, '')), plainto_tsquery('simple', :query))`,
        'rank',
      )
      .orderBy('rank', 'DESC')
      .limit(15);

    if (filters.projectId) {
      qb.andWhere('project.id = :projectId', {
        projectId: filters.projectId,
      });
    }

    return qb.getRawMany();
  }
}
