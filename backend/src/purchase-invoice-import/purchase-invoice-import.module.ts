import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { PurchaseInvoiceModule } from '../purchase-invoice/purchase-invoice.module';
import { PurchaseInvoiceImportController } from './purchase-invoice-import.controller';
import { PurchaseInvoiceImportService } from './purchase-invoice-import.service';

@Module({
  imports: [PrismaModule, PurchaseInvoiceModule],
  controllers: [PurchaseInvoiceImportController],
  providers: [PurchaseInvoiceImportService],
})
export class PurchaseInvoiceImportModule {}
