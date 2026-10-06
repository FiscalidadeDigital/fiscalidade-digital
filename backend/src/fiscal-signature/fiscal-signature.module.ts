import { Module } from '@nestjs/common';

import { FiscalSignatureService } from './fiscal-signature.service';

@Module({
  providers: [FiscalSignatureService],
  exports: [FiscalSignatureService],
})
export class FiscalSignatureModule {}
