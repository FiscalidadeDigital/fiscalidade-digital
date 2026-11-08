import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FiscalEnrollmentLifecycleService } from './fiscal-enrollment-lifecycle.service';
import { FiscalEnrollmentService } from './fiscal-enrollment.service';
import { FiscalEnrollmentController } from './fiscal-enrollment.controller';
@Module({
  imports: [PrismaModule],
  controllers: [FiscalEnrollmentController],
  providers: [FiscalEnrollmentService, FiscalEnrollmentLifecycleService],
  exports: [FiscalEnrollmentService],
})
export class FiscalEnrollmentModule {}
