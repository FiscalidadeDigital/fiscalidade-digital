import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { FiscalEngineService } from './fiscal-engine.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
  };
}

@Controller('fiscal-engine')
@UseGuards(JwtAuthGuard)
export class FiscalEngineController {
  constructor(
    private readonly fiscalEngineService: FiscalEngineService,
  ) {}

  // =========================================================
  // SINCRONIZAR MOTOR FISCAL
  // =========================================================
  //
  // POST /fiscal-engine/sync
  //
  // Opcional:
  // POST /fiscal-engine/sync?year=2026
  //
  // Reprocessa a actividade fiscal real da empresa:
  //
  // Facturas
  // Compras
  // Payroll
  // Receitas
  //
  // e reconstrói as TaxTransactions e TaxAssessments.
  // =========================================================

  @Post('sync')
  async sync(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
  ) {
    const tenantId =
      req.user.tenantId;

    const referenceYear =
      this.parseYear(year);

    return this.fiscalEngineService.syncTenant(
      tenantId,
      referenceYear,
    );
  }

  // =========================================================
  // RESUMO FISCAL
  // =========================================================
  //
  // GET /fiscal-engine/summary
  //
  // Opcional:
  // GET /fiscal-engine/summary?year=2026
  // =========================================================

  @Get('summary')
  async summary(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
  ) {
    const tenantId =
      req.user.tenantId;

    const referenceYear =
      this.parseYear(year);

    return this.fiscalEngineService.summary(
      tenantId,
      referenceYear,
    );
  }

  // =========================================================
  // ESTADO DO MOTOR
  // =========================================================
  //
  // GET /fiscal-engine/status
  //
  // Usado pelo Dashboard para saber se o motor fiscal
  // está sincronizado e obter os últimos resultados.
  // =========================================================

  @Get('status')
  async status(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
  ) {
    const tenantId =
      req.user.tenantId;

    const referenceYear =
      this.parseYear(year);

    const fiscal =
      await this.fiscalEngineService.summary(
        tenantId,
        referenceYear,
      );

    return {
      success: true,

      tenantId,

      year:
        referenceYear ??
        new Date().getFullYear(),

      fiscal,

      checkedAt:
        new Date(),
    };
  }

  // =========================================================
  // VALIDAR ANO
  // =========================================================

  private parseYear(
    value?: string,
  ): number | undefined {
    if (
      value === undefined ||
      value === null ||
      value.trim() === ''
    ) {
      return undefined;
    }

    const year =
      Number(value);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return undefined;
    }

    return year;
  }
}