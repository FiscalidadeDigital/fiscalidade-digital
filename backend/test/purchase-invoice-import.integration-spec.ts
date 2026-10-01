import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FiscalRegime, Prisma, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProductModule } from '../src/product/product.module';
import { PurchaseInvoiceImportModule } from '../src/purchase-invoice-import/purchase-invoice-import.module';
import { PurchaseInvoiceModule } from '../src/purchase-invoice/purchase-invoice.module';
import { SupplierModule } from '../src/supplier/supplier.module';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Purchase invoice import HTTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let tenantAId: string;
  let tenantBId: string;
  let ownerAToken: string;
  let ownerBToken: string;
  let viewerAToken: string;
  let supplierAId: string;
  let documentAId: string;
  let documentBId: string;
  let importId: string;

  const bearer = (token: string) => `Bearer ${token}`;
  const decimal = (value: string | number) => new Prisma.Decimal(value);
  const confirmationPayload = () => ({
    supplierId: supplierAId,
    invoiceNumber: 'SCAN-INV-001',
    issuedAt: '2026-10-01',
    iva: 140.01,
    withholdingTax: 0,
    items: [{ productName: 'Serviço confirmado manualmente', quantity: 2, unitPrice: 500.05, unit: 'SERVICO' }],
  });

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    const fixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AuthModule,
        SupplierModule,
        ProductModule,
        PurchaseInvoiceModule,
        PurchaseInvoiceImportModule,
      ],
    }).compile();
    app = fixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const [tenantA, tenantB] = await Promise.all([
      prisma.tenant.create({ data: { name: `Scanner tenant A ${suffix}`, nif: `SCN-A-${suffix}`, email: `scanner-a-${suffix}@example.test`, status: 'ACTIVE', regime: FiscalRegime.GERAL } }),
      prisma.tenant.create({ data: { name: `Scanner tenant B ${suffix}`, nif: `SCN-B-${suffix}`, email: `scanner-b-${suffix}@example.test`, status: 'ACTIVE', regime: FiscalRegime.GERAL } }),
    ]);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;
    const [ownerA, ownerB, viewerA, supplierA, documentA, documentB] = await Promise.all([
      prisma.user.create({ data: { tenantId: tenantAId, email: `scanner-owner-a-${suffix}@example.test`, password: 'not-used', name: 'Owner A', role: UserRole.OWNER } }),
      prisma.user.create({ data: { tenantId: tenantBId, email: `scanner-owner-b-${suffix}@example.test`, password: 'not-used', name: 'Owner B', role: UserRole.OWNER } }),
      prisma.user.create({ data: { tenantId: tenantAId, email: `scanner-viewer-a-${suffix}@example.test`, password: 'not-used', name: 'Viewer A', role: UserRole.VIEWER } }),
      prisma.supplier.create({ data: { tenantId: tenantAId, name: 'Fornecedor Scanner A', nif: `SUP-SCN-${suffix}` } }),
      prisma.document.create({ data: { tenantId: tenantAId, name: 'factura-fornecedor-a', originalName: 'fornecedor-a.pdf', mimeType: 'application/pdf', size: 45, filePath: `private/scanner/${suffix}-a.pdf` } }),
      prisma.document.create({ data: { tenantId: tenantBId, name: 'factura-fornecedor-b', originalName: 'fornecedor-b.pdf', mimeType: 'application/pdf', size: 45, filePath: `private/scanner/${suffix}-b.pdf` } }),
    ]);
    ownerAToken = await jwt.signAsync({ sub: ownerA.id });
    ownerBToken = await jwt.signAsync({ sub: ownerB.id });
    viewerAToken = await jwt.signAsync({ sub: viewerA.id });
    supplierAId = supplierA.id;
    documentAId = documentA.id;
    documentBId = documentB.id;
  });

  afterAll(async () => {
    if (prisma && tenantAId && tenantBId) {
      const tenantIds = [tenantAId, tenantBId];
      await prisma.purchaseInvoiceImport.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.purchaseInvoice.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.document.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.supplier.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.user.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    }
    if (app) await app.close();
  });

  it('creates a manual review import and rejects foreign documents and write access without role', async () => {
    await request(app.getHttpServer()).post('/purchase-invoice-imports').set('Authorization', bearer(viewerAToken)).send({ documentId: documentAId }).expect(403);
    await request(app.getHttpServer()).post('/purchase-invoice-imports').set('Authorization', bearer(ownerAToken)).send({ documentId: documentBId }).expect(404);

    const created = await request(app.getHttpServer())
      .post('/purchase-invoice-imports').set('Authorization', bearer(ownerAToken))
      .send({ documentId: documentAId }).expect(201);
    importId = created.body.id;
    expect(created.body).toEqual(expect.objectContaining({
      status: 'REVIEW_REQUIRED',
      extractionProvider: 'MANUAL',
      candidateData: null,
      document: expect.objectContaining({ id: documentAId, originalName: 'fornecedor-a.pdf' }),
    }));
  });

  it('keeps imports and the private source document tenant-scoped', async () => {
    await request(app.getHttpServer()).get(`/purchase-invoice-imports/${importId}`).set('Authorization', bearer(ownerBToken)).expect(404);
    await request(app.getHttpServer()).post(`/purchase-invoice-imports/${importId}/confirm`).set('Authorization', bearer(ownerBToken)).send(confirmationPayload()).expect(404);
    await request(app.getHttpServer()).post(`/purchase-invoice-imports/${importId}/confirm`).set('Authorization', bearer(viewerAToken)).send(confirmationPayload()).expect(403);
    await request(app.getHttpServer()).get(`/documents/${documentAId}`).set('Authorization', bearer(ownerBToken)).expect(404);
  });

  it('confirms manually reviewed data once through PurchaseInvoiceService and preserves the link', async () => {
    const payload = { ...confirmationPayload(), total: 1 };
    const first = await request(app.getHttpServer())
      .post(`/purchase-invoice-imports/${importId}/confirm`)
      .set('Authorization', bearer(ownerAToken)).send(payload).expect(400);
    expect(first.body.message).toEqual(expect.arrayContaining(['property total should not exist']));

    const confirmed = await request(app.getHttpServer())
      .post(`/purchase-invoice-imports/${importId}/confirm`)
      .set('Authorization', bearer(ownerAToken))
      .send(confirmationPayload())
      .expect(201);
    expect(decimal(confirmed.body.totalAmount).equals('1140.11')).toBe(true);
    expect(confirmed.body.originalDocumentId).toBe(documentAId);

    const replay = await request(app.getHttpServer())
      .post(`/purchase-invoice-imports/${importId}/confirm`)
      .set('Authorization', bearer(ownerAToken)).send(confirmationPayload()).expect(201);
    expect(replay.body.id).toBe(confirmed.body.id);

    const imported = await request(app.getHttpServer())
      .get(`/purchase-invoice-imports/${importId}`).set('Authorization', bearer(ownerAToken)).expect(200);
    expect(imported.body).toEqual(expect.objectContaining({
      status: 'CONFIRMED',
      confirmedPurchaseInvoiceId: confirmed.body.id,
      confirmedPurchaseInvoice: expect.objectContaining({ id: confirmed.body.id, invoiceNumber: 'SCAN-INV-001' }),
    }));
    await expect(prisma.purchaseInvoice.count({ where: { tenantId: tenantAId, originalDocumentId: documentAId } })).resolves.toBe(1);
  });
});
