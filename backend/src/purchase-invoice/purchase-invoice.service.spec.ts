import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseInvoiceDocumentStatus, PurchaseInvoicePaymentMethod, PurchaseInvoicePaymentStatus, Prisma } from '@prisma/client';
import { PurchaseInvoiceService } from './purchase-invoice.service';

describe('PurchaseInvoiceService workflow', () => {
  const obligations = { syncCompany: jest.fn().mockResolvedValue(undefined) };
  const fiscal = { syncTenant: jest.fn().mockResolvedValue(undefined) };
  const base = {
    id: 'invoice-a', tenantId: 'tenant-a', supplierId: 'supplier-a', invoiceNumber: 'PP01P2026/1',
    issuedAt: new Date('2026-01-10'), total: 1000, totalAmount: new Prisma.Decimal(1000),
    iva: 0, ivaAmount: new Prisma.Decimal(0), withholdingTax: 0, withholdingTaxAmount: new Prisma.Decimal(0),
    paidAmount: new Prisma.Decimal(0), documentStatus: PurchaseInvoiceDocumentStatus.PENDING,
    paymentStatus: PurchaseInvoicePaymentStatus.UNPAID, supplier: { id: 'supplier-a' },
    items: [{ quantity: 1, quantityAmount: new Prisma.Decimal(1), unitPrice: 1000, unitPriceAmount: new Prisma.Decimal(1000) }],
  };

  function setup(overrides: Record<string, unknown> = {}) {
    const prisma: any = {
      purchaseInvoice: { findFirst: jest.fn(), update: jest.fn() },
      purchaseInvoicePayment: { create: jest.fn() },
      $queryRaw: jest.fn(),
      $transaction: jest.fn(),
      ...overrides,
    };
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma));
    return { prisma, service: new PurchaseInvoiceService(prisma, obligations as any, fiscal as any) };
  }

  beforeEach(() => jest.clearAllMocks());

  it('isolates detail lookup by tenant', async () => {
    const { prisma, service } = setup();
    prisma.purchaseInvoice.findFirst.mockResolvedValue(null);
    await expect(service.findOne('tenant-b', 'invoice-a')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.purchaseInvoice.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'invoice-a', tenantId: 'tenant-b' } }));
  });

  it('validates a zero VAT invoice and recalculates totals with Decimal', async () => {
    const { prisma, service } = setup();
    prisma.purchaseInvoice.findFirst.mockResolvedValueOnce(base).mockResolvedValueOnce({ ...base, documentStatus: PurchaseInvoiceDocumentStatus.VALIDATED, supplier: { id: 'supplier-a', name: 'Anny', nif: null }, payments: [], confirmedImport: null });
    await service.validate('tenant-a', 'user-a', 'invoice-a');
    expect(prisma.purchaseInvoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ documentStatus: 'VALIDATED', subtotalAmount: new Prisma.Decimal(1000), totalAmount: new Prisma.Decimal(1000) }) }));
  });

  it('requires a rejection reason and preserves tenant scope', async () => {
    const { prisma, service } = setup();
    prisma.purchaseInvoice.findFirst.mockResolvedValue(base);
    await expect(service.reject('tenant-a', 'user-a', 'invoice-a', '  ')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.purchaseInvoice.findFirst).toHaveBeenCalledWith({ where: { id: 'invoice-a', tenantId: 'tenant-a' } });
  });

  it('registers a partial payment atomically', async () => {
    const { prisma, service } = setup();
    prisma.$queryRaw.mockResolvedValue([{ id: 'invoice-a' }]);
    prisma.purchaseInvoice.findFirst.mockResolvedValueOnce({ ...base, documentStatus: PurchaseInvoiceDocumentStatus.VALIDATED }).mockResolvedValueOnce({ ...base, paidAmount: new Prisma.Decimal(400), paymentStatus: PurchaseInvoicePaymentStatus.PARTIALLY_PAID, supplier: { id: 'supplier-a', name: 'Anny', nif: null }, items: [], payments: [], confirmedImport: null });
    await service.addPayment('tenant-a', 'user-a', 'invoice-a', { amount: 400, paymentDate: '2026-01-12', method: PurchaseInvoicePaymentMethod.BANK_TRANSFER });
    expect(prisma.purchaseInvoicePayment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-a', amount: new Prisma.Decimal(400) }) }));
    expect(prisma.purchaseInvoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ paymentStatus: 'PARTIALLY_PAID', paidAmount: new Prisma.Decimal(400) }) }));
  });

  it('completes payment and rejects overpayment and invalid states', async () => {
    const { prisma, service } = setup();
    prisma.$queryRaw.mockResolvedValue([{ id: 'invoice-a' }]);
    prisma.purchaseInvoice.findFirst.mockResolvedValue({ ...base, documentStatus: PurchaseInvoiceDocumentStatus.VALIDATED, paidAmount: new Prisma.Decimal(600) });
    await expect(service.addPayment('tenant-a', 'user-a', 'invoice-a', { amount: 401, paymentDate: '2026-01-12', method: PurchaseInvoicePaymentMethod.CASH })).rejects.toBeInstanceOf(BadRequestException);
    prisma.purchaseInvoice.findFirst.mockResolvedValue({ ...base, documentStatus: PurchaseInvoiceDocumentStatus.REJECTED });
    await expect(service.addPayment('tenant-a', 'user-a', 'invoice-a', { amount: 10, paymentDate: '2026-01-12', method: PurchaseInvoicePaymentMethod.CASH })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks an exact final payment as paid', async () => {
    const { prisma, service } = setup();
    prisma.$queryRaw.mockResolvedValue([{ id: 'invoice-a' }]);
    prisma.purchaseInvoice.findFirst
      .mockResolvedValueOnce({ ...base, documentStatus: PurchaseInvoiceDocumentStatus.VALIDATED, paidAmount: new Prisma.Decimal(600) })
      .mockResolvedValueOnce({ ...base, documentStatus: PurchaseInvoiceDocumentStatus.VALIDATED, paidAmount: new Prisma.Decimal(1000), paymentStatus: PurchaseInvoicePaymentStatus.PAID, supplier: { id: 'supplier-a', name: 'Anny', nif: null }, payments: [], confirmedImport: null });
    await service.addPayment('tenant-a', 'user-a', 'invoice-a', { amount: 400, paymentDate: '2026-01-12', method: PurchaseInvoicePaymentMethod.MULTICAIXA_TPA });
    expect(prisma.purchaseInvoice.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ paidAmount: new Prisma.Decimal(1000), paymentStatus: PurchaseInvoicePaymentStatus.PAID }),
    }));
  });

  it.each([PurchaseInvoiceDocumentStatus.PENDING, PurchaseInvoiceDocumentStatus.CANCELLED])(
    'rejects payments while document status is %s',
    async (documentStatus) => {
      const { prisma, service } = setup();
      prisma.$queryRaw.mockResolvedValue([{ id: 'invoice-a' }]);
      prisma.purchaseInvoice.findFirst.mockResolvedValue({ ...base, documentStatus });
      await expect(service.addPayment('tenant-a', 'user-a', 'invoice-a', { amount: 10, paymentDate: '2026-01-12', method: PurchaseInvoicePaymentMethod.CASH })).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
