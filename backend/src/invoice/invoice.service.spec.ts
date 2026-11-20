import { BadRequestException } from '@nestjs/common';
import { FiscalRegime, Prisma } from '@prisma/client';
import { FiscalEngineService } from '../fiscal-engine/fiscal-engine.service';
import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';
import { ObligationsService } from '../obligations/obligations.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceService } from './invoice.service';

async function expectBadRequestResponse(
  operation: Promise<unknown>,
  expectedResponse: Record<string, unknown>,
): Promise<void> {
  try {
    await operation;
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);

    if (!(error instanceof BadRequestException)) {
      return;
    }

    const response = error.getResponse();

    if (typeof response === 'string' || response === null) {
      throw new Error('Expected a structured bad-request response.');
    }

    expect(response).toMatchObject(expectedResponse);
    return;
  }

  throw new Error('Expected the operation to reject with BadRequestException.');
}

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
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'product-a',
            name: 'Serviço',
            price: 100,
            priceAmount: null,
            unit: 'SERVICO',
            electronicOperationType: 'SE',
          },
        ]),
      },
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
      { resolve: jest.fn().mockResolvedValue({ regime: FiscalRegime.GERAL }) } as any,
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
      invoiceNumber: expect.stringMatching(/^FT FT\d{4}\/\d{5}$/),
      fiscalSeries: expect.stringMatching(/^FT\d{4}$/),
      fiscalSequence: 1,
    }));
    expect(persisted.items.create[0]).toEqual(expect.objectContaining({
      taxType: 'IVA', taxCode: 'NOR', taxRate: expect.anything(), taxAmount: expect.anything(),
    }));
    expect(persisted).toMatchObject({
      taxCalculationStatus: 'STANDARD_RATE_CLASSIFIED',
    });
  });

  it('persists an exportable simplified IVA snapshot and required invoice mention', async () => {
    const create = jest
      .fn()
      .mockImplementation(({ data }) => Promise.resolve({ id: 'invoice-simplified', ...data }));
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ lock: '1' }]),
      invoice: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create,
      },
    };
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-a',
          name: 'Empresa A',
          nif: '5000000001',
          retentionRate: 0,
        }),
      },
      client: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'client-a',
          tenantId: 'tenant-a',
          city: 'Luanda',
        }),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'product-a',
            name: 'Serviço simplificado',
            price: 100,
            priceAmount: null,
            unit: 'SERVICO',
            electronicOperationType: null,
          },
        ]),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    } as unknown as PrismaService;
    const fiscalSignature = {
      sign: jest.fn().mockReturnValue({
        hash: 'simplified-hash',
        hashControl: '2',
        keyVersion: 1,
      }),
    };
    const service = new InvoiceService(
      prisma,
      { syncCompany: jest.fn() } as any,
      { syncTenant: jest.fn() } as any,
      fiscalSignature as any,
      { resolve: jest.fn().mockResolvedValue({ regime: FiscalRegime.SIMPLIFICADO }) } as any,
    );

    await service.create('tenant-a', {
      clientId: 'client-a',
      notes: 'Condições comerciais acordadas.',
      items: [
        {
          productId: 'product-a',
          productName: 'ignorado',
          quantity: 1,
          unitPrice: 1,
        },
      ],
    });

    const persisted = create.mock.calls[0][0].data;
    expect(persisted).toEqual(
      expect.objectContaining({
        invoiceNumber: expect.stringMatching(/^FT FT\d{4}\/\d{5}$/),
        notes: 'IVA - Regime Simplificado\nCondições comerciais acordadas.',
      }),
    );
    expect(persisted.items.create[0]).toEqual(
      expect.objectContaining({
        taxType: 'IVA',
        taxCode: 'OUT',
        taxRate: expect.anything(),
        taxAmount: expect.anything(),
        taxExemptionCode: 'M00',
        taxExemptionReason: 'IVA - Regime Simplificado',
      }),
    );
  });

  it('leaves IVA undetermined instead of assuming 14% without line classification', async () => {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-a',
          name: 'Empresa A',
          nif: '5000000001',
          retentionRate: 0,
        }),
      },
      client: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'client-a', tenantId: 'tenant-a' }),
      },
      product: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const obligations = {} as ObligationsService;
    const fiscalEngine = {} as FiscalEngineService;
    const enrollments = {
      resolve: jest.fn().mockResolvedValue({ regime: FiscalRegime.GERAL }),
    } as unknown as FiscalEnrollmentService;
    const service = new InvoiceService(
      prisma,
      obligations,
      fiscalEngine,
      undefined,
      enrollments,
    );

    await expectBadRequestResponse(
      service.create('tenant-a', {
        clientId: 'client-a',
        items: [
          {
            productName: 'Serviço sem classificação',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      }),
      {
        code: 'IVA_FISCAL_CLASSIFICATION_REQUIRED',
        rate: null,
        ratePercent: null,
        iva: null,
        total: null,
        calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION',
      },
    );
  });

  it('does not reinterpret an UNKNOWN IVA enrollment as GERAL', async () => {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-a',
          name: 'Empresa A',
          nif: '5000000001',
          retentionRate: 0,
        }),
      },
      client: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'client-a', tenantId: 'tenant-a' }),
      },
      product: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const obligations = {} as ObligationsService;
    const fiscalEngine = {} as FiscalEngineService;
    const enrollments = {
      resolve: jest
        .fn()
        .mockResolvedValue({ regime: null, knowledgeStatus: 'UNKNOWN' }),
    } as unknown as FiscalEnrollmentService;
    const service = new InvoiceService(
      prisma,
      obligations,
      fiscalEngine,
      undefined,
      enrollments,
    );

    await expectBadRequestResponse(
      service.create('tenant-a', {
        clientId: 'client-a',
        items: [
          {
            productName: 'Serviço classificado',
            quantity: 1,
            unitPrice: 100,
            electronicOperationType: 'SE',
          },
        ],
      }),
      {
        code: 'IVA_ENROLLMENT_UNCONFIRMED',
        iva: null,
        total: null,
        calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION',
      },
    );
  });

  it('blocks fiscal issuance without a current IVA enrollment instead of using Tenant.regime', async () => {
    const prisma = {
      tenant: { findUnique: jest.fn().mockResolvedValue({ id: 'tenant-a', name: 'Empresa A', nif: '5000000001', regime: FiscalRegime.GERAL, retentionRate: 0 }) },
      client: { findFirst: jest.fn().mockResolvedValue({ id: 'client-a', tenantId: 'tenant-a' }) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const enrollments = { resolve: jest.fn().mockResolvedValue(null) };
    const service = new InvoiceService(prisma, {} as any, {} as any, undefined, enrollments as any);

    await expect(service.create('tenant-a', {
      clientId: 'client-a', items: [{ productName: 'Serviço', quantity: 1, unitPrice: 100 }],
    })).rejects.toMatchObject({ response: expect.objectContaining({ code: 'IVA_ENROLLMENT_REQUIRED' }) });
    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-a', 'IVA', expect.any(Date));
  });
});

describe('InvoiceService adjustment notes', () => {
  const sourceInvoice = {
    id: 'invoice-source',
    tenantId: 'tenant-a',
    clientId: 'client-a',
    subtotal: 100,
    subtotalAmount: new Prisma.Decimal('100.00'),
    iva: 14,
    ivaAmount: new Prisma.Decimal('14.00'),
    withholdingTax: 0,
    withholdingTaxAmount: new Prisma.Decimal('0.00'),
    total: 114,
    totalAmount: new Prisma.Decimal('114.00'),
    taxRuleVersion: 'AO-CIVA-LEI-14-23',
    documentType: 'NORMAL',
    fiscalDocumentType: 'FT',
    status: 'PENDING',
    items: [
      {
        id: 'line-source',
        productId: 'product-a',
        productName: 'Servico de origem',
        quantity: 2,
        quantityAmount: new Prisma.Decimal('2.0000'),
        unitPrice: 50,
        unitPriceAmount: new Prisma.Decimal('50.00'),
        total: 100,
        totalAmount: new Prisma.Decimal('100.00'),
        unit: 'SERVICO',
        taxType: 'IVA',
        taxCode: 'NOR',
        taxRate: new Prisma.Decimal('14'),
        taxAmount: new Prisma.Decimal('14.00'),
        taxExemptionCode: null,
        taxExemptionReason: null,
        electronicOperationType: 'SE',
      },
    ],
  };

  it('creates a credit note from a same-tenant invoice and preserves its fiscal snapshot', async () => {
    const create = jest.fn().mockImplementation(({ data }) => ({ id: 'note-a', ...data }));
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ lock: '1' }]),
      invoice: {
        findFirst: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        findMany: jest.fn().mockResolvedValue([]),
        create,
      },
    };
    const findFirst = jest.fn().mockResolvedValue(sourceInvoice);
    const prisma = {
      invoice: { findFirst },
      $transaction: jest.fn((callback) => callback(tx)),
    } as unknown as PrismaService;
    const signature = {
      sign: jest.fn().mockReturnValue({
        hash: 'note-hash',
        hashControl: '7',
        keyVersion: 1,
      }),
    };
    const service = new InvoiceService(
      prisma,
      { syncCompany: jest.fn() } as any,
      { syncTenant: jest.fn() } as any,
      signature as any,
    );

    await service.createCreditNote('tenant-a', {
      sourceInvoiceId: 'invoice-source',
      reason: 'Devolucao parcial',
      items: [{ sourceInvoiceItemId: 'line-source', quantity: 1 }],
    });

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'invoice-source',
        tenantId: 'tenant-a',
        fiscalDocumentType: 'FT',
      }),
    }));
    const persisted = create.mock.calls[0][0].data;
    expect(persisted).toMatchObject({
      tenantId: 'tenant-a',
      clientId: 'client-a',
      documentType: 'NORMAL',
      fiscalDocumentType: 'NC',
      fiscalSeries: expect.stringMatching(/^NC\d{4}$/),
      invoiceNumber: expect.stringMatching(/^NC NC\d{4}\/\d{5}$/),
      rectifiesInvoiceId: 'invoice-source',
      subtotal: 50,
      iva: 7,
      total: 57,
      fiscalHash: 'note-hash',
    });
    expect(persisted.items.create[0]).toEqual(expect.objectContaining({
      productId: 'product-a',
      quantity: 1,
      unitPrice: 50,
      total: 50,
      taxRate: expect.anything(),
      taxAmount: expect.anything(),
      electronicOperationType: 'SE',
    }));
    expect(signature.sign).toHaveBeenCalledWith(expect.objectContaining({
      invoiceNo: expect.stringMatching(/^NC NC\d{4}\/\d{5}$/),
      grossTotal: '57.00',
    }));
  });

  it('approves a complete note automatically before it is issued', async () => {
    const findFirst = jest.fn().mockResolvedValue(sourceInvoice);
    const service = new InvoiceService(
      { invoice: { findFirst } } as unknown as PrismaService,
      {} as ObligationsService,
      {} as FiscalEngineService,
    );

    await expect(
      service.validateCreditNote('tenant-a', {
        sourceInvoiceId: 'invoice-source',
        reason: 'Devolução parcial',
        items: [{ sourceInvoiceItemId: 'line-source', quantity: 1 }],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'VALIDATED',
        canCreate: true,
        checks: expect.arrayContaining([
          expect.objectContaining({
            label: 'Valores e impostos confirmados',
            passed: true,
          }),
        ]),
      }),
    );
  });

  it('requires recovery instead of issuing a note without source lines', async () => {
    const transaction = jest.fn();
    const service = new InvoiceService(
      {
        invoice: {
          findFirst: jest.fn().mockResolvedValue({
            ...sourceInvoice,
            items: [],
          }),
        },
        $transaction: transaction,
      } as unknown as PrismaService,
      {} as ObligationsService,
      {} as FiscalEngineService,
    );

    await expect(
      service.validateDebitNote('tenant-a', {
        sourceInvoiceId: 'invoice-source',
        reason: 'Acerto documentado',
        items: [{ sourceInvoiceItemId: 'line-source', quantity: 1 }],
      }),
    ).resolves.toMatchObject({
      status: 'RECOVERY_REQUIRED',
      canCreate: false,
      message: expect.stringContaining('detalhe dos artigos ou serviços'),
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('does not disclose or use an invoice from another tenant as a note source', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = new InvoiceService(
      { invoice: { findFirst } } as unknown as PrismaService,
      {} as ObligationsService,
      {} as FiscalEngineService,
    );

    await expect(service.createDebitNote('tenant-a', {
      sourceInvoiceId: 'invoice-b',
      reason: 'Acerto documentado',
      items: [{ sourceInvoiceItemId: 'line-b', quantity: 1 }],
    })).rejects.toThrow('factura de origem');
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'invoice-b', tenantId: 'tenant-a' }),
    }));
  });

  it('blocks adjustment notes when the source invoice has no recorded items', async () => {
    const transaction = jest.fn();
    const service = new InvoiceService(
      {
        invoice: {
          findFirst: jest.fn().mockResolvedValue({
            ...sourceInvoice,
            items: [],
          }),
        },
        $transaction: transaction,
      } as unknown as PrismaService,
      {} as ObligationsService,
      {} as FiscalEngineService,
    );

    await expect(
      service.createCreditNote('tenant-a', {
        sourceInvoiceId: 'invoice-source',
        reason: 'Correcção documentada',
        items: [{ sourceInvoiceItemId: 'line-source', quantity: 1 }],
      }),
    ).rejects.toThrow('detalhe dos artigos ou serviços');

    expect(transaction).not.toHaveBeenCalled();
  });

  it('blocks payment of a Pro Forma before any state transition', async () => {
    const updateMany = jest.fn();
    const service = new InvoiceService(
      {
        invoice: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'pro-forma-a',
            documentType: 'PRO_FORMA',
            fiscalDocumentType: null,
            status: 'PENDING',
          }),
          updateMany,
        },
      } as unknown as PrismaService,
      {} as ObligationsService,
      {} as FiscalEngineService,
    );

    await expect(service.markAsPaid('tenant-a', 'pro-forma-a')).rejects.toThrow(
      'Pro Forma',
    );
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('blocks direct payment of adjustment notes before any state transition', async () => {
    const updateMany = jest.fn();
    const service = new InvoiceService(
      {
        invoice: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'note-a',
            documentType: 'NORMAL',
            fiscalDocumentType: 'NC',
            status: 'PENDING',
          }),
          updateMany,
        },
      } as unknown as PrismaService,
      {} as ObligationsService,
      {} as FiscalEngineService,
    );

    await expect(service.markAsPaid('tenant-a', 'note-a')).rejects.toThrow(
      'fluxo financeiro',
    );
    expect(updateMany).not.toHaveBeenCalled();
  });
});
