import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalEnrollmentModule } from '../fiscal-enrollment/fiscal-enrollment.module';

import { FiscalCalendarController } from './fiscal-calendar.controller';
import { FiscalCalendarService } from './fiscal-calendar.service';

@Module({
  imports: [
    PrismaModule,
    FiscalEnrollmentModule,
  ],

  controllers: [
    FiscalCalendarController,
  ],

  providers: [
    FiscalCalendarService,
  ],

  exports: [
    FiscalCalendarService,
  ],
})
export class FiscalCalendarModule {}
