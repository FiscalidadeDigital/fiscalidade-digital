import { Module } from '@nestjs/common';

import { ObligationsController } from './obligations.controller';
import { ObligationsService } from './obligations.service';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalObligationPersistenceModule } from '../fiscal-obligation-persistence/fiscal-obligation-persistence.module';
import { FiscalEnrollmentModule } from '../fiscal-enrollment/fiscal-enrollment.module';

@Module({
  imports: [
    PrismaModule,
    FiscalObligationPersistenceModule,
    FiscalEnrollmentModule,
  ],

  controllers: [
    ObligationsController,
  ],

  providers: [
    ObligationsService,
  ],

  exports: [
    ObligationsService,
  ],
})
export class ObligationsModule {}
