import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { Card } from 'src/card/entities/card.entity';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCardReminders() {
    const now = new Date();
    await this.notifyDueSoonCards(now);
    await this.notifyOverdueCards(now);
  }

  private async notifyDueSoonCards(now: Date) {
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const cards = await this.cardRepository.find({
      where: {
        isCompleted: false,
        dueDate: Between(now, nextDay),
      },
      relations: ['assignees', 'list', 'list.project'],
    });

    for (const card of cards) {
      if (!card.dueDate || !card.assignees?.length) {
        continue;
      }
      if (card.lastDueSoonReminderAt) {
        continue;
      }
      const dueDate = card.dueDate as Date;

      const hoursUntilDue = Math.max(
        1,
        Math.round((dueDate.getTime() - now.getTime()) / (60 * 60 * 1000)),
      );

      await Promise.all(
        card.assignees.map(async (assignee) => {
          const projectId = card.list?.project?.id;
          const message = `"${card.title}" is due in ${hoursUntilDue} hour${
            hoursUntilDue === 1 ? '' : 's'
          }.`;

          if (assignee.notifyDueSoonInApp) {
            await this.notificationService.create(assignee, message, projectId);
          }

          if (assignee.notifyDueSoonEmail) {
            await this.mailService.queueEmail({
              to: assignee.email,
              subject: `Reminder: ${card.title} is due soon`,
              text: `${message} Due date: ${dueDate.toLocaleString()}.`,
            });
          }
        }),
      );

      card.lastDueSoonReminderAt = now;
      await this.cardRepository.save(card);
    }

    if (cards.length) {
      this.logger.debug(`Processed ${cards.length} due soon cards`);
    }
  }

  private async notifyOverdueCards(now: Date) {
    const cards = await this.cardRepository.find({
      where: {
        isCompleted: false,
        dueDate: LessThan(now),
      },
      relations: ['assignees', 'list', 'list.project'],
    });

    for (const card of cards) {
      if (!card.dueDate || !card.assignees?.length) {
        continue;
      }
      const dueDate = card.dueDate as Date;

      if (
        card.lastOverdueNotificationAt &&
        now.getTime() - card.lastOverdueNotificationAt.getTime() <
          24 * 60 * 60 * 1000
      ) {
        continue;
      }

      const overdueHours = Math.max(
        1,
        Math.round((now.getTime() - dueDate.getTime()) / (60 * 60 * 1000)),
      );
      const projectId = card.list?.project?.id;
      const message = `"${card.title}" is overdue by ${overdueHours} hour${
        overdueHours === 1 ? '' : 's'
      }.`;

      await Promise.all(
        card.assignees.map(async (assignee) => {
          if (assignee.notifyOverdueInApp) {
            await this.notificationService.create(assignee, message, projectId);
          }

          if (assignee.notifyOverdueEmail) {
            await this.mailService.queueEmail({
              to: assignee.email,
              subject: `Overdue: ${card.title}`,
              text: `${message} It was due on ${dueDate.toLocaleString()}.`,
            });
          }
        }),
      );

      card.lastOverdueNotificationAt = now;
      await this.cardRepository.save(card);
    }

    if (cards.length) {
      this.logger.debug(`Processed ${cards.length} overdue cards`);
    }
  }
}
