import { Injectable } from '@nestjs/common';
import {
  FiscalObligationOrigin,
  ObligationStatus,
  ObligationType,
  TaxType,
} from '@prisma/client';
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
    const profile = await this.fiscalProfile(tenantId);
    const assessment = await this.applicability.assess(tenantId, period);
    const fiscalPeriod = assessment.period;
    const results: any[] = [];

    if (profile.hasPriorUnregularizedObligations) {
      const historical = await this.createHistoricalConfirmation(
        tenantId,
        profile.activityStartedAt,
      );
      results.push(historical);
    }

    for (const domain of assessment.domains as any[]) {
      const taxType = domain.taxType as string;
      if (domain.applicabilityStatus !== 'APPLICABLE') {
        results.push(
          this.skipped(
            taxType,
            domain,
            domain.reason === 'NO_CURRENT_TAX_ENROLLMENT'
              ? 'NO_VALID_ENROLLMENT'
              : (domain.reason ?? 'NOT_APPLICABLE'),
          ),
        );
        continue;
      }
      if (domain.calendarStatus !== 'AVAILABLE') {
        results.push(
          this.skipped(
            taxType,
            domain,
            domain.calendarStatus ?? 'OFFICIAL_CALENDAR_PENDING',
          ),
        );
        continue;
      }
      if (taxType !== 'SAFT' && !domain.calculationReady) {
        results.push(
          this.skipped(
            taxType,
            domain,
            domain.reason ?? 'RULE_NEEDS_OFFICIAL_CONFIRMATION',
          ),
        );
        continue;
      }

      const rules = await this.findRules(
        taxType,
        domain.regime,
        period.getUTCFullYear(),
      );
      if (!rules.length) {
        results.push(
          this.skipped(taxType, domain, 'OFFICIAL_CALENDAR_PENDING'),
        );
        continue;
      }

      for (const rule of rules) {
        if (!this.isOfficial(rule)) {
          results.push(
            this.skipped(taxType, domain, 'OFFICIAL_CALENDAR_PENDING'),
          );
          continue;
        }
        if (!rule.period?.trim()) {
          results.push(
            this.skipped(taxType, domain, 'CALENDAR_PERIOD_UNDETERMINED'),
          );
          continue;
        }
        const dueDate = new Date(rule.dueDate);
        if (Number.isNaN(dueDate.getTime())) {
          results.push(
            this.skipped(taxType, domain, 'CALENDAR_DUE_DATE_UNDETERMINED'),
          );
          continue;
        }
        const periodStart = this.periodStart(
          rule.period,
          rule.referenceYear ?? period.getUTCFullYear(),
          dueDate,
        );
        if (
          profile.activityStartedAt &&
          periodStart < this.startOfDay(profile.activityStartedAt)
        ) {
          results.push(this.skipped(taxType, domain, 'BEFORE_ACTIVITY_START'));
          continue;
        }
        // The onboarding flow must never create a new ordinary obligation
        // already past its deadline. Historical matters are represented by a
        // separate confirmation item above, without a made-up amount.
        if (this.startOfDay(dueDate) < this.startOfDay(new Date())) {
          results.push(this.skipped(taxType, domain, 'PAST_DUE_DATE'));
          continue;
        }
        const persisted = await this.persistence.persistCalendarDerived({
          tenantId,
          fiscalCalendarId: rule.id,
          period: rule.period.trim(),
          referenceYear: rule.referenceYear ?? periodStart.getUTCFullYear(),
          type: rule.obligationType,
          title: rule.title,
          description: rule.description,
          dueDate,
          origin: 'CALENDAR',
        });
        results.push({
          taxType,
          applicability: domain.applicabilityStatus,
          calendarStatus: domain.calendarStatus,
          outcome: persisted.outcome,
          obligation: persisted.obligation,
        });
      }
    }
    return { fiscalPeriod, results };
  }

  /**
   * Older test doubles and databases may not yet expose the additive Tenant
   * columns. In that case the conservative default is no historical creation
   * and no inferred activity date.
   */
  private async fiscalProfile(tenantId: string) {
    const tenantModel = (
      this.prisma as unknown as {
        tenant?: {
          findUnique: (args: unknown) => Promise<{
            activityStartedAt?: Date | null;
            hasPriorUnregularizedObligations?: boolean | null;
          } | null>;
        };
      }
    ).tenant;
    if (!tenantModel) {
      return {
        activityStartedAt: null as Date | null,
        hasPriorUnregularizedObligations: false,
      };
    }
    const tenant = await tenantModel.findUnique({
      where: { id: tenantId },
      select: {
        activityStartedAt: true,
        hasPriorUnregularizedObligations: true,
      },
    });
    return {
      activityStartedAt: tenant?.activityStartedAt ?? null,
      hasPriorUnregularizedObligations:
        tenant?.hasPriorUnregularizedObligations === true,
    };
  }

  private async createHistoricalConfirmation(
    tenantId: string,
    activityStartedAt: Date | null,
  ) {
    const persisted = await this.persistence.persistNonCalendar({
      tenantId,
      type: ObligationType.OUTRA,
      title: 'Obrigações anteriores a confirmar',
      description:
        'Indicou que existem obrigações anteriores por regularizar. Confirme os períodos e valores no Portal do Contribuinte da AGT.',
      dueDate: new Date(),
      period: activityStartedAt
        ? activityStartedAt.toISOString().slice(0, 10)
        : null,
      referenceYear: activityStartedAt?.getUTCFullYear() ?? null,
      amount: null,
      status: ObligationStatus.HISTORICAL_CONFIRMATION,
      origin: FiscalObligationOrigin.MANUAL,
      idempotencyKey: 'prior-unregularized-obligations-confirmation',
      alertEnabled: false,
    });
    return {
      taxType: 'HISTORICAL',
      applicability: 'REVIEW_REQUIRED',
      calendarStatus: 'NOT_APPLICABLE',
      outcome: persisted.outcome,
      obligation: persisted.obligation,
    };
  }

  private async findRules(
    taxType: string,
    regime: string | undefined,
    referenceYear: number,
  ) {
    const where: any = { active: true, referenceYear };
    if (taxType === 'SAFT') where.obligationType = ObligationType.SAFT;
    else if (taxType === TaxType.INDUSTRIAL) {
      where.taxType = { in: [TaxType.INDUSTRIAL, TaxType.II] };
    } else where.taxType = taxType as TaxType;
    if (regime) where.regimes = { some: { regime } };
    return this.prisma.fiscalCalendar.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }

  private isOfficial(rule: any) {
    return Boolean(rule.officialReference || rule.source || rule.sourceUrl);
  }

  private skipped(taxType: string, domain: any, reasonCode: string) {
    return {
      taxType,
      applicability: domain.applicabilityStatus,
      calendarStatus: domain.calendarStatus,
      outcome: 'SKIPPED' as ObligationGenerationOutcome,
      reasonCode,
    };
  }

  private startOfDay(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  private periodStart(
    value: string | null | undefined,
    year: number,
    fallback: Date,
  ) {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();
    const numeric = normalized.match(/^(\d{4})-(\d{1,2})$/);
    if (numeric) {
      return new Date(Date.UTC(Number(numeric[1]), Number(numeric[2]) - 1, 1));
    }
    const months = [
      'JANEIRO',
      'FEVEREIRO',
      'MARCO',
      'ABRIL',
      'MAIO',
      'JUNHO',
      'JULHO',
      'AGOSTO',
      'SETEMBRO',
      'OUTUBRO',
      'NOVEMBRO',
      'DEZEMBRO',
    ];
    const month = months.indexOf(
      normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    );
    if (month >= 0) return new Date(Date.UTC(year, month, 1));
    return new Date(
      Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), 1),
    );
  }
}
