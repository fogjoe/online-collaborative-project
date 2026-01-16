import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Card } from 'src/card/entities/card.entity';
import { Comment } from './entities/comment.entity';
import { ActivityModule } from 'src/activity/activity.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { AuthorizationModule } from 'src/common/authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Card]),
    ActivityModule,
    WebsocketModule,
    AuthorizationModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
