import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CalculateIvaDto,
  IvaOperation,
} from '../dto/calculate-iva.dto';

import {
  FiscalRegime,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IvaEngine {
  // =====================================================
  // TAXAS DE IVA
  // =====================================================

  /**
   * Regime Geral
   *
   * Taxa geral do IVA em Angola.
   */
  private readonly GENERAL_IVA_RATE = 0.14;

  /**
   * Regime Simplificado
   *
   * Taxa utilizada no apuramento do IVA do
   * Regime Simplificado.
   */
  private readonly SIMPLIFIED_IVA_RATE = 0.07;

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // CALCULAR IVA
  // =====================================================

  async calculate(
    tenantId: string,
    dto: CalculateIvaDto,
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

    const amount = Number(dto.amount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      throw new BadRequestException(
        'O valor da operação deve ser um número válido.',
      );
    }

    // ===================================================
    // OBTER EMPRESA
    // ===================================================

    const tenant =
      await this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },

        select: {
          id: true,
          name: true,
          nif: true,
          regime: true,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    // ===================================================
    // EXPORTAÇÃO
    //
    // Exportações são tratadas com taxa de IVA 0%
    // neste calculador.
    // ===================================================

    if (
      dto.operation === IvaOperation.EXPORT
    ) {
      return {
        success: true,

        tenantId,

        company: {
          id: tenant.id,
          name: tenant.name,
          nif: tenant.nif,
        },

        regime: tenant.regime,

        operation: dto.operation,

        amount,

        taxableBase: amount,

        rate: 0,

        ratePercent: 0,

        iva: 0,

        deductibleIva: 0,

        total: amount,

        currency: 'AOA',

        productType:
          dto.productType || null,

        description:
          dto.description || null,

        message:
          'Operação de exportação calculada com taxa de IVA de 0%.',
      };
    }

    // ===================================================
    // DETERMINAR TAXA PELO REGIME
    // ===================================================

    const isSimplified =
      tenant.regime ===
      FiscalRegime.SIMPLIFICADO;

    const rate =
      isSimplified
        ? this.SIMPLIFIED_IVA_RATE
        : this.GENERAL_IVA_RATE;

    // ===================================================
    // COMPRAS / IMPORTAÇÕES
    //
    // O IVA suportado numa compra não deve ser tratado
    // como IVA liquidado ao cliente.
    //
    // Retornamos o valor como IVA suportado/dedutível
    // para o cálculo isolado.
    // ===================================================

    if (
      dto.operation === IvaOperation.PURCHASE ||
      dto.operation === IvaOperation.IMPORT
    ) {
      const iva =
        amount * rate;

      return {
        success: true,

        tenantId,

        company: {
          id: tenant.id,
          name: tenant.name,
          nif: tenant.nif,
        },

        regime: tenant.regime,

        operation: dto.operation,

        amount,

        taxableBase: amount,

        rate,

        ratePercent:
          rate * 100,

        iva: 0,

        supportedIva: iva,

        deductibleIva:
          isSimplified
            ? 0
            : iva,

        total:
          amount + iva,

        currency: 'AOA',

        productType:
          dto.productType || null,

        description:
          dto.description || null,

        message:
          isSimplified
            ? 'Operação de aquisição calculada no contexto do Regime Simplificado. A dedução depende das regras e documentação aplicáveis.'
            : 'IVA suportado na aquisição calculado para efeitos de apuramento do IVA dedutível.',
      };
    }

    // ===================================================
    // VENDA / PRESTAÇÃO DE SERVIÇOS
    // ===================================================

    const iva =
      amount * rate;

    const total =
      amount + iva;

    // ===================================================
    // RESULTADO
    // ===================================================

    return {
      success: true,

      tenantId,

      company: {
        id: tenant.id,
        name: tenant.name,
        nif: tenant.nif,
      },

      regime: tenant.regime,

      operation:
        dto.operation,

      amount,

      taxableBase:
        amount,

      rate,

      ratePercent:
        rate * 100,

      iva,

      deductibleIva: 0,

      total,

      currency: 'AOA',

      productType:
        dto.productType || null,

      description:
        dto.description || null,

      message:
        isSimplified
          ? 'Cálculo efectuado à taxa de 7% do Regime Simplificado. No apuramento periódico devem ser consideradas as operações efectivamente recebidas e as deduções permitidas.'
          : 'Cálculo efectuado à taxa geral de IVA de 14%.',
    };
  }
}