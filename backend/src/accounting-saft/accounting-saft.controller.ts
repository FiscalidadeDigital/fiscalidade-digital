import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AccountingSaftService } from './accounting-saft.service';
import { SaftReadinessQueryDto } from './dto/saft-readiness-query.dto';

@Controller('accounting/saft')
@UseGuards(JwtAuthGuard)
export class AccountingSaftController {
  constructor(private readonly accountingSaftService: AccountingSaftService) {}

  @Get('readiness')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  getReadiness(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: SaftReadinessQueryDto,
  ) {
    return this.accountingSaftService.getReadiness(
      user.tenantId,
      query.fiscalYear,
    );
  }
}
