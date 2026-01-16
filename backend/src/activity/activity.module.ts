import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityLoggingInterceptor } from './interceptors/activity-logging.interceptor';
import { AuthorizationModule } from 'src/common/authorization/authorization.module';

@Module({
  imports: [TypeOrmModule.forFeature([Activity]), AuthorizationModule],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityLoggingInterceptor],
  exports: [ActivityService, ActivityLoggingInterceptor],
})
export class ActivityModule {}
