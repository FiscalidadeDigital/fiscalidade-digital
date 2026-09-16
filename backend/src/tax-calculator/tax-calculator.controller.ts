import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { TaxCalculatorService } from './tax-calculator.service';

import { CalculateIvaDto } from './dto/calculate-iva.dto';

import { CalculateRetentionDto } from './dto/calculate-retention.dto';

import { CalculateIndustrialDto } from './dto/calculate-industrial.dto';

interface AuthenticatedRequest
  extends Request {
  user: {
    tenantId: string;
  };
}

@Controller('tax-calculator')
@UseGuards(JwtAuthGuard)
export class TaxCalculatorController {
  constructor(
    private readonly taxCalculatorService: TaxCalculatorService,
  ) {}

  // =====================================================
  // IVA
  // =====================================================

  @Post('iva')
  async calculateIVA(
    @Body() dto: CalculateIvaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taxCalculatorService.calculateIVA(
      req.user.tenantId,
      dto,
    );
  }

  // =====================================================
  // RETENÇÃO
  // =====================================================

  @Post('retention')
  async calculateRetention(
    @Body() dto: CalculateRetentionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taxCalculatorService.calculateRetention(
      req.user.tenantId,
      dto,
    );
  }

  // =====================================================
  // INDUSTRIAL
  // =====================================================

  @Post('industrial')
  async calculateIndustrial(
    @Body() dto: CalculateIndustrialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taxCalculatorService.calculateIndustrial(
      req.user.tenantId,
      dto,
    );
  }
}