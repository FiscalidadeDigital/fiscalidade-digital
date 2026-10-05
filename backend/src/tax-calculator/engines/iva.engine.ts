import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FiscalRegime, Prisma, TaxType } from '@prisma/client';

import { CalculateIvaDto, IvaOperation } from '../dto/calculate-iva.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { FiscalEnrollmentService } from '../../fiscal-enrollment/fiscal-enrollment.service';
import {
  IVA_LEGAL_SOURCE,
  IVA_RATES_FROM_2023_12_28,
} from '../../fiscal-rules/iva-rules';

const asDisplayNumber = (value: Prisma.Decimal) =>
  Number(value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2));

@Injectable()
export class IvaEngine {
  constructor(private readonly prisma: PrismaService, private readonly enrollments: FiscalEnrollmentService) {}

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

    const enrollment = await this.enrollments.resolve(tenantId, TaxType.IVA, new Date());
    if (!enrollment) {
      return { success: true, tenantId, company: { id: tenant.id, name: tenant.name, nif: tenant.nif }, regime: null, operation: dto.operation, amount: asDisplayNumber(amount), taxableBase: asDisplayNumber(amount), rate: 0, ratePercent: 0, iva: 0, supportedIva: 0, deductibleIva: 0, total: asDisplayNumber(amount), currency: 'AOA', productType: dto.productType || null, description: dto.description || null, calculationStatus: 'NEEDS_CONFIGURATION', ruleVersion: null, legalSource: null, message: 'Sem enquadramento IVA vigente para o período. A simulação não assume Tenant.regime.' };
    }
    const isSimplified = enrollment.regime === FiscalRegime.SIMPLIFICADO;
    if (isSimplified) {
      return { success: true, tenantId, company: { id: tenant.id, name: tenant.name, nif: tenant.nif }, regime: enrollment.regime, operation: dto.operation, amount: asDisplayNumber(amount), taxableBase: asDisplayNumber(amount), rate: 0, ratePercent: 0, iva: 0, supportedIva: 0, deductibleIva: 0, total: asDisplayNumber(amount), currency: 'AOA', productType: dto.productType || null, description: dto.description || null, calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION', ruleVersion: enrollment.legalReference || null, legalSource: enrollment.officialSourceUrl || null, message: 'O enquadramento IVA Simplificado foi reconhecido, mas a fórmula definitiva não está automatizada sem confirmação oficial.' };
    }
    const rate = new Prisma.Decimal(
      IVA_RATES_FROM_2023_12_28.general,
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
      regime: enrollment.regime,
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
      ruleVersion: 'AO-CIVA-LEI-14-23-ART19-A',
      legalSource: IVA_LEGAL_SOURCE.officialUrl,
      message: isPurchase
        ? 'IVA suportado indicado para revisão. Não é IVA dedutível até existir confirmação humana e documentação válida.'
        : requiresReview
          ? 'Prévia de IVA sujeita a revisão: faltam classificação fiscal suficiente ou enquadramento específico da operação.'
          : 'Prévia de IVA. A liquidação final depende da classificação fiscal e da documentação da operação.',
    };
  }
}
