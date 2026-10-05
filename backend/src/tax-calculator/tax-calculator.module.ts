import { Module } from '@nestjs/common';

import { TaxCalculatorController } from './tax-calculator.controller';

import { TaxCalculatorService } from './tax-calculator.service';

import { IvaEngine } from './engines/iva.engine';

import { RetentionEngine } from './engines/retention.engine';

import { IndustrialEngine } from './engines/industrial.engine';
import { FiscalEnrollmentModule } from '../fiscal-enrollment/fiscal-enrollment.module';

@Module({
  imports: [FiscalEnrollmentModule],
  controllers: [
    TaxCalculatorController,
  ],

  providers: [
    TaxCalculatorService,

    IvaEngine,

    RetentionEngine,

    IndustrialEngine,
  ],

  exports: [
    TaxCalculatorService,
  ],
})
export class TaxCalculatorModule {}
