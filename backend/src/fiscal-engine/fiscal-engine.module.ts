import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { FiscalEngineController } from './fiscal-engine.controller';
import { FiscalEngineService } from './fiscal-engine.service';

@Module({
  imports: [
    PrismaModule,
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