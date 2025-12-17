import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async create(recipient: User, message: string, projectId?: number) {
    const notification = this.notificationRepo.create({
      recipient,
      message,
      projectId,
    });
    return this.notificationRepo.save(notification);
  }

  async findAll(userId: number) {
    return this.notificationRepo.find({
      where: { recipient: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    return this.notificationRepo.update(id, { isRead: true });
  }
}
