import { Module } from '@nestjs/common';
import { FiscalApplicabilityModule } from '../fiscal-applicability/fiscal-applicability.module';
import { FiscalObligationPersistenceModule } from '../fiscal-obligation-persistence/fiscal-obligation-persistence.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ObligationGenerationService } from './obligation-generation.service';

@Module({
  imports: [PrismaModule, FiscalApplicabilityModule, FiscalObligationPersistenceModule],
  providers: [ObligationGenerationService],
  exports: [ObligationGenerationService],
})
export class ObligationGenerationModule {}
