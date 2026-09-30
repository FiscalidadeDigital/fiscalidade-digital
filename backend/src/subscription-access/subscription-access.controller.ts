import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { SubscriptionAccessService } from './subscription-access.service';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionAccessController {
  constructor(
    private readonly subscriptionAccessService: SubscriptionAccessService,
  ) {}

  @Get('status')
  getStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionAccessService.getStatus(user.tenantId);
  }
}
