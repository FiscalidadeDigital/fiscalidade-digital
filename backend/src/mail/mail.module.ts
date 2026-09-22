import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { MailService } from './mail.service';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { TwilioMessagingService } from './twilio-messaging.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    AlertsController,
  ],

  providers: [
    MailService,
    AlertsService,
    TwilioMessagingService,
  ],

  exports: [
    MailService,
    AlertsService,
    TwilioMessagingService,
  ],
})
export class MailModule {}
