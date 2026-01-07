import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { MAIL_QUEUE, SEND_EMAIL_JOB } from './mail.constants';
import { MailJob } from './mail.types';

@Processor(MAIL_QUEUE)
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process(SEND_EMAIL_JOB)
  async handleSendEmail(job: Job<MailJob>) {
    const { to, subject, text, html } = job.data;
    await this.mailerService.sendMail({
      to,
      subject,
      text,
      html: html ?? (text ? `<p>${text}</p>` : undefined),
    });
    this.logger.debug(`Queued email delivered to ${to}`);
  }
}
