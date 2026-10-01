import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FiscalRegime, Prisma } from '@prisma/client';

import { CalculateIvaDto, IvaOperation } from '../dto/calculate-iva.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IVA_LEGAL_SOURCE,
  IVA_RATES_FROM_2023_12_28,
} from '../../fiscal-rules/iva-rules';

const asDisplayNumber = (value: Prisma.Decimal) =>
  Number(value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2));

@Injectable()
export class IvaEngine {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(tenantId: string, dto: CalculateIvaDto) {
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
      throw new BadRequestException('O valor da operação deve ser um número válido.');
    }

    if (!amount.isFinite() || amount.isNegative()) {
      throw new BadRequestException('O valor da operação deve ser um número válido.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, nif: true, regime: true },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const isSimplified = tenant.regime === FiscalRegime.SIMPLIFICADO;
    const rate = new Prisma.Decimal(
      isSimplified
        ? IVA_RATES_FROM_2023_12_28.simplifiedSettlement
        : IVA_RATES_FROM_2023_12_28.general,
    );
    const hasLineClassification = Boolean(dto.productType?.trim());
    const isPurchase =
      dto.operation === IvaOperation.PURCHASE || dto.operation === IvaOperation.IMPORT;
    const preview = amount.mul(rate);
    const requiresReview = !hasLineClassification || dto.operation === IvaOperation.EXPORT;

    // A calculator result is a review aid only. It never records or confirms
    // a fiscal deduction; that decision is made from the reviewed purchase.
    return {
      success: true,
      tenantId,
      company: { id: tenant.id, name: tenant.name, nif: tenant.nif },
      regime: tenant.regime,
      operation: dto.operation,
      amount: asDisplayNumber(amount),
      taxableBase: asDisplayNumber(amount),
      rate: asDisplayNumber(rate),
      ratePercent: asDisplayNumber(rate.mul(100)),
      iva: isPurchase ? 0 : asDisplayNumber(preview),
      supportedIva: isPurchase ? asDisplayNumber(preview) : 0,
      deductibleIva: 0,
      total: asDisplayNumber(isPurchase ? amount.plus(preview) : amount.plus(preview)),
      currency: 'AOA',
      productType: dto.productType || null,
      description: dto.description || null,
      calculationStatus: requiresReview ? 'REVIEW_REQUIRED' : 'PREVIEW_ONLY',
      ruleVersion: isSimplified
        ? 'AO-CIVA-LEI-14-23-ART19-B-69B-69C'
        : 'AO-CIVA-LEI-14-23-ART19-A',
      legalSource: IVA_LEGAL_SOURCE.officialUrl,
      message: isPurchase
        ? 'IVA suportado indicado para revisão. Não é IVA dedutível até existir confirmação humana e documentação válida.'
        : requiresReview
          ? 'Prévia de IVA sujeita a revisão: faltam classificação fiscal suficiente ou enquadramento específico da operação.'
          : 'Prévia de IVA. A liquidação final depende da classificação fiscal e da documentação da operação.',
    };
  }
}
