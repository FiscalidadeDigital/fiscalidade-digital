import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FiscalSituationService } from './fiscal-situation.service';

@Controller('fiscal-situation')
@UseGuards(JwtAuthGuard)
export class FiscalSituationController {
  constructor(private readonly service: FiscalSituationService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)
  get(@Req() req: Request & { user: { tenantId: string } }, @Query('period') period?: string) {
    return this.service.get(req.user.tenantId, this.parsePeriod(period));
  }

  private parsePeriod(value?: string) {
    if (!value) return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new BadRequestException('period must use YYYY-MM.');
    const [year, month] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, 1));
  }
}
