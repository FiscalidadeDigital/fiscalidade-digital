import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalObligationEligibilityModule } from '../fiscal-obligation-eligibility/fiscal-obligation-eligibility.module';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [PrismaModule, FiscalObligationEligibilityModule],

  controllers: [DashboardController],

  providers: [DashboardService],

  exports: [DashboardService],
})
export class DashboardModule {}
