import { ObligationsService } from '../obligations/obligations.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceService } from './invoice.service';

describe('InvoiceService paged list', () => {
  it('scopes search, statuses and totals to the authenticated tenant', async () => {
    const findMany = jest.fn();
    const prisma = {
      invoice: { count: jest.fn(), findMany, aggregate: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([
        1,
        [{ id: 'invoice-a', tenantId: 'tenant-a', invoiceNumber: 'FT-2026-00001' }],
        2,
        3,
        1,
        { _sum: { total: 12500.5, iva: 1500.25 } },
      ]),
    } as unknown as PrismaService;
    const obligations = {} as ObligationsService;
    const service = new InvoiceService(prisma, obligations, {
      syncTenant: jest.fn(),
    } as any);

    const result = await service.findPage('tenant-a', {
      search: 'cliente',
      page: 1,
      pageSize: 20,
      sortBy: 'issuedAt',
      sortDirection: 'desc',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
        skip: 0,
        take: 20,
      }),
    );
    expect(result.summary).toEqual({
      total: 6,
      pending: 2,
      paid: 3,
      cancelled: 1,
      totalInvoiced: 12500.5,
      totalInvoicedAmount: '12500.50',
      ivaInvoiced: 1500.25,
      ivaInvoicedAmount: '1500.25',
    });
  });

  it('keeps PDF lookup scoped to the authenticated tenant', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = { invoice: { findFirst } } as unknown as PrismaService;
    const service = new InvoiceService(prisma, {} as ObligationsService, { syncTenant: jest.fn() } as any);

    await expect(service.generatePdf('tenant-a', 'invoice-b', {} as any)).rejects.toThrow('Factura não encontrada.');
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'invoice-b', tenantId: 'tenant-a' },
      include: expect.objectContaining({ client: true, tenant: true }),
    }));
  });
});
