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
import { PurchaseInvoiceModule } from '../src/purchase-invoice/purchase-invoice.module';
import { SupplierModule } from '../src/supplier/supplier.module';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Purchase Invoice HTTP tenant isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let tenantAId: string;
  let tenantBId: string;
  let ownerAId: string;
  let ownerAToken: string;
  let ownerBToken: string;
  let viewerAToken: string;
  let supplierAId: string;
  let supplierBId: string;
  let productAId: string;
  let productBId: string;
  let documentBId: string;
  let purchaseId: string;

  const bearer = (token: string) => `Bearer ${token}`;
  const decimal = (value: string | number) => new Prisma.Decimal(value);

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AuthModule,
        SupplierModule,
        ProductModule,
        PurchaseInvoiceModule,
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const [tenantA, tenantB] = await Promise.all([
      prisma.tenant.create({ data: { name: `Purchase tenant A ${suffix}`, nif: `PUR-A-${suffix}`, email: `purchase-a-${suffix}@example.test`, status: 'ACTIVE', regime: FiscalRegime.GERAL } }),
      prisma.tenant.create({ data: { name: `Purchase tenant B ${suffix}`, nif: `PUR-B-${suffix}`, email: `purchase-b-${suffix}@example.test`, status: 'ACTIVE', regime: FiscalRegime.GERAL } }),
    ]);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;
    const [ownerA, ownerB, viewerA, supplierA, supplierB, productA, productB, documentB] = await Promise.all([
      prisma.user.create({ data: { tenantId: tenantAId, email: `purchase-owner-a-${suffix}@example.test`, password: 'not-used', name: 'Owner A', role: UserRole.OWNER } }),
      prisma.user.create({ data: { tenantId: tenantBId, email: `purchase-owner-b-${suffix}@example.test`, password: 'not-used', name: 'Owner B', role: UserRole.OWNER } }),
      prisma.user.create({ data: { tenantId: tenantAId, email: `purchase-viewer-a-${suffix}@example.test`, password: 'not-used', name: 'Viewer A', role: UserRole.VIEWER } }),
      prisma.supplier.create({ data: { tenantId: tenantAId, name: 'Fornecedor A', nif: `SUP-A-${suffix}` } }),
      prisma.supplier.create({ data: { tenantId: tenantBId, name: 'Fornecedor B', nif: `SUP-B-${suffix}` } }),
      prisma.product.create({ data: { tenantId: tenantAId, name: 'Produto A', price: 1000.05, priceAmount: '1000.05', unit: 'SERVICO' } }),
      prisma.product.create({ data: { tenantId: tenantBId, name: 'Produto B', price: 10, priceAmount: '10.00', unit: 'UN' } }),
      prisma.document.create({ data: { tenantId: tenantBId, name: 'document-b', originalName: 'document-b.pdf', mimeType: 'application/pdf', size: 12, filePath: 'private/test/document-b.pdf' } }),
    ]);
    ownerAId = ownerA.id;
    ownerAToken = await jwtService.signAsync({ sub: ownerA.id });
    ownerBToken = await jwtService.signAsync({ sub: ownerB.id });
    viewerAToken = await jwtService.signAsync({ sub: viewerA.id });
    supplierAId = supplierA.id;
    supplierBId = supplierB.id;
    productAId = productA.id;
    productBId = productB.id;
    documentBId = documentB.id;
  });

  afterAll(async () => {
    if (prisma && tenantAId && tenantBId) {
      const tenantIds = [tenantAId, tenantBId];
      await prisma.purchaseInvoice.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.document.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.supplier.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.product.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.user.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    }
    if (app) await app.close();
  });

  it('rejects cross-tenant references and write access without a write role', async () => {
    const base = { invoiceNumber: 'SUP-001', issuedAt: '2026-10-01', iva: 140, withholdingTax: 0, items: [{ productName: 'Linha manual', quantity: 1, unitPrice: 1000 }] };
    await request(app.getHttpServer()).post('/purchase-invoice').set('Authorization', bearer(viewerAToken)).send({ ...base, supplierId: supplierAId }).expect(403);
    await request(app.getHttpServer()).post('/purchase-invoice').set('Authorization', bearer(ownerAToken)).send({ ...base, supplierId: supplierBId }).expect(404);
    await request(app.getHttpServer()).post('/purchase-invoice').set('Authorization', bearer(ownerAToken)).send({ ...base, supplierId: supplierAId, items: [{ productId: productBId, productName: 'Produto alheio', quantity: 1, unitPrice: 1 }] }).expect(404);
    await request(app.getHttpServer()).post('/purchase-invoice').set('Authorization', bearer(ownerAToken)).send({ ...base, supplierId: supplierAId, originalDocumentId: documentBId }).expect(404);
  });

  it('creates manual and catalog lines with authoritative Decimal totals and creator traceability', async () => {
    const created = await request(app.getHttpServer())
      .post('/purchase-invoice')
      .set('Authorization', bearer(ownerAToken))
      .send({
        supplierId: supplierAId,
        invoiceNumber: 'SUP-DECIMAL-001',
        issuedAt: '2026-10-01',
        dueDate: '2026-10-31',
        currency: 'AOA',
        reference: 'Recepção 54',
        iva: 420.02,
        withholdingTax: 0,
        items: [
          { productId: productAId, productName: 'Valor não confiado', quantity: 3, unitPrice: 1 },
          { productName: 'Linha manual', quantity: 2, unitPrice: 10.1, unit: 'UN' },
        ],
      })
      .expect(201);

    purchaseId = created.body.id;
    expect(decimal(created.body.subtotalAmount).equals('3020.35')).toBe(true);
    expect(decimal(created.body.ivaAmount).equals('420.02')).toBe(true);
    expect(decimal(created.body.totalAmount).equals('3440.37')).toBe(true);
    const catalogLine = created.body.items.find(
      (item: { productId: string | null }) => item.productId === productAId,
    );
    const manualLine = created.body.items.find(
      (item: { productId: string | null }) => item.productId === null,
    );
    expect(catalogLine).toEqual(
      expect.objectContaining({ productName: 'Produto A', unit: 'SERVICO' }),
    );
    expect(decimal(catalogLine.unitPriceAmount).equals('1000.05')).toBe(true);
    expect(manualLine).toEqual(
      expect.objectContaining({ productName: 'Linha manual', unit: 'UN' }),
    );
    expect(decimal(manualLine.totalAmount).equals('20.20')).toBe(true);
    await expect(prisma.purchaseInvoice.findUnique({ where: { id: purchaseId } })).resolves.toEqual(expect.objectContaining({ createdById: ownerAId, currency: 'AOA', reference: 'Recepção 54' }));
  });

  it('scopes listing and details by tenant and rejects duplicate supplier documents', async () => {
    await request(app.getHttpServer())
      .post('/purchase-invoice').set('Authorization', bearer(ownerAToken))
      .send({ supplierId: supplierAId, invoiceNumber: 'SUP-UNTRUSTED-TOTAL', issuedAt: '2026-10-01', iva: 0, withholdingTax: 0, total: 1, items: [{ productName: 'Linha', quantity: 1, unitPrice: 1 }] })
      .expect(400);
    await request(app.getHttpServer()).get('/purchase-invoice').set('Authorization', bearer(ownerBToken)).expect(200).expect(({ body }) => expect(body).toEqual([]));
    await request(app.getHttpServer()).get(`/purchase-invoice/${purchaseId}`).set('Authorization', bearer(ownerBToken)).expect(404);
    await request(app.getHttpServer()).patch(`/purchase-invoice/${purchaseId}`).set('Authorization', bearer(ownerBToken)).send({ notes: 'Alteração alheia' }).expect(404);
    await request(app.getHttpServer())
      .post('/purchase-invoice').set('Authorization', bearer(ownerAToken))
      .send({ supplierId: supplierAId, invoiceNumber: 'SUP-DECIMAL-001', issuedAt: '2026-10-01', iva: 0, withholdingTax: 0, items: [{ productName: 'Duplicada', quantity: 1, unitPrice: 1 }] })
      .expect(400);
  });
});
