import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ObligationsModule } from '../obligations/obligations.module';

import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    PrismaModule,
    ObligationsModule,
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