import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FiscalEnrollmentModule } from '../fiscal-enrollment/fiscal-enrollment.module';
import { FiscalApplicabilityService } from './fiscal-applicability.service';
@Module({ imports: [PrismaModule, FiscalEnrollmentModule], providers: [FiscalApplicabilityService], exports: [FiscalApplicabilityService] })
export class FiscalApplicabilityModule {}
