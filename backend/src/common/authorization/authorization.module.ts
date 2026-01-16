import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectAccessService } from './project-access.service';
import { RolesGuard } from '../guards/roles.guard';
import { Project } from 'src/project/entities/project.entity';
import { ProjectMember } from 'src/project/entities/project-member.entity';
import { Card } from 'src/card/entities/card.entity';
import { List } from 'src/list/entities/list.entity';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectMember,
      Card,
      List,
      Attachment,
      Comment,
    ]),
  ],
  providers: [ProjectAccessService, RolesGuard],
  exports: [ProjectAccessService, RolesGuard],
})
export class AuthorizationModule {}
