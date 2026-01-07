import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';
import { MAIL_QUEUE } from './mail.constants';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('MAIL_HOST');
        const port = configService.get<number>('MAIL_PORT');
        const user = configService.get<string>('MAIL_USER');
        const pass = configService.get<string>('MAIL_PASSWORD');
        const from =
          configService.get<string>('MAIL_FROM') ?? 'no-reply@projectflow.dev';

        if (!host) {
          return {
            transport: {
              jsonTransport: true,
            },
            defaults: { from },
          };
        }

        return {
          transport: {
            host,
            port: Number(port) || 587,
            secure: configService.get<string>('MAIL_SECURE') === 'true',
            auth: user
              ? {
                  user,
                  pass,
                }
              : undefined,
          },
          defaults: { from },
        };
      },
    }),
    BullModule.registerQueue({
      name: MAIL_QUEUE,
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
