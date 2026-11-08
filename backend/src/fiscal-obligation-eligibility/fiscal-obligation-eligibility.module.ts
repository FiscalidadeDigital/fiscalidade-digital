import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalObligationEligibilityService } from './fiscal-obligation-eligibility.service';

@Module({
  imports: [PrismaModule],
  providers: [FiscalObligationEligibilityService],
  exports: [FiscalObligationEligibilityService],
})
export class FiscalObligationEligibilityModule {}
