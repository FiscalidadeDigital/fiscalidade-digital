import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { MailService } from './mail.service';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { TwilioMessagingService } from './twilio-messaging.service';
import { FiscalWatchModule } from '../fiscal-watch/fiscal-watch.module';
import { FiscalObligationEligibilityModule } from '../fiscal-obligation-eligibility/fiscal-obligation-eligibility.module';

@Module({
  imports: [PrismaModule, FiscalWatchModule, FiscalObligationEligibilityModule],

  controllers: [AlertsController],

  providers: [MailService, AlertsService, TwilioMessagingService],

  exports: [MailService, AlertsService, TwilioMessagingService],
})
export class MailModule {}
