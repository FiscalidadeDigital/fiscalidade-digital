/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { FiscalObligationEligibilityService } from './fiscal-obligation-eligibility.service';

describe('FiscalObligationEligibilityService', () => {
  function fixture() {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          createdAt: new Date('2026-11-01T00:00:00.000Z'),
        }),
      },
      employee: { count: jest.fn().mockResolvedValue(0) },
      payroll: { count: jest.fn().mockResolvedValue(0) },
      invoice: { count: jest.fn().mockResolvedValue(0) },
      purchaseInvoice: { count: jest.fn().mockResolvedValue(0) },
      taxAssessment: { count: jest.fn().mockResolvedValue(0) },
      taxDeclaration: { count: jest.fn().mockResolvedValue(0) },
      taxTransaction: { count: jest.fn().mockResolvedValue(0) },
    } as any;
    return {
      prisma,
      service: new FiscalObligationEligibilityService(prisma as never),
    };
  }

  const iva = {
    type: 'IVA',
    period: '2026-11',
    dueDate: new Date('2026-12-15T00:00:00.000Z'),
  };

  it('excludes a period that ended before the tenant was created', async () => {
    const { service } = fixture();
    await expect(
      service.filterEligible('tenant-a', [{ ...iva, period: '2026-10' }]),
    ).resolves.toEqual([]);
  });

  it('excludes a new company with no tax operation, including future deadlines', async () => {
    const { service } = fixture();
    await expect(service.filterEligible('tenant-a', [iva])).resolves.toEqual(
      [],
    );
  });

  it('excludes IRT and INSS without employees or a non-draft payroll', async () => {
    const { service } = fixture();
    const labour = [
      { ...iva, type: 'IRT' },
      { ...iva, type: 'SS' },
    ];
    await expect(service.filterEligible('tenant-a', labour)).resolves.toEqual(
      [],
    );
  });

  it('allows IRT and INSS when there is employee or processed payroll activity', async () => {
    const { prisma, service } = fixture();
    prisma.payroll.count.mockResolvedValue(1);
    const labour = [
      { ...iva, type: 'IRT' },
      { ...iva, type: 'SS' },
    ];
    await expect(service.filterEligible('tenant-a', labour)).resolves.toEqual(
      labour,
    );
  });

  it('allows a legitimate IVA reminder only when the company has operations', async () => {
    const { prisma, service } = fixture();
    prisma.invoice.count.mockResolvedValue(1);
    await expect(service.filterEligible('tenant-a', [iva])).resolves.toEqual([
      iva,
    ]);
  });

  it('fails closed when the obligation period is unknown', async () => {
    const { service } = fixture();
    await expect(
      service.filterEligible('tenant-a', [{ ...iva, period: null }]),
    ).resolves.toEqual([]);
  });
});
