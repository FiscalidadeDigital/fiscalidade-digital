import { Injectable } from '@nestjs/common';
import { ObligationType } from '@prisma/client';
import { FiscalApplicabilityService } from '../fiscal-applicability/fiscal-applicability.service';
import { PrismaService } from '../prisma/prisma.service';

const obligationTypes: Record<string, ObligationType[]> = {
  IVA: [ObligationType.IVA],
  INDUSTRIAL: [ObligationType.II],
  IRT: [ObligationType.IRT],
  SS: [ObligationType.SS],
  SAFT: [ObligationType.SAFT],
};

@Injectable()
export class FiscalSituationService {
  constructor(
    private readonly applicability: FiscalApplicabilityService,
    private readonly prisma: PrismaService,
  ) {}

  async get(tenantId: string, period: Date) {
    const assessed = await this.applicability.assess(tenantId, period);
    const taxes = await Promise.all((assessed.domains as any[]).map(async (domain) => {
      const nextObligation = await this.prisma.fiscalObligation.findFirst({
        where: {
          tenantId,
          type: { in: obligationTypes[domain.taxType] ?? [] },
          status: { in: ['PENDING', 'LATE'] },
        },
        select: { id: true, type: true, period: true, dueDate: true, status: true },
        orderBy: { dueDate: 'asc' },
      });
      const attentionRequired = domain.applicabilityStatus !== 'APPLICABLE' ||
        domain.calendarStatus === 'OFFICIAL_CALENDAR_PENDING' ||
        domain.calculationReady === false;
      return {
        taxType: domain.taxType,
        applicability: { status: domain.applicabilityStatus, reasonCode: domain.reason },
        enrollment: domain.regime ? {
          regime: domain.regime,
          validFrom: domain.validFrom,
          validUntil: domain.validUntil,
          reviewStatus: domain.reviewStatus,
          legalBasis: { diploma: domain.legalBasis, source: domain.sourceUrl },
        } : null,
        calendar: { status: domain.calendarStatus, referenceYear: period.getUTCFullYear() },
        nextObligation: domain.calendarStatus === 'OFFICIAL_CALENDAR_PENDING' ? null : nextObligation,
        automationReady: Boolean(domain.calculationReady && domain.applicabilityStatus === 'APPLICABLE'),
        attentionRequired,
      };
    }));
    return {
      period: assessed.period,
      generatedAt: new Date().toISOString(),
      summary: {
        applicable: taxes.filter((tax) => tax.applicability.status === 'APPLICABLE').length,
        notApplicable: taxes.filter((tax) => tax.applicability.status === 'NOT_APPLICABLE').length,
        reviewRequired: taxes.filter((tax) => tax.applicability.status === 'REVIEW_REQUIRED').length,
        upcoming: taxes.filter((tax) => tax.nextObligation?.status === 'PENDING').length,
        overdue: taxes.filter((tax) => tax.nextObligation?.status === 'LATE').length,
      },
      taxes,
    };
  }
}
