import { Module } from '@nestjs/common';
import { ListService } from './list.service';
import { ListController } from './list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List } from './entities/list.entity';
import { Project } from '../project/entities/project.entity';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { AuthorizationModule } from 'src/common/authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([List, Project]),
    WebsocketModule,
    AuthorizationModule,
  ],
  controllers: [ListController],
  providers: [ListService],
})
export class ListModule {}
