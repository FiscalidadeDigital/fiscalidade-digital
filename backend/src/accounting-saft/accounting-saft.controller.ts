import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AccountingSaftService } from './accounting-saft.service';
import { SaftReadinessQueryDto } from './dto/saft-readiness-query.dto';
import { SaftPeriodQueryDto } from './dto/saft-period-query.dto';
import { SaftExportService } from '../saft/saft-export.service';

@Controller('accounting/saft')
@UseGuards(JwtAuthGuard)
export class AccountingSaftController {
  constructor(
    private readonly accountingSaftService: AccountingSaftService,
    private readonly saftExportService: SaftExportService,
  ) {}

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

  @Get('preflight')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  getPreflight(@CurrentUser() user: CurrentUserPayload, @Query() query: SaftPeriodQueryDto) {
    return this.saftExportService.preflight(user.tenantId, query.fiscalYear);
  }

  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  getSummary(@CurrentUser() user: CurrentUserPayload, @Query() query: SaftPeriodQueryDto) {
    return this.saftExportService.summary(user.tenantId, query.fiscalYear);
  }

  @Get('generate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  generate(@CurrentUser() user: CurrentUserPayload, @Query() query: SaftPeriodQueryDto) {
    return this.saftExportService.generate(user.tenantId, user.userId, query.fiscalYear);
  }

  @Get('download')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  async download(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: SaftPeriodQueryDto,
    @Res() response: Response,
  ) {
    const result = await this.saftExportService.generate(user.tenantId, user.userId, query.fiscalYear);
    response.setHeader('Content-Type', 'application/xml; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    response.send(result.xml);
  }
}
