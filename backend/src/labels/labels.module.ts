import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { Label } from './entities/label.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationModule } from 'src/common/authorization/authorization.module';

@Module({
  imports: [TypeOrmModule.forFeature([Label]), AuthorizationModule],
  controllers: [LabelsController],
  providers: [LabelsService],
})
export class LabelsModule {}
