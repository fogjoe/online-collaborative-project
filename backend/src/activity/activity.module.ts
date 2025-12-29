import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityLoggingInterceptor } from './interceptors/activity-logging.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityLoggingInterceptor],
  exports: [ActivityService, ActivityLoggingInterceptor],
})
export class ActivityModule {}
