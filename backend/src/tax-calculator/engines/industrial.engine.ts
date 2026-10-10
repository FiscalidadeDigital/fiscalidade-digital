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

    const referenceDate = this.resolveReferenceDate(dto.referenceDate);
    const enrollment = await this.enrollments.resolve(tenantId, TaxType.INDUSTRIAL, referenceDate);
    if (!enrollment) {
      return {
        success: true, tenantId, currency: 'AOA', referenceDate: referenceDate.toISOString().slice(0, 10), receitas: Number(receitas.toFixed(2)), custos: Number(custos.toFixed(2)),
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
      referenceDate: referenceDate.toISOString().slice(0, 10),
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

  private resolveReferenceDate(value?: string): Date {
    if (!value) return new Date();

    const dateOnly = value.slice(0, 10);
    const referenceDate = new Date(`${dateOnly}T00:00:00.000Z`);
    if (Number.isNaN(referenceDate.getTime())) {
      throw new BadRequestException('A data fiscal da simulação é inválida.');
    }

    return referenceDate;
  }
}
