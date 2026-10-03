import { generateKeyPairSync } from 'node:crypto';
import { Prisma } from '@prisma/client';

import { FiscalSignatureService } from '../fiscal-signature/fiscal-signature.service';
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
      invoiceNo: 'FT 2026/1',
      grossTotal: '114.00',
      previousHash: null,
    });
    const invoice = {
      id: 'invoice-1', tenantId: 'tenant-1', clientId: 'customer-1', invoiceNumber: 'FT 2026/1',
      fiscalDocumentType: 'FT', fiscalSeries: '2026', fiscalSequence: 1, fiscalYear: 2026,
      status: 'PENDING', cancellationReason: null, issuedAt, createdAt: issuedAt,
      fiscalHash: signature.hash, fiscalHashControl: signature.hashControl,
      subtotal: 100, subtotalAmount: new Prisma.Decimal('100.00'), iva: 14,
      ivaAmount: new Prisma.Decimal('14.00'), total: 114, totalAmount: new Prisma.Decimal('114.00'),
      client: { id: 'customer-1', nif: '5000000000', name: 'Cliente Teste', address: 'Rua de Teste', city: 'Luanda', country: 'AO', email: null },
      items: [{ productId: 'product-1', productName: 'Serviço técnico', unit: 'UN', quantity: 1,
        quantityAmount: new Prisma.Decimal('1'), unitPrice: 100, unitPriceAmount: new Prisma.Decimal('100.00'),
        total: 100, totalAmount: new Prisma.Decimal('100.00'), taxType: 'IVA', taxCode: 'NOR',
        taxRate: new Prisma.Decimal('14'), taxAmount: new Prisma.Decimal('14'), taxExemptionCode: null,
        taxExemptionReason: null, product: { code: 'SERV-001' } }],
    };
    const serializer = new SaftXmlSerializer();
    const validator = new SaftXsdValidator();
    const service = new SaftExportService({} as any, serializer, validator, new FiscalSignatureService());
    const model = service.compose({
      tenant: { id: 'tenant-1', nif: '5000000001', name: 'Empresa Teste', address: 'Avenida de Teste', city: 'Luanda', country: 'AO', email: 'teste@example.ao' },
      invoices: [invoice], start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-12-31T00:00:00Z'),
      software: { productCompanyTaxId: '5000000002', softwareValidationNumber: '999/AGT/2026', productId: 'Fiscalidade Digital / TEST_KEY_ONLY', productVersion: 'test' },
      sourceId: 'user-1',
    });
    const xml = serializer.serialize(model);
    expect(xml).toContain(signature.hash);
    expect(xml).not.toMatch(/undefined|null|NaN|Infinity/);
    const result = await validator.validate(xml);
    expect(result).toEqual({ valid: true, kind: 'TECHNICAL_XSD_VALIDATION', errors: [] });
  });
});
