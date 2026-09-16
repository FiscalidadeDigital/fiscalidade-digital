import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { LegislationLibraryController } from './legislation-library.controller';
import { LegislationLibraryService } from './legislation-library.service';

import { LegislationController } from './legislation.controller';
import { LegislationService } from './legislation.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    // Rotas específicas primeiro
    LegislationLibraryController,

    // Rotas tradicionais depois
    LegislationController,
  ],

  providers: [
    LegislationLibraryService,
    LegislationService,
  ],

  exports: [
    LegislationLibraryService,
    LegislationService,
  ],
})
export class LegislationModule {}