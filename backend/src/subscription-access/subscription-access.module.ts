import { Module } from '@nestjs/common';

import { SubscriptionAccessController } from './subscription-access.controller';
import { SubscriptionAccessService } from './subscription-access.service';

@Module({
  controllers: [SubscriptionAccessController],
  providers: [SubscriptionAccessService],
  exports: [SubscriptionAccessService],
})
export class SubscriptionAccessModule {}
