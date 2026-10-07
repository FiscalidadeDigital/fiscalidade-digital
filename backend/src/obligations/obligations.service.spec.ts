import { FiscalRegime, ObligationType, Prisma, TaxType } from '@prisma/client';

import { ObligationsService } from './obligations.service';

describe('ObligationsService IVA source eligibility', () => {
  it('lists report obligations read-only with tenant-scoped persisted sources', async () => {
    const fiscalObligation = { findMany: jest.fn().mockResolvedValue([]) };
    const service = new ObligationsService({ fiscalObligation } as any);

    await expect(service.findAllReadOnly('tenant-a', 2026)).resolves.toEqual([]);

    expect(fiscalObligation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-a', dueDate: expect.any(Object) }),
    }));
  });

  it('resolves the calendar enrollment against the obligation fiscal period and never Tenant.regime', () => {
    const service = new ObligationsService({} as never);
    const privateService = service as unknown as {
      ruleEffectiveDate: (period: string, year: number, dueDate: Date) => Date;
      isCalendarRuleApplicable: (rule: any, regime: FiscalRegime | null, enrollmentRequired: boolean) => boolean;
    };
    expect(privateService.ruleEffectiveDate('maio', 2026, new Date('2026-06-15T00:00:00.000Z'))).toEqual(new Date('2026-05-01T00:00:00.000Z'));
    expect(privateService.isCalendarRuleApplicable({ title: 'IVA mensal', description: null, taxType: TaxType.IVA, obligationType: ObligationType.IVA }, null, true)).toBe(false);
    expect(privateService.isCalendarRuleApplicable({ title: 'IVA mensal', description: null, taxType: TaxType.IVA, obligationType: ObligationType.IVA }, FiscalRegime.GERAL, true)).toBe(true);
  });

  it('keeps IVA regime selection period-specific and allows Industrial to differ', () => {
    const service = new ObligationsService({} as never);
    const privateService = service as unknown as { isCalendarRuleApplicable: (rule: any, regime: FiscalRegime | null, enrollmentRequired: boolean) => boolean };
    const ivaSimplifiedRule = { title: 'IVA Simplificado', description: null, taxType: TaxType.IVA, obligationType: ObligationType.IVA };
    expect(privateService.isCalendarRuleApplicable(ivaSimplifiedRule, FiscalRegime.GERAL, true)).toBe(false);
    expect(privateService.isCalendarRuleApplicable(ivaSimplifiedRule, FiscalRegime.SIMPLIFICADO, true)).toBe(true);
    expect(privateService.isCalendarRuleApplicable({ title: 'Imposto Industrial', description: null, taxType: TaxType.INDUSTRIAL, obligationType: ObligationType.II }, FiscalRegime.GERAL, true)).toBe(true);
  });

  it('uses the tenant-scoped central IVA assessment instead of recalculating invoice VAT', async () => {
    const prisma = {
      taxAssessment: {
        findFirst: jest.fn().mockResolvedValue({
          calculationStatus: 'CALCULATED',
          finalAmount: 0,
          finalAmountValue: new Prisma.Decimal('140.01'),
          payableAmountValue: new Prisma.Decimal('140.01'),
        }),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([{ iva: 140.01 }]),
      },
      purchaseInvoice: {
        findMany: jest.fn().mockResolvedValue([{ iva: 42 }]),
      },
    };
    const service = new ObligationsService(prisma as never);

    const result = await (service as unknown as {
      calculateObligationAmount: (...args: unknown[]) => Promise<number>;
    }).calculateObligationAmount(
      { id: 'tenant-a', regime: FiscalRegime.GERAL, sector: null, companyType: null, retentionRate: 0 },
      ObligationType.IVA,
      TaxType.IVA,
      'IVA mensal',
      null,
      new Date('2026-11-10T00:00:00.000Z'),
      '2026-10',
      FiscalRegime.GERAL,
    );

    expect(result).toBe(140.01);
    expect(prisma.taxAssessment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-a', taxType: TaxType.IVA, period: '2026-10', year: 2026 }),
    }));
    expect(prisma.invoice.findMany).not.toHaveBeenCalled();
    expect(prisma.purchaseInvoice.findMany).not.toHaveBeenCalled();
  });

  it('keeps an IVA obligation amount undetermined while the central assessment needs review', async () => {
    const taxAssessment = {
      findFirst: jest.fn().mockResolvedValue({ calculationStatus: 'REVIEW_REQUIRED' }),
    };
    const service = new ObligationsService({ taxAssessment } as never);

    await expect((service as unknown as {
      calculateObligationAmount: (...args: unknown[]) => Promise<number | null>;
    }).calculateObligationAmount(
      { id: 'tenant-b', regime: FiscalRegime.GERAL, sector: null, companyType: null, retentionRate: 0 },
      ObligationType.IVA,
      TaxType.IVA,
      'IVA mensal',
      null,
      new Date('2026-11-10T00:00:00.000Z'),
      '2026-10',
      FiscalRegime.GERAL,
    )).resolves.toBeNull();

    expect(taxAssessment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-b', taxType: TaxType.IVA, period: '2026-10' }),
    }));
  });
});
