import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { ObligationsController } from './obligations.controller';
import { ObligationsService } from './obligations.service';

@Module({
  imports: [PrismaModule],
  controllers: [ObligationsController],
  providers: [ObligationsService],
  exports: [ObligationsService],
})
export class ObligationsModule {}