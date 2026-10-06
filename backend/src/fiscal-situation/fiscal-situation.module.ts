import { Module } from '@nestjs/common';
import { FiscalApplicabilityModule } from '../fiscal-applicability/fiscal-applicability.module';
import { FiscalEnrollmentModule } from '../fiscal-enrollment/fiscal-enrollment.module';
import { ObligationGenerationModule } from '../obligation-generation/obligation-generation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FiscalSituationController } from './fiscal-situation.controller';
import { FiscalSituationService } from './fiscal-situation.service';

@Module({ imports: [PrismaModule, FiscalApplicabilityModule, FiscalEnrollmentModule, ObligationGenerationModule], controllers: [FiscalSituationController], providers: [FiscalSituationService] })
export class FiscalSituationModule {}
