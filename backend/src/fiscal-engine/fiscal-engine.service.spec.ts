import { FiscalEngineService } from './fiscal-engine.service';

type Scenario = {
  invoices?: any[];
  purchases?: any[];
  payrolls?: any[];
};

function fiscalPrisma(scenarios: Record<string, Scenario>) {
  const ledger: any[] = [];
  const assessments: any[] = [];
  const obligations: any[] = [];
  const transaction = {
    taxTransaction: {
      deleteMany: jest.fn(async ({ where }: any) => {
        for (let index = ledger.length - 1; index >= 0; index -= 1) {
          if (
            ledger[index].tenantId === where.tenantId &&
            where.sourceType.in.includes(ledger[index].sourceType)
          ) ledger.splice(index, 1);
        }
      }),
      createMany: jest.fn(async ({ data }: any) => ledger.push(...data)),
      findMany: jest.fn(async ({ where }: any) =>
        ledger.filter((item) =>
          item.tenantId === where.tenantId &&
          item.taxType === where.taxType &&
          item.period === where.period,
        )),
    },
    taxAssessment: {
      upsert: jest.fn(async ({ create, update, where }: any) => {
        const key = where.tenantId_taxType_period_year;
        const index = assessments.findIndex((item) =>
          item.tenantId === key.tenantId && item.taxType === key.taxType &&
          item.period === key.period && item.year === key.year,
        );
        if (index < 0) assessments.push(create);
        else assessments[index] = { ...assessments[index], ...update };
      }),
    },
    fiscalCalendar: {
      findMany: jest.fn(async ({ where }: any) => [{
        id: `calendar-${where.taxType}`,
        obligationType: where.taxType,
        title: `${where.taxType} mensal`,
        description: 'Regra de teste',
        dueDate: new Date('2027-04-30T00:00:00.000Z'),
        period: null,
      }]),
    },
    fiscalObligation: {
      findFirst: jest.fn(async ({ where }: any) => obligations.find((item) =>
        item.tenantId === where.tenantId &&
        (item.fiscalCalendarId === where.fiscalCalendarId ||
          (item.type === where.type && item.period === where.period)),
      ) ?? null),
      create: jest.fn(async ({ data }: any) => obligations.push({ id: `obligation-${obligations.length + 1}`, ...data })),
      update: jest.fn(async ({ where, data }: any) => {
        const current = obligations.find((item) => item.id === where.id);
        Object.assign(current, data);
      }),
    },
  };
  const prisma = {
    tenant: { findUnique: jest.fn(async ({ where }: any) => ({
      id: where.id, name: `Tenant ${where.id}`, nif: '5000000000', regime: 'GERAL',
      sector: null, companyType: null, retentionRate: null,
    })) },
    invoice: { findMany: jest.fn(async ({ where }: any) => scenarios[where.tenantId]?.invoices ?? []) },
    purchaseInvoice: { findMany: jest.fn(async ({ where }: any) => scenarios[where.tenantId]?.purchases ?? []) },
    payroll: { findMany: jest.fn(async ({ where }: any) => scenarios[where.tenantId]?.payrolls ?? []) },
    revenue: { findMany: jest.fn(async () => []) },
    $transaction: jest.fn(async (callback: any) => callback(transaction)),
  };
  return { prisma, ledger, assessments, obligations };
}

describe('FiscalEngineService integration', () => {
  const issuedAt = new Date('2026-03-10T00:00:00.000Z');

  it('keeps pending input IVA out of payable VAT, excludes Pro Forma data, and is idempotent', async () => {
    const scenarios = {
      A: {
        invoices: [{ id: 'invoice-a', subtotal: 1000, iva: 140, withholdingTax: 0, issuedAt, invoiceNumber: 'FT-1', status: 'ISSUED' }],
        purchases: [{ id: 'purchase-a', subtotal: 500, iva: 70, withholdingTax: 0, issuedAt, invoiceNumber: 'FR-1', status: 'PENDING', vatDeductibilityStatus: 'PENDING_REVIEW' }],
      },
      B: { invoices: [{ id: 'invoice-b', subtotal: 200, iva: 28, withholdingTax: 0, issuedAt, invoiceNumber: 'FT-B', status: 'ISSUED' }] },
    };
    const { prisma, ledger, assessments, obligations } = fiscalPrisma(scenarios);
    const service = new FiscalEngineService(prisma as any);

    await service.syncTenant('A', 2026);
    const vat = assessments.find((item) => item.taxType === 'IVA');
    expect(vat.taxDueAmountValue.toFixed(2)).toBe('140.00');
    expect(vat.deductibleAmountValue.toFixed(2)).toBe('0.00');
    expect(vat.payableAmountValue.toFixed(2)).toBe('140.00');
    expect(vat.calculationStatus).toBe('REVIEW_REQUIRED');
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ documentType: 'NORMAL' }),
      }),
    );
    expect(ledger.filter((item) => item.tenantId === 'A' && item.taxType === 'IVA')).toHaveLength(2);
    expect(obligations.find((item) => item.type === 'IVA').amountValue.toFixed(2)).toBe('140.00');
    expect(ledger.some((item) => item.sourceId === 'pro-forma-a')).toBe(false);

    scenarios.A.purchases![0].vatDeductibilityStatus = 'DEDUCTIBLE';
    await service.syncTenant('A', 2026);
    const recalculated = assessments.find((item) => item.taxType === 'IVA');
    expect(recalculated.deductibleAmountValue.toFixed(2)).toBe('70.00');
    expect(recalculated.payableAmountValue.toFixed(2)).toBe('70.00');
    expect(ledger.filter((item) => item.tenantId === 'A' && item.taxType === 'IVA')).toHaveLength(2);

    await service.syncTenant('B', 2026);
    expect(ledger.every((item) => item.tenantId === 'A' || item.tenantId === 'B')).toBe(true);
    expect(ledger.filter((item) => item.tenantId === 'B' && item.taxType === 'IVA')).toHaveLength(1);
  });

  it('aggregates payroll IRT and both INSS portions without cancelling IRT', async () => {
    const { prisma, assessments, obligations } = fiscalPrisma({
      A: {
        payrolls: [{
          id: 'payroll-a', month: 3, year: 2026, status: 'APPROVED',
          items: [{ grossAmount: 1000, irtTaxableAmount: 900, irtAmount: 150, socialSecurityAmount: 30, employerSocialSecurityAmount: 80 }],
        }],
      },
    });
    const service = new FiscalEngineService(prisma as any);
    await service.syncTenant('A', 2026);

    const irt = assessments.find((item) => item.taxType === 'IRT');
    const socialSecurity = assessments.find((item) => item.taxType === 'SS');
    expect(irt.payableAmountValue.toFixed(2)).toBe('150.00');
    expect(socialSecurity.payableAmountValue.toFixed(2)).toBe('110.00');
    expect(obligations.find((item) => item.type === 'IRT').amountValue.toFixed(2)).toBe('150.00');
    expect(obligations.find((item) => item.type === 'SS').amountValue.toFixed(2)).toBe('110.00');
  });
});
