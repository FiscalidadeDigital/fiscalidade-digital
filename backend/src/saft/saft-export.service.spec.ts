import { generateKeyPairSync } from 'node:crypto';
import { Prisma } from '@prisma/client';

import { FiscalSignatureService } from '../fiscal-signature/fiscal-signature.service';
import type { PrismaService } from '../prisma/prisma.service';
import { SaftExportService } from './saft-export.service';
import { SaftXmlSerializer } from './serializers/saft-xml.serializer';
import { SaftXsdValidator } from './validators/saft-xsd.validator';

describe('SaftExportService technical fixture', () => {
  it('assina no motor, constrói o AuditFile e passa no XSD técnico', async () => {
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    process.env.FISCAL_SIGNATURE_PRIVATE_KEY = pair.privateKey;
    process.env.FISCAL_SIGNATURE_KEY_VERSION = '1';
    const issuedAt = new Date('2026-01-15T10:20:30.000Z');
    const signature = new FiscalSignatureService().sign({
      invoiceDate: issuedAt,
      systemEntryDate: issuedAt,
      invoiceNo: 'FT FT2026/00001',
      grossTotal: '114.00',
      previousHash: null,
    });
    const invoice = {
      id: 'invoice-1',
      tenantId: 'tenant-1',
      clientId: 'customer-1',
      invoiceNumber: 'FT FT2026/00001',
      fiscalDocumentType: 'FT',
      fiscalSeries: 'FT2026',
      fiscalSequence: 1,
      fiscalYear: 2026,
      status: 'PENDING',
      cancellationReason: null,
      issuedAt,
      createdAt: issuedAt,
      fiscalHash: signature.hash,
      fiscalHashControl: signature.hashControl,
      subtotal: 100,
      subtotalAmount: new Prisma.Decimal('100.00'),
      iva: 14,
      ivaAmount: new Prisma.Decimal('14.00'),
      total: 114,
      totalAmount: new Prisma.Decimal('114.00'),
      client: {
        id: 'customer-1',
        nif: '5000000000',
        name: 'Cliente Teste',
        address: 'Rua de Teste',
        city: 'Luanda',
        country: 'AO',
        email: null,
      },
      items: [
        {
          productId: 'product-1',
          productName: 'Serviço técnico',
          unit: 'UN',
          quantity: 1,
          quantityAmount: new Prisma.Decimal('1'),
          unitPrice: 100,
          unitPriceAmount: new Prisma.Decimal('100.00'),
          total: 100,
          totalAmount: new Prisma.Decimal('100.00'),
          taxType: 'IVA',
          taxCode: 'NOR',
          taxRate: new Prisma.Decimal('14'),
          taxAmount: new Prisma.Decimal('14'),
          taxExemptionCode: null,
          taxExemptionReason: null,
          product: { code: 'SERV-001' },
        },
      ],
    };
    const creditNote = {
      ...invoice,
      id: 'invoice-2',
      invoiceNumber: 'NC NC2026/00001',
      fiscalDocumentType: 'NC',
      fiscalSeries: 'NC2026',
      fiscalSequence: 1,
      rectifiedInvoiceNumber: invoice.invoiceNumber,
      notes: 'Devolução parcial',
      subtotal: 20,
      subtotalAmount: new Prisma.Decimal('20.00'),
      iva: 2.8,
      ivaAmount: new Prisma.Decimal('2.80'),
      total: 22.8,
      totalAmount: new Prisma.Decimal('22.80'),
      items: [
        {
          ...invoice.items[0],
          quantity: 0.2,
          quantityAmount: new Prisma.Decimal('0.2'),
          total: 20,
          totalAmount: new Prisma.Decimal('20.00'),
          taxAmount: new Prisma.Decimal('2.80'),
        },
      ],
    };
    const simplifiedSignature = new FiscalSignatureService().sign({
      invoiceDate: issuedAt,
      systemEntryDate: issuedAt,
      invoiceNo: 'FT FT2026/00002',
      grossTotal: '100.00',
      previousHash: signature.hash,
    });
    const simplifiedInvoice = {
      ...invoice,
      id: 'invoice-3',
      invoiceNumber: 'FT FT2026/00002',
      fiscalSeries: 'FT2026',
      fiscalSequence: 2,
      fiscalHash: simplifiedSignature.hash,
      fiscalHashControl: simplifiedSignature.hashControl,
      subtotal: 100,
      subtotalAmount: new Prisma.Decimal('100.00'),
      iva: 0,
      ivaAmount: new Prisma.Decimal('0.00'),
      total: 100,
      totalAmount: new Prisma.Decimal('100.00'),
      notes: 'IVA - Regime Simplificado',
      items: [
        {
          ...invoice.items[0],
          taxCode: 'OUT',
          taxRate: new Prisma.Decimal('0'),
          taxAmount: new Prisma.Decimal('0'),
          taxExemptionCode: 'M00',
          taxExemptionReason: 'IVA - Regime Simplificado',
        },
      ],
    };
    const serializer = new SaftXmlSerializer();
    const validator = new SaftXsdValidator();
    const service = new SaftExportService(
      {} as unknown as PrismaService,
      serializer,
      validator,
      new FiscalSignatureService(),
    );
    const model = service.compose({
      tenant: {
        id: 'tenant-1',
        nif: '5000000001',
        name: 'Empresa Teste',
        address: 'Avenida de Teste',
        city: 'Luanda',
        country: 'AO',
        email: 'teste@example.ao',
      },
      invoices: [invoice, creditNote, simplifiedInvoice],
      start: new Date('2026-01-01T00:00:00Z'),
      end: new Date('2026-12-31T00:00:00Z'),
      software: {
        productCompanyTaxId: '5000000002',
        softwareValidationNumber: '999/AGT/2026',
        productId: 'Fiscalidade Digital / TEST_KEY_ONLY',
        productVersion: 'test',
      },
      sourceId: 'user-1',
    });
    const xml = serializer.serialize(model);
    expect(xml).toContain(signature.hash);
    expect(xml).toContain('<DebitAmount>20.00</DebitAmount>');
    expect(xml).toContain('<Reference>FT FT2026/00001</Reference>');
    expect(xml).toContain('<TaxExemptionCode>M00</TaxExemptionCode>');
    expect(model.totalCredit).toBe('200.00');
    expect(model.totalDebit).toBe('20.00');
    expect(xml).not.toMatch(/undefined|null|NaN|Infinity/);
    const result = await validator.validate(xml);
    expect(result).toEqual({
      valid: true,
      kind: 'TECHNICAL_XSD_VALIDATION',
      errors: [],
    });
  });
});

describe('SaftExportService company city preflight', () => {
  function setup(city: string | null) {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-1',
          nif: '5000000001',
          name: 'Empresa Teste',
          address: 'Avenida de Teste',
          city,
          country: 'AO',
          email: null,
        }),
      },
      invoice: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const signature = {
      configuration: jest.fn().mockReturnValue({ configured: true }),
    };
    const service = new SaftExportService(
      prisma as unknown as PrismaService,
      {} as SaftXmlSerializer,
      {} as SaftXsdValidator,
      signature as unknown as FiscalSignatureService,
    );
    return { prisma, service };
  }

  beforeEach(() => {
    process.env.SAFT_PRODUCT_COMPANY_TAX_ID = '5000000002';
    process.env.AGT_SOFTWARE_CERTIFICATE_NUMBER = 'TEST-ONLY';
    process.env.AGT_SOFTWARE_PRODUCT_ID = 'TEST-ONLY';
    process.env.SAFT_PRODUCT_VERSION = 'test';
  });

  it('bloqueia a exportação quando a empresa não tem city', async () => {
    const { service } = setup(null);

    const result = await service.preflight('tenant-1', 2026);

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'BLOCKING',
          message:
            'Complete os dados obrigatórios da empresa antes de continuar.',
        }),
      ]),
    );
  });

  it('não produz COMPANY_DATA_MISSING quando os dados obrigatórios existem', async () => {
    const { service } = setup('Huambo');

    const result = await service.preflight('tenant-1', 2026);

    expect(result.issues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'Complete os dados obrigatórios da empresa antes de continuar.',
        }),
      ]),
    );
  });

  it('mantém a disponibilidade externa bloqueada sem certificação confirmada', async () => {
    const { service } = setup('Luanda');

    const preflight = await service.preflight('tenant-1', 2026);

    expect(preflight.ready).toBe(false);
    expect(preflight.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'BLOCKING',
          message:
            'A exportação ainda precisa de confirmação antes de continuar.',
        }),
      ]),
    );
    await expect(
      service.generate('tenant-1', 'user-1', 2026),
    ).rejects.toMatchObject({
      response: { code: 'SAFT_PREFLIGHT_FAILED' },
    });
  });

  it('exclui documentos anulados dos totais monetários do resumo', async () => {
    const issuedAt = new Date('2026-06-15T12:00:00.000Z');
    const active = {
      id: 'active',
      clientId: 'client-1',
      invoiceNumber: 'FT FT2026/00001',
      fiscalDocumentType: 'FT',
      status: 'PAID',
      issuedAt,
      createdAt: issuedAt,
      subtotal: 100,
      subtotalAmount: new Prisma.Decimal('100.00'),
      iva: 14,
      ivaAmount: new Prisma.Decimal('14.00'),
      total: 114,
      totalAmount: new Prisma.Decimal('114.00'),
      fiscalHash: 'hash',
      fiscalHashControl: '1',
      client: {
        id: 'client-1',
        nif: '5000000001',
        name: 'Cliente Teste',
        address: 'Rua de Teste',
        city: 'Luanda',
        country: 'AO',
        email: null,
      },
      items: [
        {
          productId: 'product-1',
          productName: 'Serviço',
          taxType: 'IVA',
          taxCode: 'NOR',
          taxRate: new Prisma.Decimal('14'),
        },
      ],
    };
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-1',
          nif: '5000000001',
          name: 'Empresa Teste',
          address: 'Avenida de Teste',
          city: 'Luanda',
          country: 'AO',
          email: null,
        }),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          active,
          {
            ...active,
            id: 'cancelled',
            invoiceNumber: 'FT FT2026/00002',
            status: 'CANCELLED',
            subtotal: 900,
            subtotalAmount: new Prisma.Decimal('900.00'),
            iva: 126,
            ivaAmount: new Prisma.Decimal('126.00'),
            total: 1026,
            totalAmount: new Prisma.Decimal('1026.00'),
          },
        ]),
      },
    };
    const signature = {
      configuration: jest.fn().mockReturnValue({ configured: true }),
    };
    const service = new SaftExportService(
      prisma as unknown as PrismaService,
      {} as SaftXmlSerializer,
      {} as SaftXsdValidator,
      signature as unknown as FiscalSignatureService,
    );

    await expect(service.summary('tenant-1', 2026)).resolves.toMatchObject({
      documentCount: 2,
      cancelledCount: 1,
      taxableBase: '100.00',
      taxAmount: '14.00',
      grossTotal: '114.00',
    });
  });

  it('usa a city persistida no Header sem fallback', () => {
    const { service } = setup('Lubango');

    const model = service.compose({
      tenant: {
        id: 'tenant-1',
        nif: '5000000001',
        name: 'Empresa Teste',
        address: 'Rua 1',
        city: 'Lubango',
        country: 'AO',
        email: null,
      },
      invoices: [],
      start: new Date('2026-01-01T00:00:00Z'),
      end: new Date('2026-12-31T23:59:59Z'),
      software: {
        productCompanyTaxId: '5000000002',
        softwareValidationNumber: 'TEST-ONLY',
        productId: 'TEST-ONLY',
        productVersion: 'test',
      },
      sourceId: 'user-1',
    });

    expect(model.header.CompanyAddress).toEqual(
      expect.objectContaining({ City: 'Lubango' }),
    );
  });
});
