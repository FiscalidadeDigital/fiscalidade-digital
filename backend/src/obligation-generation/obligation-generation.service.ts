import { Injectable } from '@nestjs/common';
import { ObligationType, TaxType } from '@prisma/client';
import { FiscalApplicabilityService } from '../fiscal-applicability/fiscal-applicability.service';
import { FiscalObligationPersistenceService } from '../fiscal-obligation-persistence/fiscal-obligation-persistence.service';
import { PrismaService } from '../prisma/prisma.service';

export type ObligationGenerationOutcome = 'CREATED' | 'EXISTING' | 'SKIPPED';

@Injectable()
export class ObligationGenerationService {
  constructor(
    private readonly applicability: FiscalApplicabilityService,
    private readonly persistence: FiscalObligationPersistenceService,
    private readonly prisma: PrismaService,
  ) {}

  async generate(tenantId: string, period: Date) {
    const assessment = await this.applicability.assess(tenantId, period);
    const fiscalPeriod = assessment.period;
    const results: any[] = [];

    for (const domain of assessment.domains as any[]) {
      const taxType = domain.taxType as string;
      if (domain.applicabilityStatus !== 'APPLICABLE') {
        results.push(this.skipped(taxType, domain, domain.reason === 'NO_CURRENT_TAX_ENROLLMENT' ? 'NO_VALID_ENROLLMENT' : domain.reason ?? 'NOT_APPLICABLE'));
        continue;
      }
      if (domain.calendarStatus !== 'AVAILABLE') {
        results.push(this.skipped(taxType, domain, domain.calendarStatus ?? 'OFFICIAL_CALENDAR_PENDING'));
        continue;
      }
      if (taxType !== 'SAFT' && !domain.calculationReady) {
        results.push(this.skipped(taxType, domain, domain.reason ?? 'RULE_NEEDS_OFFICIAL_CONFIRMATION'));
        continue;
      }

      const rules = await this.findRules(taxType, domain.regime, period.getUTCFullYear());
      if (!rules.length) {
        results.push(this.skipped(taxType, domain, 'OFFICIAL_CALENDAR_PENDING'));
        continue;
      }

      for (const rule of rules) {
        if (!this.isOfficial(rule)) {
          results.push(this.skipped(taxType, domain, 'OFFICIAL_CALENDAR_PENDING'));
          continue;
        }
        if (!rule.period?.trim()) {
          results.push(this.skipped(taxType, domain, 'CALENDAR_PERIOD_UNDETERMINED'));
          continue;
        }
        const dueDate = new Date(rule.dueDate);
        if (Number.isNaN(dueDate.getTime())) {
          results.push(this.skipped(taxType, domain, 'CALENDAR_DUE_DATE_UNDETERMINED'));
          continue;
        }
        const persisted = await this.persistence.persistCalendarDerived({
          tenantId,
          fiscalCalendarId: rule.id,
          period: rule.period.trim(),
          type: rule.obligationType,
          title: rule.title,
          description: rule.description,
          dueDate,
          origin: 'CALENDAR',
        });
        results.push({ taxType, applicability: domain.applicabilityStatus, calendarStatus: domain.calendarStatus, outcome: persisted.outcome, obligation: persisted.obligation });
      }
    }
    return { fiscalPeriod, results };
  }

  private async findRules(taxType: string, regime: string | undefined, referenceYear: number) {
    const where: any = { active: true, referenceYear };
    if (taxType === 'SAFT') where.obligationType = ObligationType.SAFT;
    else if (taxType === TaxType.INDUSTRIAL) {
      where.taxType = { in: [TaxType.INDUSTRIAL, TaxType.II] };
    } else where.taxType = taxType as TaxType;
    if (regime) where.regimes = { some: { regime } };
    return this.prisma.fiscalCalendar.findMany({ where, orderBy: { dueDate: 'asc' } });
  }

  private isOfficial(rule: any) {
    return Boolean(rule.officialReference || rule.source || rule.sourceUrl);
  }

  private skipped(taxType: string, domain: any, reasonCode: string) {
    return { taxType, applicability: domain.applicabilityStatus, calendarStatus: domain.calendarStatus, outcome: 'SKIPPED' as ObligationGenerationOutcome, reasonCode };
  }
}
