import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FiscalObligationPersistenceService } from './fiscal-obligation-persistence.service';

@Module({
  imports: [PrismaModule],
  providers: [FiscalObligationPersistenceService],
  exports: [FiscalObligationPersistenceService],
})
export class FiscalObligationPersistenceModule {}
