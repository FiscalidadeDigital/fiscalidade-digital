import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TaxType } from '@prisma/client';

import { CalculateIndustrialDto } from '../dto/calculate-industrial.dto';
import { industrialAssessmentRequiresReview } from '../../fiscal-engine/fiscal-assessment';
import { FiscalEnrollmentService } from '../../fiscal-enrollment/fiscal-enrollment.service';

@Injectable()
export class IndustrialEngine {
  constructor(private readonly enrollments: FiscalEnrollmentService) {}

  async calculate(tenantId: string, dto: CalculateIndustrialDto) {
    if (!tenantId) {
      throw new BadRequestException('Empresa autenticada não identificada.');
    }
    if (!dto) {
      throw new BadRequestException('Dados do cálculo não enviados.');
    }

    let receitas: Prisma.Decimal;
    let custos: Prisma.Decimal;
    try {
      receitas = new Prisma.Decimal(dto.receitas);
      custos = new Prisma.Decimal(dto.custos);
    } catch {
      throw new BadRequestException('Receitas e custos devem ser números válidos.');
    }

    if (
      !receitas.isFinite() ||
      !custos.isFinite() ||
      receitas.isNegative() ||
      custos.isNegative()
    ) {
      throw new BadRequestException('Receitas e custos devem ser números válidos.');
    }

    const enrollment = await this.enrollments.resolve(tenantId, TaxType.INDUSTRIAL, new Date());
    if (!enrollment) {
      return {
        success: true, tenantId, currency: 'AOA', receitas: Number(receitas.toFixed(2)), custos: Number(custos.toFixed(2)),
        taxableBase: null, industrialTax: null, provisionalTax: null, rate: null, ratePercent: null,
        regime: null, calculationStatus: 'NEEDS_CONFIGURATION',
        message: 'Sem enquadramento vigente de Imposto Industrial. A simulação não assume Tenant.regime.',
      };
    }

    const review = industrialAssessmentRequiresReview();
    return {
      success: true,
      tenantId,
      currency: 'AOA',
      receitas: Number(receitas.toFixed(2)),
      custos: Number(custos.toFixed(2)),
      taxableBase: null,
      industrialTax: null,
      provisionalTax: null,
      rate: null,
      ratePercent: null,
      regime: enrollment.regime,
      ...review,
    };
  }
}
