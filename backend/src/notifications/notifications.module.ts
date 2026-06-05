import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

import { MailService } from '../mail/mail.service';
import { AlertsService } from '../mail/alerts.service';

@Module({
  imports: [PrismaModule],

  controllers: [NotificationsController],

  providers: [
    NotificationsService,
    MailService,
    AlertsService,
  ],

  exports: [
    NotificationsService,
    MailService,
  ],
})
export class NotificationsModule {}