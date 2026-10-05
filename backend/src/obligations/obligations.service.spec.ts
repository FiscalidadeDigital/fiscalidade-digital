import { FiscalRegime, InvoiceDocumentType, ObligationType, TaxType } from '@prisma/client';

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

  it('excludes Pro Formas and does not deduct supported purchase VAT by default', async () => {
    const prisma = {
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
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ documentType: InvoiceDocumentType.NORMAL }),
    }));
    expect(prisma.purchaseInvoice.findMany).toHaveBeenCalled();
  });
});
