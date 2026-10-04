import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FiscalEnrollmentService } from './fiscal-enrollment.service';
@Module({ imports: [PrismaModule], providers: [FiscalEnrollmentService], exports: [FiscalEnrollmentService] })
export class FiscalEnrollmentModule {}
