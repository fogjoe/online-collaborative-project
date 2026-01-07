import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { MAIL_QUEUE, SEND_EMAIL_JOB } from './mail.constants';
import { MailJob } from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) {}

  async queueEmail(job: MailJob) {
    if (!job.to) {
      this.logger.warn('Skipping email job with missing recipient');
      return;
    }

    await this.mailQueue.add(SEND_EMAIL_JOB, job, {
      attempts: 3,
      backoff: 10000,
      removeOnComplete: 50,
      removeOnFail: 100,
    });
  }
}
