import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import {
  FiscalRegime,
  TaxType,
  ObligationType,
} from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { FiscalCalendarService } from './fiscal-calendar.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
  };
}

@Controller('fiscal-calendar')
@UseGuards(JwtAuthGuard)
export class FiscalCalendarController {
  constructor(
    private readonly fiscalCalendarService: FiscalCalendarService,
  ) {}

  // =====================================================
  // CALENDÁRIO DA EMPRESA AUTENTICADA
  // =====================================================

  @Get('my')
  async findMyCalendar(
    @Req() req: AuthenticatedRequest,
    @Query('referenceYear') referenceYear?: string,
  ) {
    const tenantId = req.user.tenantId;

    const year = this.parseYear(referenceYear);

    return this.fiscalCalendarService.findForTenant(
      tenantId,
      year,
    );
  }

  // =====================================================
  // LISTAR CALENDÁRIO FISCAL
  // =====================================================

  @Get()
  async findAll(
    @Query('referenceYear') referenceYear?: string,
  ) {
    const year = this.parseYear(referenceYear);

    return this.fiscalCalendarService.findAll(
      year,
    );
  }

  // =====================================================
  // CALENDÁRIO POR REGIME
  // =====================================================

  @Get('regime/:regime')
  async findByRegime(
    @Param('regime') regime: string,
    @Query('referenceYear') referenceYear?: string,
  ) {
    const normalized =
      regime.trim().toUpperCase();

    if (
      !Object.values(FiscalRegime).includes(
        normalized as FiscalRegime,
      )
    ) {
      throw new BadRequestException(
        `Regime fiscal inválido: ${regime}.`,
      );
    }

    const year = this.parseYear(referenceYear);

    return this.fiscalCalendarService.findByRegime(
      normalized as FiscalRegime,
      year,
    );
  }

  // =====================================================
  // CALENDÁRIO POR TIPO DE IMPOSTO
  // =====================================================

  @Get('tax/:taxType')
  async findByTaxType(
    @Param('taxType') taxType: string,
    @Query('referenceYear') referenceYear?: string,
  ) {
    const normalized =
      taxType.trim().toUpperCase();

    if (
      !Object.values(TaxType).includes(
        normalized as TaxType,
      )
    ) {
      throw new BadRequestException(
        `Tipo de imposto inválido: ${taxType}.`,
      );
    }

    const year = this.parseYear(referenceYear);

    return this.fiscalCalendarService.findByTaxType(
      normalized as TaxType,
      year,
    );
  }

  // =====================================================
  // CALENDÁRIO POR TIPO DE OBRIGAÇÃO
  // =====================================================

  @Get('obligation/:type')
  async findByObligationType(
    @Param('type') type: string,
    @Query('referenceYear') referenceYear?: string,
  ) {
    const normalized =
      type.trim().toUpperCase();

    if (
      !Object.values(ObligationType).includes(
        normalized as ObligationType,
      )
    ) {
      throw new BadRequestException(
        `Tipo de obrigação inválido: ${type}.`,
      );
    }

    const year = this.parseYear(referenceYear);

    return this.fiscalCalendarService.findByObligationType(
      normalized as ObligationType,
      year,
    );
  }

  // =====================================================
  // BUSCAR ITEM DO CALENDÁRIO
  // =====================================================

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.fiscalCalendarService.findOne(id);
  }

  // =====================================================
  // VALIDAR ANO
  // =====================================================

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

    const year = Number(value);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new BadRequestException(
        'Ano de referência inválido.',
      );
    }

    return year;
  }
}