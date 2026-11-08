import { Injectable } from '@nestjs/common';
import { FiscalRegime, TaxType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';

export type ApplicabilityStatus =
  | 'APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'REVIEW_REQUIRED'
  | 'PENDING_OFFICIAL_SOURCE';
export type CalendarStatus =
  | 'AVAILABLE'
  | 'OFFICIAL_CALENDAR_PENDING'
  | 'NOT_APPLICABLE';

@Injectable()
export class FiscalApplicabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: FiscalEnrollmentService,
  ) {}

  async assess(tenantId: string, period: Date) {
    const payrollModel = (
      this.prisma as unknown as {
        payroll?: { count: (args: unknown) => Promise<number> };
      }
    ).payroll;
    const [iva, industrial, activeEmployees, payrollsInPeriod, calendar] =
      await Promise.all([
        this.enrollments.resolve(tenantId, TaxType.IVA, period),
        this.enrollments.resolve(tenantId, TaxType.INDUSTRIAL, period),
        this.prisma.employee.count({
          where: {
            tenantId,
            status: 'ACTIVE',
            OR: [{ hireDate: null }, { hireDate: { lte: period } }],
            AND: [
              {
                OR: [
                  { terminationDate: null },
                  { terminationDate: { gte: period } },
                ],
              },
            ],
          },
        }),
        payrollModel
          ? payrollModel.count({
              where: {
                tenantId,
                year: period.getUTCFullYear(),
                month: period.getUTCMonth() + 1,
              },
            })
          : Promise.resolve(0),
        this.prisma.fiscalCalendar.count({
          where: { referenceYear: period.getUTCFullYear(), active: true },
        }),
      ]);
    const calendarStatus: CalendarStatus = calendar
      ? 'AVAILABLE'
      : 'OFFICIAL_CALENDAR_PENDING';
    const enrolled = (taxType: TaxType, item: any) =>
      !item
        ? {
            taxType,
            applicabilityStatus: 'REVIEW_REQUIRED' as ApplicabilityStatus,
            calculationReady: false,
            calendarStatus,
            reason: 'NO_CURRENT_TAX_ENROLLMENT',
          }
        : item.knowledgeStatus === 'UNKNOWN' || !item.regime
          ? {
              taxType,
              regime: null,
              validFrom: item.validFrom,
              validUntil: item.validUntil,
              applicabilityStatus: 'REVIEW_REQUIRED' as ApplicabilityStatus,
              calculationReady: false,
              calendarStatus,
              reason: 'REGIME_UNKNOWN',
              legalBasis: item.legalReference,
              sourceUrl: item.officialSourceUrl,
              reviewStatus: item.reviewStatus,
            }
          : {
              taxType,
              regime: item.regime,
              validFrom: item.validFrom,
              validUntil: item.validUntil,
              applicabilityStatus: 'APPLICABLE' as ApplicabilityStatus,
              calculationReady: !(
                taxType === TaxType.IVA &&
                item.regime === FiscalRegime.SIMPLIFICADO
              ),
              calendarStatus,
              reason:
                taxType === TaxType.IVA &&
                item.regime === FiscalRegime.SIMPLIFICADO
                  ? 'NEEDS_OFFICIAL_CONFIRMATION'
                  : 'CURRENT_ENROLLMENT',
              legalBasis: item.legalReference,
              sourceUrl: item.officialSourceUrl,
              reviewStatus: item.reviewStatus,
            };
    const hasLabourTrigger = activeEmployees > 0 || payrollsInPeriod > 0;
    const labour = (taxType: TaxType) => ({
      taxType,
      applicabilityStatus: hasLabourTrigger
        ? ('APPLICABLE' as ApplicabilityStatus)
        : ('NOT_APPLICABLE' as ApplicabilityStatus),
      calculationReady: hasLabourTrigger,
      calendarStatus: hasLabourTrigger
        ? calendarStatus
        : ('NOT_APPLICABLE' as CalendarStatus),
      reason:
        activeEmployees > 0
          ? 'ACTIVE_EMPLOYEES_IN_PERIOD'
          : payrollsInPeriod > 0
            ? 'PAYROLL_IN_PERIOD'
            : 'NO_EMPLOYMENT_TRIGGER',
    });
    const confirmedIva = Boolean(
      iva && iva.knowledgeStatus !== 'UNKNOWN' && iva.regime,
    );
    return {
      period: period.toISOString().slice(0, 10),
      domains: [
        enrolled(TaxType.IVA, iva),
        enrolled(TaxType.INDUSTRIAL, industrial),
        labour(TaxType.IRT),
        labour(TaxType.SS),
        {
          taxType: 'SAFT',
          applicabilityStatus: confirmedIva
            ? ('APPLICABLE' as ApplicabilityStatus)
            : ('REVIEW_REQUIRED' as ApplicabilityStatus),
          calculationReady: false,
          calendarStatus,
          reason: confirmedIva
            ? 'IVA_ENROLLMENT_REQUIRES_SAFT_REVIEW'
            : iva
              ? 'IVA_REGIME_UNKNOWN'
              : 'NO_CURRENT_TAX_ENROLLMENT',
        },
      ],
    };
  }
}
