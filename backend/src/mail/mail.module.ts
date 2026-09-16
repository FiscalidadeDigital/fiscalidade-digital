import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { MailService } from './mail.service';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';

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
  ],

  exports: [
    MailService,
    AlertsService,
  ],
})
export class MailModule {}