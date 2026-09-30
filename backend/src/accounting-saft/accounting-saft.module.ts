import { Module } from '@nestjs/common';

import { AccountingSaftController } from './accounting-saft.controller';
import { AccountingSaftService } from './accounting-saft.service';

@Module({
  controllers: [AccountingSaftController],
  providers: [AccountingSaftService],
  exports: [AccountingSaftService],
})
export class AccountingSaftModule {}
