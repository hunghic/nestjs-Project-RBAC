import { MAIL_QUEUE } from './../common/constants';
import { WebsocketModule } from './../websocket/websocket.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail/mail.service';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './mail/mail.processor';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"No Reply" <${config.get('MAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, 'mail', 'templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: MAIL_QUEUE,
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    WebsocketModule,
  ],
  providers: [MailService, MailProcessor, NotificationsService],
  exports: [MailService, NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
