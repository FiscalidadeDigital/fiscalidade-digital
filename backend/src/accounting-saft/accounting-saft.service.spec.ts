import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AccountingSaftService } from './accounting-saft.service';

describe('AccountingSaftService', () => {
  const tenant = { findUnique: jest.fn() };
  const client = { count: jest.fn() };
  const supplier = { count: jest.fn() };
  const product = { count: jest.fn() };
  const invoice = { count: jest.fn() };
  const purchaseInvoice = { count: jest.fn() };
  const taxTransaction = { count: jest.fn() };
  const prisma = {
    tenant,
    client,
    supplier,
    product,
    invoice,
    purchaseInvoice,
    taxTransaction,
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  let service: AccountingSaftService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccountingSaftService(prisma);
  });

  it('filtra todas as fontes pelo tenant autenticado e não disponibiliza XML', async () => {
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      {
        id: 'tenant-a',
        name: 'Empresa A',
        nif: '5000000000',
        address: null,
        regime: 'GERAL',
      },
      3,
      1,
      2,
      0,
      4,
      2,
      8,
      5,
      11,
    ]);

    const result = await service.getReadiness('tenant-a', 2026);

    expect(client.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a' } });
    expect(supplier.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a' } });
    expect(product.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a' } });
    expect(invoice.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }),
    );
    expect(purchaseInvoice.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }),
    );
    expect(taxTransaction.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }),
    );
    expect(result.canExport).toBe(false);
    expect(result.exportEndpointAvailable).toBe(false);
    expect(result.schema.version).toBe('1.01_01');
    expect(result.schema.status).toBe('TECHNICAL_REFERENCE_NOT_OFFICIALLY_VERIFIED');
    expect(result.certification.status).toBe('NOT_CERTIFIED');
    expect(result.sections.accountingMovements.state).toBe('BLOCKED');
    expect(result.dataQualityIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'CLIENTS_WITHOUT_NIF', count: 1 }),
        expect.objectContaining({ code: 'PRODUCTS_WITHOUT_CODE', count: 2 }),
      ]),
    );
  });

  it('não devolve dados quando o tenant não existe', async () => {
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      null,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]);

    await expect(service.getReadiness('missing', 2026)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
