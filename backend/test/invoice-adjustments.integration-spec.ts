import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FiscalRegime, Prisma, TaxType, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { AccountingSaftModule } from '../src/accounting-saft/accounting-saft.module';
import { ClientModule } from '../src/client/client.module';
import { InvoiceModule } from '../src/invoice/invoice.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProductModule } from '../src/product/product.module';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Invoice adjustment HTTP lifecycle', () => {
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
  let clientBId: string;
  let productBId: string;

  const bearer = (token: string) => `Bearer ${token}`;
  const decimal = (value: string | number) => new Prisma.Decimal(value);

  const removeTenantFiscalRecords = async (tenantIds: string[]) => {
    if (!tenantIds.length) return;

    const tenantId = { in: tenantIds };
    await prisma.taxTransaction.deleteMany({ where: { tenantId } });
    await prisma.taxAssessment.deleteMany({ where: { tenantId } });
    await prisma.fiscalObligation.deleteMany({ where: { tenantId } });
  };

  const createSourceInvoice = async (label: string) => {
    const response = await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(ownerAToken))
      .send({
        clientId: clientAId,
        items: [
          {
            productId: productAId,
            productName: label,
            quantity: 1,
            unitPrice: 1,
            electronicOperationType: 'SE',
          },
        ],
      })
      .expect(201);

    return response.body as {
      id: string;
      invoiceNumber: string;
      items: Array<{ id: string }>;
    };
  };

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AuthModule,
        AccountingSaftModule,
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

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const [tenantA, tenantB] = await Promise.all([
      prisma.tenant.create({
        data: {
          name: `Adjustment Tenant A ${runId}`,
          nif: `ADJ-A-${runId}`,
          email: `adjustment-a-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
          address: 'Rua de teste A',
          city: 'Luanda',
          country: 'AO',
          retentionRate: 0,
        },
      }),
      prisma.tenant.create({
        data: {
          name: `Adjustment Tenant B ${runId}`,
          nif: `ADJ-B-${runId}`,
          email: `adjustment-b-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.SIMPLIFICADO,
          address: 'Rua de teste B',
          city: 'Benguela',
          country: 'AO',
        },
      }),
    ]);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    await prisma.taxRegimeAssignment.createMany({
      data: [
        {
          tenantId: tenantAId,
          taxType: TaxType.IVA,
          regime: FiscalRegime.GERAL,
          validFrom: new Date('2020-01-01T00:00:00.000Z'),
        },
        {
          tenantId: tenantBId,
          taxType: TaxType.IVA,
          regime: FiscalRegime.SIMPLIFICADO,
          validFrom: new Date('2020-01-01T00:00:00.000Z'),
        },
      ],
    });

    const [ownerA, ownerB, viewerA, clientA, productA, clientB, productB] = await Promise.all([
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          email: `adjustment-owner-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Adjustment Owner A',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantBId,
          email: `adjustment-owner-b-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Adjustment Owner B',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          email: `adjustment-viewer-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Adjustment Viewer A',
          role: UserRole.VIEWER,
        },
      }),
      prisma.client.create({
        data: {
          tenantId: tenantAId,
          name: 'Cliente de teste de ajustes',
          nif: `ADJ-CLIENT-${runId}`,
          address: 'Rua do cliente A',
          city: 'Luanda',
          country: 'AO',
        },
      }),
      prisma.product.create({
        data: {
          tenantId: tenantAId,
          name: 'Serviço catalogado para ajustes',
          price: 100,
          priceAmount: '100.00',
          ivaRate: 14,
          unit: 'SERVICO',
          electronicOperationType: 'SE',
        },
      }),
      prisma.client.create({
        data: {
          tenantId: tenantBId,
          name: 'Cliente do regime simplificado',
          nif: `ADJ-SIMPLIFIED-CLIENT-${runId}`,
          address: 'Rua do cliente B',
          city: 'Benguela',
          country: 'AO',
        },
      }),
      prisma.product.create({
        data: {
          tenantId: tenantBId,
          name: 'Serviço do regime simplificado',
          price: 100,
          priceAmount: '100.00',
          ivaRate: 0,
          unit: 'SERVICO',
          electronicOperationType: 'SE',
        },
      }),
    ]);

    ownerAToken = await jwtService.signAsync({ sub: ownerA.id });
    ownerBToken = await jwtService.signAsync({ sub: ownerB.id });
    viewerAToken = await jwtService.signAsync({ sub: viewerA.id });
    clientAId = clientA.id;
    productAId = productA.id;
    clientBId = clientB.id;
    productBId = productB.id;
  });

  afterAll(async () => {
    if (prisma && tenantAId && tenantBId) {
      await removeTenantFiscalRecords([tenantAId, tenantBId]);
      await prisma.tenant.deleteMany({
        where: { id: { in: [tenantAId, tenantBId] } },
      });
    }
    if (app) await app.close();
  });

  it('issues isolated credit/debit notes with preserved values and safe payment rules', async () => {
    const source = await createSourceInvoice('Factura de origem para ajuste');
    const sourceItemId = source.items[0]?.id;
    expect(sourceItemId).toEqual(expect.any(String));

    const adjustmentInput = {
      sourceInvoiceId: source.id,
      reason: 'Regularização comercial',
      items: [{ sourceInvoiceItemId: sourceItemId, quantity: 0.5 }],
    };

    await request(app.getHttpServer())
      .post('/invoice/credit-note')
      .set('Authorization', bearer(viewerAToken))
      .send(adjustmentInput)
      .expect(403);

    await request(app.getHttpServer())
      .post('/invoice/credit-note')
      .set('Authorization', bearer(ownerBToken))
      .send(adjustmentInput)
      .expect(404);

    const credit = await request(app.getHttpServer())
      .post('/invoice/credit-note')
      .set('Authorization', bearer(ownerAToken))
      .send(adjustmentInput)
      .expect(201);

    expect(credit.body).toEqual(
      expect.objectContaining({
        fiscalDocumentType: 'NC',
        rectifiesInvoiceId: source.id,
        invoiceNumber: expect.stringMatching(/^NC NC\d{4}\/\d{5}$/),
      }),
    );
    expect(decimal(credit.body.subtotalAmount).equals('50.00')).toBe(true);
    expect(decimal(credit.body.ivaAmount).equals('7.00')).toBe(true);
    expect(decimal(credit.body.totalAmount).equals('57.00')).toBe(true);
    expect(credit.body.items).toEqual([
      expect.objectContaining({
        productId: productAId,
        quantity: 0.5,
      }),
    ]);
    expect(decimal(credit.body.items[0]?.taxRate).equals('14')).toBe(true);

    await request(app.getHttpServer())
      .patch(`/invoice/${credit.body.id}/pay`)
      .set('Authorization', bearer(ownerAToken))
      .expect(400);

    await request(app.getHttpServer())
      .post('/invoice/credit-note')
      .set('Authorization', bearer(ownerAToken))
      .send(adjustmentInput)
      .expect(409);

    await request(app.getHttpServer())
      .post('/invoice/debit-note')
      .set('Authorization', bearer(ownerAToken))
      .send({
        ...adjustmentInput,
        reason: 'Complemento comercial',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            fiscalDocumentType: 'ND',
            rectifiesInvoiceId: source.id,
            invoiceNumber: expect.stringMatching(/^ND ND\d{4}\/\d{5}$/),
          }),
        );
      });

    const creditList = await request(app.getHttpServer())
      .get('/invoice?fiscalDocumentType=NC')
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    expect(creditList.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: credit.body.id, fiscalDocumentType: 'NC' }),
      ]),
    );

    await request(app.getHttpServer())
      .post('/invoice/debit-note')
      .set('Authorization', bearer(ownerAToken))
      .send({
        ...adjustmentInput,
        reason: 'Quantidade acima da origem',
        items: [{ sourceInvoiceItemId: sourceItemId, quantity: 1.1 }],
      })
      .expect(400);
  });

  it('emits simplified-regime invoices and notes with exportable fiscal metadata', async () => {
    const source = await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(ownerBToken))
      .send({
        clientId: clientBId,
        items: [
          {
            productId: productBId,
            productName: 'Serviço simplificado',
            quantity: 1,
            unitPrice: 100,
            electronicOperationType: 'SE',
          },
        ],
      })
      .expect(201);

    expect(source.body).toEqual(
      expect.objectContaining({
        fiscalDocumentType: 'FT',
        invoiceNumber: expect.stringMatching(/^FT FT\d{4}\/\d{5}$/),
        notes: expect.stringContaining('IVA - Regime Simplificado'),
      }),
    );
    expect(source.body.items[0]).toEqual(
      expect.objectContaining({
        taxType: 'IVA',
        taxCode: 'OUT',
        taxExemptionCode: 'M00',
        taxExemptionReason: 'IVA - Regime Simplificado',
      }),
    );
    expect(decimal(source.body.items[0].taxRate).isZero()).toBe(true);

    const credit = await request(app.getHttpServer())
      .post('/invoice/credit-note')
      .set('Authorization', bearer(ownerBToken))
      .send({
        sourceInvoiceId: source.body.id,
        reason: 'Ajuste simplificado',
        items: [
          {
            sourceInvoiceItemId: source.body.items[0].id,
            quantity: 0.5,
          },
        ],
      })
      .expect(201);

    expect(credit.body).toEqual(
      expect.objectContaining({
        fiscalDocumentType: 'NC',
        invoiceNumber: expect.stringMatching(/^NC NC\d{4}\/\d{5}$/),
      }),
    );
    expect(credit.body.items[0]).toEqual(
      expect.objectContaining({
        taxCode: 'OUT',
        taxExemptionCode: 'M00',
        taxExemptionReason: 'IVA - Regime Simplificado',
      }),
    );

    const fiscalYear = new Date().getFullYear();
    const preflight = await request(app.getHttpServer())
      .get(`/accounting/saft/preflight?fiscalYear=${fiscalYear}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(200);
    const preflightMessages = preflight.body.issues
      .map((issue: { message: string }) => issue.message)
      .join('\n');
    expect(preflightMessages).not.toContain('numeração');
    expect(preflightMessages).not.toContain('classificação fiscal');
    expect(preflightMessages).not.toContain('taxa zero');
  });

  it('serialises numbering for simultaneous notes from different source invoices', async () => {
    const [firstSource, secondSource] = await Promise.all([
      createSourceInvoice('Origem concorrente A'),
      createSourceInvoice('Origem concorrente B'),
    ]);

    const [firstNote, secondNote] = await Promise.all([
      request(app.getHttpServer())
        .post('/invoice/debit-note')
        .set('Authorization', bearer(ownerAToken))
        .send({
          sourceInvoiceId: firstSource.id,
          reason: 'Complemento A',
          items: [{ sourceInvoiceItemId: firstSource.items[0]?.id, quantity: 0.25 }],
        })
        .expect(201),
      request(app.getHttpServer())
        .post('/invoice/debit-note')
        .set('Authorization', bearer(ownerAToken))
        .send({
          sourceInvoiceId: secondSource.id,
          reason: 'Complemento B',
          items: [{ sourceInvoiceItemId: secondSource.items[0]?.id, quantity: 0.25 }],
        })
        .expect(201),
    ]);

    expect(new Set([firstNote.body.invoiceNumber, secondNote.body.invoiceNumber]).size).toBe(2);
    expect(new Set([firstNote.body.fiscalSequence, secondNote.body.fiscalSequence]).size).toBe(2);
  });
});
