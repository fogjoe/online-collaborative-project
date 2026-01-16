import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from 'src/project/entities/project.entity';
import { ProjectMember } from 'src/project/entities/project-member.entity';
import { ProjectRole } from 'src/project/enums/project-role.enum';
import { Card } from 'src/card/entities/card.entity';
import { List } from 'src/list/entities/list.entity';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getUserRole(
    projectId: number,
    userId: number,
  ): Promise<ProjectRole | null> {
    const membership = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });

    if (membership) {
      return membership.role;
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['owner'],
    });

    if (project?.owner?.id === userId) {
      return ProjectRole.OWNER;
    }

    return null;
  }

  async resolveProjectId(request: {
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    baseUrl?: string;
    originalUrl?: string;
  }): Promise<number | null> {
    const params = request.params ?? {};
    const body = request.body ?? {};
    const baseUrl = request.baseUrl ?? '';
    const originalUrl = request.originalUrl ?? '';

    const directProjectId = this.toNumber(
      params.projectId ?? (body.projectId as string | undefined),
    );
    if (directProjectId) return directProjectId;

    if (baseUrl.includes('/projects') || originalUrl.includes('/projects/')) {
      const projectId = this.toNumber(params.id);
      if (projectId) return projectId;
    }

    const listId = this.toNumber(
      params.listId ??
        (body.listId as string | undefined) ??
        (body.targetListId as string | undefined),
    );
    if (listId) {
      return this.getProjectIdByListId(listId);
    }

    let cardId = this.toNumber(
      params.cardId ?? (body.cardId as string | undefined),
    );
    if (!cardId && baseUrl.includes('/cards')) {
      cardId = this.toNumber(params.id);
    }
    if (cardId) {
      return this.getProjectIdByCardId(cardId);
    }

    if (baseUrl.includes('/attachments')) {
      const attachmentId = this.toNumber(params.id);
      if (attachmentId) {
        return this.getProjectIdByAttachmentId(attachmentId);
      }
    }

    return null;
  }

  private toNumber(value: string | number | undefined | null): number | null {
    if (value === undefined || value === null) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  private async getProjectIdByListId(listId: number): Promise<number | null> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['project'],
    });
    return list?.project?.id ?? null;
  }

  private async getProjectIdByCardId(cardId: number): Promise<number | null> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.project'],
    });
    return card?.list?.project?.id ?? null;
  }

  private async getProjectIdByAttachmentId(
    attachmentId: number,
  ): Promise<number | null> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['card', 'card.list', 'card.list.project'],
    });
    return attachment?.card?.list?.project?.id ?? null;
  }

  async getProjectIdByCommentId(commentId: number): Promise<number | null> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['card', 'card.list', 'card.list.project'],
    });
    return comment?.card?.list?.project?.id ?? null;
  }
}
