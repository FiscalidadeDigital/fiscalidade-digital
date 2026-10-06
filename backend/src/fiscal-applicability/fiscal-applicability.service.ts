import { Injectable } from '@nestjs/common';
import { FiscalRegime, TaxType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';

export type ApplicabilityStatus = 'APPLICABLE' | 'NOT_APPLICABLE' | 'REVIEW_REQUIRED' | 'PENDING_OFFICIAL_SOURCE';
export type CalendarStatus = 'AVAILABLE' | 'OFFICIAL_CALENDAR_PENDING' | 'NOT_APPLICABLE';

@Injectable()
export class FiscalApplicabilityService {
  constructor(private readonly prisma: PrismaService, private readonly enrollments: FiscalEnrollmentService) {}

  async assess(tenantId: string, period: Date) {
    const [iva, industrial, activeEmployees, calendar] = await Promise.all([
      this.enrollments.resolve(tenantId, TaxType.IVA, period),
      this.enrollments.resolve(tenantId, TaxType.INDUSTRIAL, period),
      this.prisma.employee.count({ where: { tenantId, status: 'ACTIVE', OR: [{ hireDate: null }, { hireDate: { lte: period } }], AND: [{ OR: [{ terminationDate: null }, { terminationDate: { gte: period } }] }] } }),
      this.prisma.fiscalCalendar.count({ where: { referenceYear: period.getUTCFullYear(), active: true } }),
    ]);
    const calendarStatus: CalendarStatus = calendar ? 'AVAILABLE' : 'OFFICIAL_CALENDAR_PENDING';
    const enrolled = (taxType: TaxType, item: any) => !item
      ? { taxType, applicabilityStatus: 'REVIEW_REQUIRED' as ApplicabilityStatus, calculationReady: false, calendarStatus, reason: 'NO_CURRENT_TAX_ENROLLMENT' }
      : { taxType, regime: item.regime, validFrom: item.validFrom, validUntil: item.validUntil, applicabilityStatus: 'APPLICABLE' as ApplicabilityStatus, calculationReady: !(taxType === TaxType.IVA && item.regime === FiscalRegime.SIMPLIFICADO), calendarStatus, reason: taxType === TaxType.IVA && item.regime === FiscalRegime.SIMPLIFICADO ? 'NEEDS_OFFICIAL_CONFIRMATION' : 'CURRENT_ENROLLMENT', legalBasis: item.legalReference, sourceUrl: item.officialSourceUrl, reviewStatus: item.reviewStatus };
    const labour = (taxType: TaxType) => ({ taxType, applicabilityStatus: activeEmployees ? 'APPLICABLE' as ApplicabilityStatus : 'NOT_APPLICABLE' as ApplicabilityStatus, calculationReady: Boolean(activeEmployees), calendarStatus: activeEmployees ? calendarStatus : 'NOT_APPLICABLE' as CalendarStatus, reason: activeEmployees ? 'ACTIVE_EMPLOYEES_IN_PERIOD' : 'NO_EMPLOYMENT_TRIGGER' });
    return { period: period.toISOString().slice(0, 10), domains: [enrolled(TaxType.IVA, iva), enrolled(TaxType.INDUSTRIAL, industrial), labour(TaxType.IRT), labour(TaxType.SS), { taxType: 'SAFT', applicabilityStatus: iva ? 'APPLICABLE' as ApplicabilityStatus : 'REVIEW_REQUIRED' as ApplicabilityStatus, calculationReady: false, calendarStatus, reason: iva ? 'IVA_ENROLLMENT_REQUIRES_SAFT_REVIEW' : 'NO_CURRENT_TAX_ENROLLMENT' }] };
  }
}
