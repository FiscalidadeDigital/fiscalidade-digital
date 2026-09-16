import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { CalculateIndustrialDto } from '../dto/calculate-industrial.dto';

@Injectable()
export class IndustrialEngine {
  // =====================================================
  // TAXAS DO IMPOSTO INDUSTRIAL
  // =====================================================

  /**
   * Taxa geral do Imposto Industrial.
   *
   * Conforme regra geral divulgada pela AGT:
   * 25%.
   */
  private readonly GENERAL_RATE = 0.25;

  /**
   * Taxa da liquidação provisória do Imposto Industrial.
   *
   * Em 2026, para o Regime Geral:
   * 2% sobre o volume das vendas de bens e
   * prestações de serviços não sujeitas a retenção
   * efectuadas nos primeiros seis meses.
   */
  private readonly PROVISIONAL_RATE = 0.02;

  // =====================================================
  // CALCULAR IMPOSTO INDUSTRIAL
  // =====================================================

  async calculate(
    tenantId: string,
    dto: CalculateIndustrialDto,
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Empresa autenticada não identificada.',
      );
    }

    if (!dto) {
      throw new BadRequestException(
        'Dados do cálculo não enviados.',
      );
    }

    const receitas = Number(dto.receitas);
    const custos = Number(dto.custos);

    if (
      !Number.isFinite(receitas) ||
      receitas < 0
    ) {
      throw new BadRequestException(
        'O valor das receitas deve ser um número válido.',
      );
    }

    if (
      !Number.isFinite(custos) ||
      custos < 0
    ) {
      throw new BadRequestException(
        'O valor dos custos deve ser um número válido.',
      );
    }

    if (custos > receitas) {
      throw new BadRequestException(
        'Os custos não podem ser superiores às receitas neste cálculo simplificado.',
      );
    }

    // ===================================================
    // MATÉRIA COLECTÁVEL SIMPLIFICADA
    // ===================================================

    const taxableBase =
      Math.max(
        receitas - custos,
        0,
      );

    // ===================================================
    // IMPOSTO INDUSTRIAL DEFINITIVO TEÓRICO
    // ===================================================

    const industrialTax =
      taxableBase *
      this.GENERAL_RATE;

    // ===================================================
    // LIQUIDAÇÃO PROVISÓRIA
    //
    // A liquidação provisória é calculada sobre
    // as vendas/prestações dos primeiros 6 meses,
    // não sobre o lucro.
    //
    // Como este DTO não recebe os 6 meses separadamente,
    // usamos "receitas" como base informada pelo utilizador.
    // O motor fiscal integrado deverá posteriormente
    // calcular esta base directamente das facturas.
    // ===================================================

    const provisionalTax =
      receitas *
      this.PROVISIONAL_RATE;

    // ===================================================
    // RESULTADO
    // ===================================================

    return {
      success: true,

      tenantId,

      currency: 'AOA',

      // Valores de entrada
      receitas,

      custos,

      // Matéria colectável simplificada
      taxableBase,

      // Taxa definitiva geral
      rate: this.GENERAL_RATE,

      ratePercent:
        this.GENERAL_RATE * 100,

      // Imposto Industrial calculado
      industrialTax,

      // Liquidação provisória
      provisionalRate:
        this.PROVISIONAL_RATE,

      provisionalRatePercent:
        this.PROVISIONAL_RATE * 100,

      provisionalBase:
        receitas,

      provisionalTax,

      // Informação
      regime: 'GERAL',

      message:
        'Cálculo simplificado do Imposto Industrial. A liquidação definitiva depende do apuramento fiscal da matéria colectável nos termos aplicáveis ao contribuinte.',
    };
  }
}