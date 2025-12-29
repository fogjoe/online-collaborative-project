import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/user/entities/user.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User]),
    AuthModule,
    NotificationModule,
    ActivityModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
