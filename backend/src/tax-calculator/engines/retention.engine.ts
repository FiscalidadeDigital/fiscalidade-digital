import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { CalculateRetentionDto } from '../dto/calculate-retention.dto';

@Injectable()
export class RetentionEngine {
  // =====================================================
  // TAXA DE RETENÇÃO
  // =====================================================

  /**
   * Taxa de 6,5% aplicável às situações de rendimento
   * sujeitas a retenção na fonte previstas na legislação
   * aplicável.
   *
   * IMPORTANTE:
   * Esta taxa não deve ser aplicada automaticamente a
   * qualquer operação da empresa.
   *
   * O enquadramento da operação deve ser determinado
   * antes de chamar este cálculo.
   */
  private readonly RETENTION_RATE = 0.065;

  // =====================================================
  // CALCULAR RETENÇÃO
  // =====================================================

  async calculate(
    tenantId: string,
    dto: CalculateRetentionDto,
  ) {
    // ===================================================
    // VALIDAR EMPRESA
    // ===================================================

    if (!tenantId) {
      throw new BadRequestException(
        'Empresa autenticada não identificada.',
      );
    }

    // ===================================================
    // VALIDAR DADOS
    // ===================================================

    if (!dto) {
      throw new BadRequestException(
        'Dados do cálculo não enviados.',
      );
    }

    // ===================================================
    // VALIDAR VALOR
    // ===================================================

    const amount =
      Number(dto.amount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      throw new BadRequestException(
        'O valor do serviço deve ser um número válido.',
      );
    }

    // ===================================================
    // CÁLCULO
    // ===================================================

    const rate =
      this.RETENTION_RATE;

    const retention =
      amount * rate;

    const netAmount =
      amount - retention;

    // ===================================================
    // RESULTADO
    // ===================================================

    return {
      success: true,

      tenantId,

      amount,

      taxableBase:
        amount,

      rate,

      ratePercent:
        rate * 100,

      retention,

      netAmount,

      currency: 'AOA',

      taxType:
        'RETENCAO',

      nature:
        'SERVICO_SUJEITO_RETENCAO',

      message:
        'Cálculo de retenção de 6,5%. A aplicação da retenção deve ser confirmada de acordo com a natureza da operação e o enquadramento fiscal aplicável.',
    };
  }
}