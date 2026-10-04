import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalObligationPersistenceModule } from '../fiscal-obligation-persistence/fiscal-obligation-persistence.module';

import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [
    PrismaModule,
    FiscalObligationPersistenceModule,
  ],

  controllers: [
    PayrollController,
  ],

  providers: [
    PayrollService,
  ],

  exports: [
    PayrollService,
  ],
})
export class PayrollModule {}
