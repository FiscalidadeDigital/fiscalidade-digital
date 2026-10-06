import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FiscalRegime, TaxType, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FiscalSituationService } from './fiscal-situation.service';
import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';
import { ObligationGenerationService } from '../obligation-generation/obligation-generation.service';

@Controller('fiscal-situation')
@UseGuards(JwtAuthGuard)
export class FiscalSituationController {
  constructor(private readonly service: FiscalSituationService, private readonly enrollments: FiscalEnrollmentService, private readonly generation: ObligationGenerationService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)
  get(@Req() req: Request & { user: { tenantId: string } }, @Query('period') period?: string) {
    return this.service.get(req.user.tenantId, this.parsePeriod(period));
  }

  @Post('confirm')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  async confirm(@Req() req: Request & { user: { tenantId: string } }, @Body() body: { taxType: TaxType; regime: FiscalRegime; validFrom: string }) {
    const assignment = await this.enrollments.create(req.user.tenantId, body);
    await this.generation.generate(req.user.tenantId, new Date());
    return assignment;
  }

  private parsePeriod(value?: string) {
    if (!value) return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new BadRequestException('period must use YYYY-MM.');
    const [year, month] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, 1));
  }
}
