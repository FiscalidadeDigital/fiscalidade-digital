import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { FiscalCalendarController } from './fiscal-calendar.controller';
import { FiscalCalendarService } from './fiscal-calendar.service';

@Module({
  imports: [
    PrismaModule,
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