import { FiscalRegime, InvoiceDocumentType, InvoiceStatus, TaxRuleOperation, TaxType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { FiscalEngineService } from '../src/fiscal-engine/fiscal-engine.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Fiscal engine VAT document eligibility', () => {
  let prisma: PrismaService;
  let service: FiscalEngineService;
  let tenantId: string;

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [FiscalEngineService],
    }).compile();
    prisma = module.get(PrismaService);
    service = module.get(FiscalEngineService);

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const tenant = await prisma.tenant.create({
      data: {
        name: `Fiscal VAT tenant ${suffix}`,
        nif: `VAT-${suffix}`,
        email: `vat-${suffix}@example.test`,
        status: 'ACTIVE',
        regime: FiscalRegime.GERAL,
      },
    });
    tenantId = tenant.id;
    const [client, supplier] = await Promise.all([
      prisma.client.create({ data: { tenantId, name: 'Cliente IVA' } }),
      prisma.supplier.create({ data: { tenantId, name: 'Fornecedor IVA' } }),
    ]);
    const issuedAt = new Date('2026-10-01T12:00:00.000Z');
    await prisma.invoice.createMany({
      data: [
        {
          tenantId,
          clientId: client.id,
          invoiceNumber: `FT-${suffix}`,
          documentType: InvoiceDocumentType.NORMAL,
          subtotal: 1000.05,
          subtotalAmount: '1000.05',
          iva: 140.01,
          ivaAmount: '140.01',
          total: 1140.06,
          totalAmount: '1140.06',
          status: InvoiceStatus.PENDING,
          issuedAt,
        },
        {
          tenantId,
          clientId: client.id,
          invoiceNumber: `PF-${suffix}`,
          documentType: InvoiceDocumentType.PRO_FORMA,
          subtotal: 500,
          subtotalAmount: '500.00',
          iva: 0,
          ivaAmount: '0.00',
          total: 500,
          totalAmount: '500.00',
          status: InvoiceStatus.PENDING,
          issuedAt,
        },
      ],
    });
    await prisma.purchaseInvoice.create({
      data: {
        tenantId,
        supplierId: supplier.id,
        invoiceNumber: `SUP-${suffix}`,
        subtotal: 300.03,
        subtotalAmount: '300.03',
        iva: 42,
        ivaAmount: '42.00',
        total: 342.03,
        totalAmount: '342.03',
        issuedAt,
      },
    });
  });

  afterAll(async () => {
    if (prisma && tenantId) {
      await prisma.taxAssessment.deleteMany({ where: { tenantId } });
      await prisma.taxTransaction.deleteMany({ where: { tenantId } });
      await prisma.purchaseInvoice.deleteMany({ where: { tenantId } });
      await prisma.invoice.deleteMany({ where: { tenantId } });
      await prisma.supplier.deleteMany({ where: { tenantId } });
      await prisma.client.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
    }
  });

  it('uses only NORMAL invoices for output VAT and keeps purchase VAT pending review', async () => {
    const result = await service.syncTenant(tenantId, 2026);
    expect(result.activity.invoices).toBe(1);
    expect(result.totals.ivaLiquidado).toBe(140.01);
    expect(result.totals.ivaDedutivel).toBe(0);
    expect(result.totals.ivaFinal).toBe(140.01);

    const transactions = await prisma.taxTransaction.findMany({
      where: { tenantId, taxType: TaxType.IVA },
      orderBy: { sourceType: 'asc' },
    });
    expect(transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: TaxRuleOperation.SALE, sourceType: 'INVOICE_IVA', taxAmount: 140.01, deductibleAmount: 0 }),
      expect.objectContaining({ operation: TaxRuleOperation.PURCHASE, sourceType: 'PURCHASE_INVOICE_IVA_SUPPORTED_PENDING_REVIEW', taxAmount: 42, deductibleAmount: 0 }),
    ]));
    expect(transactions).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceType: 'INVOICE_IVA', baseAmount: 1500.05 }),
    ]));
  });
});
