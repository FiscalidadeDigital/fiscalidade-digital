import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalObligationPersistenceModule } from '../fiscal-obligation-persistence/fiscal-obligation-persistence.module';
import { FiscalEnrollmentModule } from '../fiscal-enrollment/fiscal-enrollment.module';

import { FiscalEngineController } from './fiscal-engine.controller';
import { FiscalEngineService } from './fiscal-engine.service';

@Module({
  imports: [
    PrismaModule,
    FiscalObligationPersistenceModule,
    FiscalEnrollmentModule,
  ],

  controllers: [
    FiscalEngineController,
  ],

  providers: [
    FiscalEngineService,
  ],

  exports: [
    FiscalEngineService,
  ],
})
export class FiscalEngineModule {}
