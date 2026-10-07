import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CalculateRetentionDto } from '../dto/calculate-retention.dto';

/**
 * A retenção na fonte exige natureza jurídica, taxa e fonte oficial versionadas.
 * Sem esses elementos o simulador deve falhar fechado, nunca inferir uma taxa.
 */
@Injectable()
export class RetentionEngine {
  async calculate(tenantId: string, dto: CalculateRetentionDto) {
    if (!tenantId) {
      throw new BadRequestException('Empresa autenticada não identificada.');
    }

    if (!dto) {
      throw new BadRequestException('Dados do cálculo não enviados.');
    }

    let amount: Prisma.Decimal;
    try {
      amount = new Prisma.Decimal(dto.amount);
    } catch {
      throw new BadRequestException(
        'O valor do serviço deve ser um número válido.',
      );
    }

    if (!amount.isFinite() || amount.isNegative()) {
      throw new BadRequestException(
        'O valor do serviço deve ser um número válido.',
      );
    }

    const taxableBase = amount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      success: true,
      tenantId,
      // Decimal is serialised as a fixed monetary string so the UI does not
      // receive a binary-float approximation for an unconfirmed calculation.
      amount: taxableBase.toFixed(2),
      taxableBase: taxableBase.toFixed(2),
      rate: null,
      ratePercent: null,
      retention: null,
      netAmount: null,
      currency: 'AOA',
      taxType: 'RETENCAO',
      nature: 'SERVICO_SUJEITO_RETENCAO',
      calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION',
      ruleVersion: null,
      legalSource: null,
      message:
        'A retenção não foi calculada: a natureza da operação, a taxa aplicável e a respectiva fonte oficial ainda não estão configuradas como regra fiscal versionada.',
    };
  }
}
