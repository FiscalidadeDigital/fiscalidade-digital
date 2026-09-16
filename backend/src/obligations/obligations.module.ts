import { Module } from '@nestjs/common';

import { ObligationsController } from './obligations.controller';
import { ObligationsService } from './obligations.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
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