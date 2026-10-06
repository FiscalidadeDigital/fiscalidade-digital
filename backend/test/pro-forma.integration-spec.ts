import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  FiscalRegime,
  InvoiceDocumentType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { ClientModule } from '../src/client/client.module';
import { InvoiceModule } from '../src/invoice/invoice.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProductModule } from '../src/product/product.module';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Pro Forma HTTP lifecycle', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let tenantAId: string;
  let tenantBId: string;
  let ownerAToken: string;
  let ownerBToken: string;
  let viewerAToken: string;
  let clientAId: string;
  let productAId: string;
  let proFormaId: string;

  const bearer = (token: string) => `Bearer ${token}`;
  const decimal = (value: string | number) => new Prisma.Decimal(value);

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AuthModule,
        ClientModule,
        InvoiceModule,
        ProductModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    await prisma.tenant.deleteMany({
      where: { name: { in: ['Pro Forma Tenant A', 'Pro Forma Tenant B'] } },
    });

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const [tenantA, tenantB] = await Promise.all([
      prisma.tenant.create({
        data: {
          name: 'Pro Forma Tenant A',
          nif: `PF-A-${runId}`,
          email: `pro-forma-a-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
          retentionRate: 6.5,
        },
      }),
      prisma.tenant.create({
        data: {
          name: 'Pro Forma Tenant B',
          nif: `PF-B-${runId}`,
          email: `pro-forma-b-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
        },
      }),
    ]);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const [ownerA, ownerB, viewerA, clientA, productA] = await Promise.all([
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          email: `pro-forma-owner-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Pro Forma Owner A',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantBId,
          email: `pro-forma-owner-b-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Pro Forma Owner B',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          email: `pro-forma-viewer-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Pro Forma Viewer A',
          role: UserRole.VIEWER,
        },
      }),
      prisma.client.create({
        data: {
          tenantId: tenantAId,
          name: 'Cliente de teste Pro Forma',
          nif: `CLIENT-${runId}`,
        },
      }),
      prisma.product.create({
        data: {
          tenantId: tenantAId,
          name: 'ServiÃ§o catalogado Pro Forma',
          price: 1250.5,
          priceAmount: '1250.50',
          ivaRate: 14,
          unit: 'SERVICO',
        },
      }),
    ]);

    ownerAToken = await jwtService.signAsync({ sub: ownerA.id });
    ownerBToken = await jwtService.signAsync({ sub: ownerB.id });
    viewerAToken = await jwtService.signAsync({ sub: viewerA.id });
    clientAId = clientA.id;
    productAId = productA.id;
  });

  afterAll(async () => {
    if (prisma && tenantAId && tenantBId) {
      await prisma.tenant.deleteMany({
        where: { id: { in: [tenantAId, tenantBId] } },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('creates a non-fiscal Pro Forma with PF numbering and no obligation sync', async () => {
    const obligationsBefore = await prisma.fiscalObligation.count({
      where: { tenantId: tenantAId },
    });

    await request(app.getHttpServer())
      .post('/invoice/pro-forma')
      .set('Authorization', bearer(viewerAToken))
      .send({ clientId: clientAId, items: [{ productName: 'Bloqueado', quantity: 1, unitPrice: 1 }] })
      .expect(403);

    const response = await request(app.getHttpServer())
      .post('/invoice/pro-forma')
      .set('Authorization', bearer(ownerAToken))
      .send({
        clientId: clientAId,
        notes: 'Proposta comercial sem efeito fiscal definitivo',
        items: [
          {
            productId: productAId,
            productName: 'Valor do cliente ignorado pelo catÃ¡logo',
            quantity: 2,
            unitPrice: 1,
          },
        ],
      })
      .expect(201);

    proFormaId = response.body.id;
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        invoiceNumber: expect.stringMatching(/^PF-\d{4}-\d{5}$/),
        documentType: InvoiceDocumentType.PRO_FORMA,
        taxCalculationStatus: 'PREVIEW_NON_FISCAL',
      }),
    );
    expect(decimal(response.body.subtotalAmount).equals('2501.00')).toBe(true);
    expect(decimal(response.body.ivaAmount).equals(0)).toBe(true);
    expect(decimal(response.body.withholdingTaxAmount).equals(0)).toBe(true);
    expect(decimal(response.body.totalAmount).equals('2501.00')).toBe(true);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        productId: productAId,
        productName: 'ServiÃ§o catalogado Pro Forma',
        unit: 'SERVICO',
      }),
    ]);

    await expect(
      prisma.fiscalObligation.count({ where: { tenantId: tenantAId } }),
    ).resolves.toBe(obligationsBefore);

    const fiscalInvoiceList = await request(app.getHttpServer())
      .get('/invoice')
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    expect(fiscalInvoiceList.body.map((invoice: { id: string }) => invoice.id)).not.toContain(proFormaId);

    const proFormaList = await request(app.getHttpServer())
      .get('/invoice?documentType=PRO_FORMA')
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    expect(proFormaList.body.map((invoice: { id: string }) => invoice.id)).toContain(proFormaId);
  });

  it('enforces tenant isolation for reading and converting Pro Formas', async () => {
    await request(app.getHttpServer())
      .get(`/invoice/${proFormaId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);

    await request(app.getHttpServer())
      .post(`/invoice/${proFormaId}/convert`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);

    await request(app.getHttpServer())
      .post(`/invoice/${proFormaId}/convert`)
      .set('Authorization', bearer(viewerAToken))
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/invoice/${proFormaId}/pay`)
      .set('Authorization', bearer(ownerAToken))
      .expect(400);
  });

  it('converts once into a fiscal invoice, recalculates tax and preserves provenance', async () => {
    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post(`/invoice/${proFormaId}/convert`)
        .set('Authorization', bearer(ownerAToken))
        .expect(201),
      request(app.getHttpServer())
        .post(`/invoice/${proFormaId}/convert`)
        .set('Authorization', bearer(ownerAToken))
        .expect(201),
    ]);

    expect(first.body.id).toBe(second.body.id);
    expect(first.body).toEqual(
      expect.objectContaining({
        documentType: InvoiceDocumentType.NORMAL,
        invoiceNumber: expect.stringMatching(/^FT-\d{4}-\d{5}$/),
        sourceProFormaId: proFormaId,
        clientId: clientAId,
      }),
    );
    expect(first.body.items).toEqual([
      expect.objectContaining({
        productId: productAId,
        productName: 'ServiÃ§o catalogado Pro Forma',
        unit: 'SERVICO',
      }),
    ]);
    expect(decimal(first.body.ivaAmount).greaterThan(0)).toBe(true);
    expect(decimal(first.body.withholdingTaxAmount).greaterThan(0)).toBe(true);
    expect(first.body.taxCalculationStatus).not.toBe('PREVIEW_NON_FISCAL');

    const persisted = await prisma.invoice.findMany({
      where: { tenantId: tenantAId, sourceProFormaId: proFormaId },
      include: { items: true },
    });
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toEqual(
      expect.objectContaining({
        documentType: InvoiceDocumentType.NORMAL,
        clientId: clientAId,
      }),
    );
    expect(new Prisma.Decimal(persisted[0].ivaAmount?.toString() ?? persisted[0].iva).greaterThan(0)).toBe(true);

    const replay = await request(app.getHttpServer())
      .post(`/invoice/${proFormaId}/convert`)
      .set('Authorization', bearer(ownerAToken))
      .expect(201);
    expect(replay.body.id).toBe(first.body.id);

    const normalInvoice = await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(ownerAToken))
      .send({
        clientId: clientAId,
        items: [{ productName: 'Factura normal', quantity: 1, unitPrice: 100 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/invoice/${normalInvoice.body.id}/convert`)
      .set('Authorization', bearer(ownerAToken))
      .expect(404);
  });
});
