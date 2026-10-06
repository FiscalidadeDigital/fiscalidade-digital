import { Module } from '@nestjs/common';

import { ObligationsController } from './obligations.controller';
import { ObligationsService } from './obligations.service';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalObligationPersistenceModule } from '../fiscal-obligation-persistence/fiscal-obligation-persistence.module';

@Module({
  imports: [
    PrismaModule,
    FiscalObligationPersistenceModule,
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
