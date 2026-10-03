import { ObligationsService } from '../obligations/obligations.service';
import { FiscalRegime } from '@prisma/client';
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
      include: expect.objectContaining({
        client: true,
        tenant: true,
        items: { include: { product: true } },
      }),
    }));
  });

  it('emite nova factura com snapshot fiscal e assinatura persistidos atomicamente', async () => {
    const create = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'invoice-1', ...data }));
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ lock: '1' }]),
      invoice: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create,
      },
    };
    const prisma = {
      tenant: { findUnique: jest.fn().mockResolvedValue({ id: 'tenant-a', name: 'Empresa A', nif: '5000000001', regime: FiscalRegime.GERAL, retentionRate: 0 }) },
      client: { findFirst: jest.fn().mockResolvedValue({ id: 'client-a', tenantId: 'tenant-a', city: 'Luanda' }) },
      product: { findMany: jest.fn().mockResolvedValue([{ id: 'product-a', name: 'Serviço', price: 100, priceAmount: null, unit: 'SERVICO' }]) },
      $transaction: jest.fn((callback) => callback(tx)),
    } as unknown as PrismaService;
    const fiscalSignature = {
      sign: jest.fn().mockReturnValue({ hash: 'signed-hash', hashControl: '1', keyVersion: 1 }),
    };
    const service = new InvoiceService(
      prisma,
      { syncCompany: jest.fn() } as any,
      { syncTenant: jest.fn() } as any,
      fiscalSignature as any,
    );

    await service.create('tenant-a', {
      clientId: 'client-a',
      items: [{ productId: 'product-a', productName: 'ignorado', quantity: 1, unitPrice: 1 }],
    });

    expect(prisma.client.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'client-a', tenantId: 'tenant-a' } }));
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(fiscalSignature.sign).toHaveBeenCalledWith(expect.objectContaining({ previousHash: null }));
    const persisted = create.mock.calls[0][0].data;
    expect(persisted).toEqual(expect.objectContaining({
      tenantId: 'tenant-a', fiscalHash: 'signed-hash', fiscalHashControl: '1',
      signatureKeyVersion: 1, previousFiscalHash: null,
    }));
    expect(persisted.items.create[0]).toEqual(expect.objectContaining({
      taxType: 'IVA', taxCode: 'NOR', taxRate: expect.anything(), taxAmount: expect.anything(),
    }));
  });
});
