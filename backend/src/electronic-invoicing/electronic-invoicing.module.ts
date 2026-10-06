import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgtClientService } from './agt-client.service';
import { AgtJwsService } from './agt-jws.service';
import { ElectronicInvoicingController } from './electronic-invoicing.controller';
import { ElectronicInvoicingService } from './electronic-invoicing.service';

@Module({
  imports: [PrismaModule],
  controllers: [ElectronicInvoicingController],
  providers: [AgtClientService, AgtJwsService, ElectronicInvoicingService],
  exports: [ElectronicInvoicingService],
})
export class ElectronicInvoicingModule {}
