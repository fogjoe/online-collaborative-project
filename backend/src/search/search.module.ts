import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from 'src/card/entities/card.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { List } from 'src/list/entities/list.entity';
import { Project } from 'src/project/entities/project.entity';
import { ProjectMember } from 'src/project/entities/project-member.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchIndexService } from './search-index.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, Comment, List, Project, ProjectMember]),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchIndexService],
})
export class SearchModule {}
