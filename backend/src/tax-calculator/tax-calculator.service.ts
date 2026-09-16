import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { IvaEngine } from './engines/iva.engine';

import { RetentionEngine } from './engines/retention.engine';

import { IndustrialEngine } from './engines/industrial.engine';

import { CalculateIvaDto } from './dto/calculate-iva.dto';

import { CalculateRetentionDto } from './dto/calculate-retention.dto';

import { CalculateIndustrialDto } from './dto/calculate-industrial.dto';

@Injectable()
export class TaxCalculatorService {
  constructor(
    private readonly ivaEngine: IvaEngine,

    private readonly retentionEngine: RetentionEngine,

    private readonly industrialEngine: IndustrialEngine,
  ) {}

  // =====================================================
  // IVA
  // =====================================================

  async calculateIVA(
    tenantId: string,
    dto: CalculateIvaDto,
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Empresa autenticada não identificada.',
      );
    }

    return this.ivaEngine.calculate(
      tenantId,
      dto,
    );
  }

  // =====================================================
  // RETENÇÃO
  // =====================================================

  async calculateRetention(
    tenantId: string,
    dto: CalculateRetentionDto,
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Empresa autenticada não identificada.',
      );
    }

    return this.retentionEngine.calculate(
      tenantId,
      dto,
    );
  }

  // =====================================================
  // IMPOSTO INDUSTRIAL
  // =====================================================

  async calculateIndustrial(
    tenantId: string,
    dto: CalculateIndustrialDto,
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Empresa autenticada não identificada.',
      );
    }

    return this.industrialEngine.calculate(
      tenantId,
      dto,
    );
  }
}