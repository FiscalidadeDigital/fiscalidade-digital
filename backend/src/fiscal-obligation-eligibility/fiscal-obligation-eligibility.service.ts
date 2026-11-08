import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type ObligationLike = {
  dueDate: Date;
  period?: string | null;
  type: string;
  fiscalCalendar?: {
    period?: string | null;
    referenceYear?: number | null;
    taxType?: string | null;
  } | null;
};

type FiscalPeriod = {
  end: Date;
  month: number;
  period: string;
  start: Date;
  year: number;
};

/**
 * A fail-closed eligibility check shared by lists, dashboards, notifications,
 * and reminder delivery.  It deliberately reads only operational data.
 */
@Injectable()
export class FiscalObligationEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async filterEligible<T extends ObligationLike>(
    tenantId: string,
    obligations: T[],
  ): Promise<T[]> {
    if (obligations.length === 0) return [];

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { createdAt: true },
    });
    if (!tenant) return [];

    const eligible: T[] = [];
    for (const obligation of obligations) {
      const period = this.fiscalPeriod(obligation);
      if (!period || period.end < tenant.createdAt) continue;

      if (await this.hasOperation(tenantId, obligation, period)) {
        eligible.push(obligation);
      }
    }
    return eligible;
  }

  private async hasOperation(
    tenantId: string,
    obligation: ObligationLike,
    period: FiscalPeriod,
  ): Promise<boolean> {
    const taxType = this.taxType(obligation);
    const taxRecordWhere = {
      tenantId,
      taxType: taxType as never,
      period: period.period,
    };

    const [assessments, declarations, transactions] = await Promise.all([
      this.prisma.taxAssessment.count({ where: taxRecordWhere }),
      this.prisma.taxDeclaration.count({ where: taxRecordWhere }),
      this.prisma.taxTransaction.count({ where: taxRecordWhere }),
    ]);
    if (assessments + declarations + transactions > 0) return true;

    if (taxType === 'IVA') {
      const [invoices, purchases] = await Promise.all([
        this.prisma.invoice.count({
          where: { tenantId, issuedAt: { gte: period.start, lte: period.end } },
        }),
        this.prisma.purchaseInvoice.count({
          where: { tenantId, issuedAt: { gte: period.start, lte: period.end } },
        }),
      ]);
      return invoices + purchases > 0;
    }

    if (taxType === 'IRT' || taxType === 'SS') {
      const [employees, payrolls] = await Promise.all([
        this.prisma.employee.count({
          where: {
            tenantId,
            hireDate: { lte: period.end },
            OR: [
              { terminationDate: null },
              { terminationDate: { gte: period.start } },
            ],
          },
        }),
        this.prisma.payroll.count({
          where: {
            tenantId,
            year: period.year,
            month: period.month,
            status: { not: 'DRAFT' },
          },
        }),
      ]);
      return employees + payrolls > 0;
    }

    if (taxType === 'INDUSTRIAL') {
      return (
        (await this.prisma.invoice.count({
          where: { tenantId, issuedAt: { gte: period.start, lte: period.end } },
        })) > 0
      );
    }

    if (taxType === 'RETENCAO') {
      return (
        (await this.prisma.invoice.count({
          where: {
            tenantId,
            issuedAt: { gte: period.start, lte: period.end },
            withholdingTax: { gt: 0 },
          },
        })) > 0
      );
    }

    return false;
  }

  private taxType(obligation: ObligationLike): string {
    const value = obligation.fiscalCalendar?.taxType ?? obligation.type;
    const normalized = String(value).toUpperCase();
    return normalized === 'II' ? 'INDUSTRIAL' : normalized;
  }

  private fiscalPeriod(obligation: ObligationLike): FiscalPeriod | null {
    const raw = obligation.period ?? obligation.fiscalCalendar?.period;
    const fallbackYear = obligation.fiscalCalendar?.referenceYear;
    const parsed = this.parsePeriod(raw, fallbackYear);
    if (!parsed) return null;

    const start = new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
    const end = new Date(
      Date.UTC(parsed.year, parsed.month, 0, 23, 59, 59, 999),
    );
    return {
      end,
      month: parsed.month,
      period: `${parsed.year}-${String(parsed.month).padStart(2, '0')}`,
      start,
      year: parsed.year,
    };
  }

  private parsePeriod(
    value: string | null | undefined,
    fallbackYear: number | null | undefined,
  ): { month: number; year: number } | null {
    if (!value) return null;
    const normalized = value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const iso = normalized.match(/^(\d{4})[-/](0[1-9]|1[0-2])$/);
    if (iso) return { year: Number(iso[1]), month: Number(iso[2]) };

    const monthYear = normalized.match(/^(0?[1-9]|1[0-2])[-/](\d{4})$/);
    if (monthYear)
      return { year: Number(monthYear[2]), month: Number(monthYear[1]) };

    const monthNames: Record<string, number> = {
      janeiro: 1,
      fevereiro: 2,
      marco: 3,
      abril: 4,
      maio: 5,
      junho: 6,
      julho: 7,
      agosto: 8,
      setembro: 9,
      outubro: 10,
      novembro: 11,
      dezembro: 12,
    };
    const month = Object.entries(monthNames).find(([name]) =>
      normalized.startsWith(name),
    );
    if (!month || !fallbackYear) return null;
    return { year: fallbackYear, month: month[1] };
  }
}
