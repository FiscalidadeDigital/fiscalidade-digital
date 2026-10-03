import { Module } from '@nestjs/common';

import { AccountingSaftController } from './accounting-saft.controller';
import { AccountingSaftService } from './accounting-saft.service';
import { SaftExportService } from '../saft/saft-export.service';
import { SaftXmlSerializer } from '../saft/serializers/saft-xml.serializer';
import { SaftXsdValidator } from '../saft/validators/saft-xsd.validator';
import { FiscalSignatureModule } from '../fiscal-signature/fiscal-signature.module';

@Module({
  imports: [FiscalSignatureModule],
  controllers: [AccountingSaftController],
  providers: [AccountingSaftService, SaftExportService, SaftXmlSerializer, SaftXsdValidator],
  exports: [AccountingSaftService, SaftExportService],
})
export class AccountingSaftModule {}
