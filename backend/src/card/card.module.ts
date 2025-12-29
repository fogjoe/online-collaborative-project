import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { List } from 'src/list/entities/list.entity';
import { User } from 'src/user/entities/user.entity';
import { Label } from 'src/labels/entities/label.entity';
import { ActivityModule } from 'src/activity/activity.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, List, User, Label]),
    ActivityModule,
    WebsocketModule,
  ],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
