import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Card } from 'src/card/entities/card.entity';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Card])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
