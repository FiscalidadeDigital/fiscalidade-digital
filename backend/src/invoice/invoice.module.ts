import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ObligationsModule } from '../obligations/obligations.module';
import { FiscalEngineModule } from '../fiscal-engine/fiscal-engine.module';
import { FiscalSignatureModule } from '../fiscal-signature/fiscal-signature.module';
import { FiscalEnrollmentModule } from '../fiscal-enrollment/fiscal-enrollment.module';

import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    PrismaModule,
    ObligationsModule,
    FiscalEngineModule,
    FiscalSignatureModule,
    FiscalEnrollmentModule,
  ],

  controllers: [
    InvoiceController,
  ],

  providers: [
    InvoiceService,
  ],

  exports: [
    InvoiceService,
  ],
})
export class InvoiceModule {}
