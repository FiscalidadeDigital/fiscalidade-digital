import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalObligationEligibilityModule } from '../fiscal-obligation-eligibility/fiscal-obligation-eligibility.module';

import { NotificationController } from './notification.controller';

import { NotificationService } from './notification.service';

@Module({
  imports: [PrismaModule, FiscalObligationEligibilityModule],

  controllers: [NotificationController],

  providers: [NotificationService],

  exports: [NotificationService],
})
export class NotificationModule {}
