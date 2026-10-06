import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FiscalWatchService } from './fiscal-watch.service';

@Module({ imports: [PrismaModule], providers: [FiscalWatchService], exports: [FiscalWatchService] })
export class FiscalWatchModule {}
