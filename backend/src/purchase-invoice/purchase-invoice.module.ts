import { Module } from '@nestjs/common';

import { PurchaseInvoiceController } from './purchase-invoice.controller';
import { PurchaseInvoiceService } from './purchase-invoice.service';

import { PrismaModule } from '../prisma/prisma.module';
import { ObligationsModule } from '../obligations/obligations.module';
import { FiscalEngineModule } from '../fiscal-engine/fiscal-engine.module';

@Module({
  imports: [
    PrismaModule,
    ObligationsModule,
    FiscalEngineModule,
  ],

  controllers: [
    PurchaseInvoiceController,
  ],

  providers: [
    PurchaseInvoiceService,
  ],

  exports: [
    PurchaseInvoiceService,
  ],
})
export class PurchaseInvoiceModule {}
