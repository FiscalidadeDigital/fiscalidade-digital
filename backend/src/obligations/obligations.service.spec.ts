import { FiscalRegime, InvoiceDocumentType, ObligationType, TaxType } from '@prisma/client';

import { ObligationsService } from './obligations.service';

describe('ObligationsService IVA source eligibility', () => {
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
    );

    expect(result).toBe(140.01);
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ documentType: InvoiceDocumentType.NORMAL }),
    }));
    expect(prisma.purchaseInvoice.findMany).toHaveBeenCalled();
  });
});
