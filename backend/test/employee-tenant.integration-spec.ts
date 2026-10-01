import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { FiscalRegime, UserRole } from '@prisma/client';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { ClientModule } from '../src/client/client.module';
import { EmployeeModule } from '../src/employee/employee.module';
import { InvoiceModule } from '../src/invoice/invoice.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { ProductModule } from '../src/product/product.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SupplierModule } from '../src/supplier/supplier.module';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Core records HTTP tenant isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let tenantAId: string;
  let tenantBId: string;
  let ownerAToken: string;
  let ownerBToken: string;
  let viewerAToken: string;
  let employeeId: string;
  let clientId: string;
  let supplierId: string;

  const bearer = (token: string) => `Bearer ${token}`;

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        PrismaModule,
        SupplierModule,
        AuthModule,
        ClientModule,
        EmployeeModule,
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
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    await prisma.tenant.deleteMany({
      where: {
        name: { in: ['Tenant A E2E', 'Tenant B E2E'] },
      },
    });

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const tenantA = await prisma.tenant.create({
      data: {
        name: 'Tenant A E2E',
        nif: `A-${runId}`,
        email: `tenant-a-${runId}@example.test`,
        status: 'ACTIVE',
        regime: FiscalRegime.GERAL,
      },
    });
    const tenantB = await prisma.tenant.create({
      data: {
        name: 'Tenant B E2E',
        nif: `B-${runId}`,
        email: `tenant-b-${runId}@example.test`,
        status: 'ACTIVE',
        regime: FiscalRegime.GERAL,
      },
    });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const [ownerA, ownerB, viewerA] = await Promise.all([
      prisma.user.create({
        data: {
          tenantId: tenantA.id,
          email: `owner-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Owner A',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantB.id,
          email: `owner-b-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Owner B',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantA.id,
          email: `viewer-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Viewer A',
          role: UserRole.VIEWER,
        },
      }),
    ]);

    ownerAToken = await jwtService.signAsync({ sub: ownerA.id });
    ownerBToken = await jwtService.signAsync({ sub: ownerB.id });
    viewerAToken = await jwtService.signAsync({ sub: viewerA.id });
  });

  afterAll(async () => {
    if (prisma && tenantAId && tenantBId) {
      await prisma.purchaseInvoice.deleteMany({
        where: {
          tenantId: { in: [tenantAId, tenantBId] },
        },
      });
      await prisma.supplier.deleteMany({
        where: {
          tenantId: { in: [tenantAId, tenantBId] },
        },
      });
      await prisma.tenant.deleteMany({
        where: {
          id: { in: [tenantAId, tenantBId] },
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('creates an employee and preserves omitted fields in a real PATCH', async () => {
    const created = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', bearer(ownerAToken))
      .send({
        name: 'Ana Manuel',
        nif: 'EMP-A-001',
        socialSecurityCategory: 'STANDARD',
        email: 'ana@example.test',
        phone: '+244900000001',
        jobTitle: 'Auditora',
        status: 'ACTIVE',
        initialSalary: {
          baseSalary: 250000,
          foodAllowance: 30000,
          effectiveFrom: '2026-08-01',
        },
      })
      .expect(201);

    employeeId = created.body.id;
    expect(employeeId).toEqual(expect.any(String));
    expect(created.body.salaries).toEqual([
      expect.objectContaining({ active: true }),
    ]);
    expect(Number(created.body.salaries[0].baseSalary)).toBe(250000);
    expect(Number(created.body.salaries[0].foodAllowance)).toBe(30000);

    await request(app.getHttpServer())
      .patch(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({
        jobTitle: 'Auditora Sénior',
        socialSecurityCategory: 'RETIRED',
      })
      .expect(200);

    const fetched = await request(app.getHttpServer())
      .get(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(200);

    expect(fetched.body).toEqual(
      expect.objectContaining({
        id: employeeId,
        name: 'Ana Manuel',
        nif: 'EMP-A-001',
        email: 'ana@example.test',
        phone: '+244900000001',
        jobTitle: 'Auditora Sénior',
        socialSecurityCategory: 'RETIRED',
      }),
    );

    await request(app.getHttpServer())
      .patch(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({ email: null })
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBeNull();
        expect(body.name).toBe('Ana Manuel');
      });
  });

  it('rejects invalid input and blocks VIEWER access to employee PII', async () => {
    await request(app.getHttpServer())
      .patch(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({ name: '   ' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({ socialSecurityCategory: 'UNKNOWN' })
      .expect(400);

    await request(app.getHttpServer())
      .get('/employees')
      .set('Authorization', bearer(viewerAToken))
      .expect(403);

    await request(app.getHttpServer()).get('/employees').expect(401);
  });

  it('prevents Tenant B from reading, changing, deleting or associating data', async () => {
    const tenantBList = await request(app.getHttpServer())
      .get('/employees')
      .set('Authorization', bearer(ownerBToken))
      .expect(200);
    expect(tenantBList.body).toEqual([]);

    await request(app.getHttpServer())
      .get(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerBToken))
      .send({ jobTitle: 'Alteração indevida' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salaries`)
      .set('Authorization', bearer(ownerBToken))
      .send({ baseSalary: 500000, effectiveFrom: '2026-09-01' })
      .expect(404);
    await request(app.getHttpServer())
      .get(`/employees/${employeeId}/salaries`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/dependents`)
      .set('Authorization', bearer(ownerBToken))
      .send({ name: 'Dependente indevido' })
      .expect(404);
    await request(app.getHttpServer())
      .get(`/employees/${employeeId}/dependents`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    expect(employee).toEqual(
      expect.objectContaining({
        tenantId: tenantAId,
        jobTitle: 'Auditora Sénior',
      }),
    );
  });

  it('validates client input, roles and partial updates through HTTP', async () => {
    await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', bearer(ownerAToken))
      .send({
        name: 'Cliente forjado',
        tenantId: tenantBId,
      })
      .expect(400);

    const created = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', bearer(ownerAToken))
      .send({
        name: 'Cliente A',
        nif: 'CLIENT-A-001',
        email: 'client-a@example.test',
        phone: '+244900000002',
        notes: 'Registo de teste',
      })
      .expect(201);
    clientId = created.body.id;

    await request(app.getHttpServer())
      .patch(`/clients/${clientId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({ notes: 'Nota actualizada' })
      .expect(200);

    const fetched = await request(app.getHttpServer())
      .get(`/clients/${clientId}`)
      .set('Authorization', bearer(viewerAToken))
      .expect(200);
    expect(fetched.body).toEqual(
      expect.objectContaining({
        id: clientId,
        name: 'Cliente A',
        nif: 'CLIENT-A-001',
        email: 'client-a@example.test',
        phone: '+244900000002',
        notes: 'Nota actualizada',
      }),
    );

    const clientPage = await request(app.getHttpServer())
      .get('/clients?page=1&pageSize=20&sortBy=name&sortDirection=asc')
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    expect(clientPage.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: clientId })]),
    );
    expect(clientPage.body.summary).toEqual(
      expect.objectContaining({ total: 1, withEmail: 1, withPhone: 1 }),
    );

    await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', bearer(viewerAToken))
      .send({ name: 'Criação não autorizada' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/clients/${clientId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({ name: '   ' })
      .expect(400);
    await request(app.getHttpServer())
      .get(`/clients?search=${'a'.repeat(121)}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(400);
  });

  it('isolates clients by tenant and preserves invoiced clients', async () => {
    const tenantBList = await request(app.getHttpServer())
      .get('/clients?search=Cliente')
      .set('Authorization', bearer(ownerBToken))
      .expect(200);
    expect(tenantBList.body).toEqual([]);

    await request(app.getHttpServer())
      .get(`/clients/${clientId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/clients/${clientId}`)
      .set('Authorization', bearer(ownerBToken))
      .send({ name: 'Cliente B indevido' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/clients/${clientId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);

    await prisma.invoice.create({
      data: {
        tenantId: tenantAId,
        clientId,
        invoiceNumber: `E2E-${Date.now()}`,
        subtotal: 1000,
        iva: 0,
        withholdingTax: 0,
        total: 1000,
      },
    });

    await request(app.getHttpServer())
      .delete(`/clients/${clientId}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(409);

    await expect(
      prisma.client.findUnique({ where: { id: clientId } }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: clientId,
        tenantId: tenantAId,
      }),
    );
  });

  it('validates invoice input and serializes concurrent numbering', async () => {
    const catalogProduct = await prisma.product.create({
      data: {
        tenantId: tenantAId,
        name: 'Consultoria fiscal catalogada',
        price: 1000.05,
        priceAmount: '1000.05',
        ivaRate: 14,
        unit: 'HORA',
      },
    });
    const otherTenantProduct = await prisma.product.create({
      data: {
        tenantId: tenantBId,
        name: 'Produto privado do Tenant B',
        price: 10,
        priceAmount: '10.00',
        ivaRate: 14,
        unit: 'UN',
      },
    });
    const validInvoice = {
      clientId,
      notes: 'Serviços profissionais',
      items: [
        {
          productId: catalogProduct.id,
          productName: 'Nome e preço enviados pelo cliente não são confiados',
          quantity: 3,
          unitPrice: 1,
        },
      ],
    };

    await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(ownerAToken))
      .send({ ...validInvoice, tenantId: tenantBId })
      .expect(400);
    await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(ownerAToken))
      .send({
        ...validInvoice,
        items: [
          {
            productId: otherTenantProduct.id,
            productName: 'Tentativa de usar produto alheio',
            quantity: 1,
            unitPrice: 1,
          },
        ],
      })
      .expect(404);
    await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(ownerAToken))
      .send({
        ...validInvoice,
        items: [{ productName: '   ', quantity: 1, unitPrice: 1000 }],
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(ownerAToken))
      .send({
        ...validInvoice,
        items: [{ productName: 'Teste', quantity: 1, unitPrice: 10.999 }],
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(viewerAToken))
      .send(validInvoice)
      .expect(403);

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', bearer(ownerAToken))
        .send(validInvoice)
        .expect(201),
      request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', bearer(ownerAToken))
        .send({
          ...validInvoice,
          items: [
            {
              productName: 'Revisão contabilística',
              quantity: 2,
              unitPrice: 750,
            },
          ],
        })
        .expect(201),
    ]);

    const firstInvoice = first.body as {
      id: string;
      invoiceNumber: string;
      subtotal: number;
      subtotalAmount: string;
      iva: number;
      ivaAmount: string;
      total: number;
      totalAmount: string;
      taxRuleVersion: string;
      taxCalculationStatus: string;
      items: Array<{
        productId: string | null;
        productName: string;
        unit: string;
        quantity: number;
        quantityAmount: string;
        unitPrice: number;
        unitPriceAmount: string;
        total: number;
        totalAmount: string;
      }>;
    };
    const secondInvoice = second.body as {
      id: string;
      invoiceNumber: string;
    };
    const numbers = [firstInvoice.invoiceNumber, secondInvoice.invoiceNumber];
    expect(new Set(numbers).size).toBe(2);
    const sequences = numbers
      .map((value) => Number(String(value).split('-').at(-1)))
      .sort((a, b) => a - b);
    expect(sequences[1] - sequences[0]).toBe(1);
    expect(firstInvoice).toEqual(
      expect.objectContaining({
        subtotal: 3000.15,
        subtotalAmount: '3000.15',
        iva: 420.02,
        ivaAmount: '420.02',
        total: 3420.17,
        totalAmount: '3420.17',
        taxRuleVersion: 'AO-CIVA-LEI-14-23-ART19-A',
        taxCalculationStatus:
          'STANDARD_RATE_ASSUMED_PENDING_ITEM_CLASSIFICATION',
      }),
    );
    expect(firstInvoice.items).toEqual([
      expect.objectContaining({
        productId: catalogProduct.id,
        productName: catalogProduct.name,
        unit: 'HORA',
        quantity: 3,
        quantityAmount: '3',
        unitPrice: 1000.05,
        unitPriceAmount: '1000.05',
        total: 3000.15,
        totalAmount: '3000.15',
      }),
    ]);

    const viewerList = await request(app.getHttpServer())
      .get('/invoice')
      .set('Authorization', bearer(viewerAToken))
      .expect(200);
    const viewerInvoices = viewerList.body as Array<{ id: string }>;
    expect(viewerInvoices.map((invoice) => invoice.id)).toEqual(
      expect.arrayContaining([firstInvoice.id, secondInvoice.id]),
    );

    const invoicePage = await request(app.getHttpServer())
      .get('/invoice?page=1&pageSize=20&sortBy=issuedAt&sortDirection=desc')
      .set('Authorization', bearer(viewerAToken))
      .expect(200);
    expect(invoicePage.body.data.map((invoice: { id: string }) => invoice.id)).toEqual(
      expect.arrayContaining([firstInvoice.id, secondInvoice.id]),
    );
    const tenantInvoiceCount = await prisma.invoice.count({
      where: { tenantId: tenantAId },
    });
    expect(invoicePage.body.summary).toEqual(
      expect.objectContaining({
        total: tenantInvoiceCount,
        pending: tenantInvoiceCount,
      }),
    );
  });

  it('isolates invoice reads and state changes by tenant and role', async () => {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenantAId,
        invoiceNumber: { startsWith: `FT-${new Date().getFullYear()}-` },
      },
      orderBy: { invoiceNumber: 'asc' },
    });
    expect(invoices).toHaveLength(2);
    const [first, second] = invoices;

    await request(app.getHttpServer())
      .get('/invoice?page=1&pageSize=20')
      .set('Authorization', bearer(ownerBToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual([]);
        expect(body.pagination.total).toBe(0);
      });

    await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', bearer(ownerBToken))
      .send({
        clientId,
        items: [{ productName: 'Tentativa cruzada', quantity: 1, unitPrice: 1 }],
      })
      .expect(404);
    await request(app.getHttpServer())
      .get(`/invoice/${first.id}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .get(`/invoice/${first.id}/pdf`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .get(`/invoice/${first.id}/pdf`)
      .set('Authorization', bearer(viewerAToken))
      .expect('Content-Type', /application\/pdf/)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/invoice/${first.id}/pay`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/invoice/${first.id}/cancel`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/invoice/${first.id}/pay`)
      .set('Authorization', bearer(viewerAToken))
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/invoice/${first.id}/cancel`)
      .set('Authorization', bearer(viewerAToken))
      .expect(403);

    await expect(
      prisma.invoice.findUnique({ where: { id: first.id } }),
    ).resolves.toEqual(expect.objectContaining({ status: 'PENDING' }));

    await request(app.getHttpServer())
      .patch(`/invoice/${first.id}/pay`)
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/invoice/${first.id}/cancel`)
      .set('Authorization', bearer(ownerAToken))
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/invoice/${second.id}/cancel`)
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/invoice/${second.id}/pay`)
      .set('Authorization', bearer(ownerAToken))
      .expect(400);
  });

  it('allows only one concurrent terminal invoice transition', async () => {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenantAId,
        clientId,
        invoiceNumber: `STATE-${Date.now()}`,
        subtotal: 100,
        iva: 0,
        withholdingTax: 0,
        total: 100,
      },
    });

    const [payResponse, cancelResponse] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/invoice/${invoice.id}/pay`)
        .set('Authorization', bearer(ownerAToken))
        .ok(() => true),
      request(app.getHttpServer())
        .patch(`/invoice/${invoice.id}/cancel`)
        .set('Authorization', bearer(ownerAToken))
        .ok(() => true),
    ]);

    expect([payResponse.status, cancelResponse.status].sort()).toEqual([
      200, 400,
    ]);
    const persisted = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(['PAID', 'CANCELLED']).toContain(persisted?.status);
  });

  it('validates product roles, tenant isolation and document references', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', bearer(ownerAToken))
      .send({ name: 'Produto forjado', price: 100, tenantId: tenantBId })
      .expect(400);
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', bearer(ownerAToken))
      .send({ name: '   ', price: 100 })
      .expect(400);

    const created = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', bearer(ownerAToken))
      .send({
        name: 'Serviço contabilístico',
        description: 'Descrição original',
        price: 1000.25,
        ivaRate: 14,
        code: 'SERV-001',
        unit: 'HORA',
      })
      .expect(201);
    const productId = (created.body as { id: string }).id;

    await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({ description: null, price: 1200.5, unit: 'SERVICO' })
      .expect(200);

    const paged = await request(app.getHttpServer())
      .get('/products?page=1&pageSize=20&sortBy=name&sortDirection=asc')
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    expect(paged.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: productId, unit: 'SERVICO' }),
      ]),
    );
    expect(paged.body.pagination).toEqual(
      expect.objectContaining({ page: 1, pageSize: 20 }),
    );

    const fetched = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .set('Authorization', bearer(viewerAToken))
      .expect(200);
    expect(fetched.body).toEqual(
      expect.objectContaining({
        id: productId,
        name: 'Serviço contabilístico',
        description: null,
        price: 1200.5,
        code: 'SERV-001',
        unit: 'SERVICO',
      }),
    );

    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', bearer(viewerAToken))
      .send({ name: 'Produto não autorizado', price: 1 })
      .expect(403);
    await request(app.getHttpServer())
      .get(`/products?search=${'a'.repeat(121)}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(400);

    const tenantBList = await request(app.getHttpServer())
      .get('/products?search=contabilístico')
      .set('Authorization', bearer(ownerBToken))
      .expect(200);
    expect(tenantBList.body).toEqual([]);
    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set('Authorization', bearer(ownerBToken))
      .send({ price: 1 })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);

    const invoiceItem = await prisma.invoiceItem.findFirstOrThrow({
      where: { invoice: { tenantId: tenantAId } },
    });
    await prisma.invoiceItem.update({
      where: { id: invoiceItem.id },
      data: { productId },
    });

    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(409);
    await prisma.invoiceItem.update({
      where: { id: invoiceItem.id },
      data: { productId: null },
    });
    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
  });

  it('validates supplier roles and preserves omitted fields in PATCH', async () => {
    await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', bearer(ownerAToken))
      .send({ name: 'Fornecedor forjado', tenantId: tenantBId })
      .expect(400);

    const created = await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', bearer(ownerAToken))
      .send({
        name: 'Fornecedor A',
        nif: 'SUPPLIER-A-001',
        email: 'supplier-a@example.test',
        phone: '+244900000003',
      })
      .expect(201);
    supplierId = created.body.id;

    await request(app.getHttpServer())
      .patch(`/suppliers/${supplierId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({ notes: 'Fornecedor validado' })
      .expect(200);

    const fetched = await request(app.getHttpServer())
      .get(`/suppliers/${supplierId}`)
      .set('Authorization', bearer(viewerAToken))
      .expect(200);
    expect(fetched.body).toEqual(
      expect.objectContaining({
        id: supplierId,
        name: 'Fornecedor A',
        nif: 'SUPPLIER-A-001',
        email: 'supplier-a@example.test',
        phone: '+244900000003',
        notes: 'Fornecedor validado',
      }),
    );

    const supplierPage = await request(app.getHttpServer())
      .get('/suppliers?page=1&pageSize=20&sortBy=name&sortDirection=asc')
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    expect(supplierPage.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: supplierId })]),
    );
    expect(supplierPage.body.summary).toEqual(
      expect.objectContaining({ total: 1, withEmail: 1, withPhone: 1 }),
    );

    await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', bearer(viewerAToken))
      .send({ name: 'Fornecedor não autorizado' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/suppliers/${supplierId}`)
      .set('Authorization', bearer(ownerAToken))
      .send({ name: '   ' })
      .expect(400);
  });

  it('isolates suppliers and enforces purchase invoice relationships', async () => {
    await request(app.getHttpServer())
      .get(`/suppliers/${supplierId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/suppliers/${supplierId}`)
      .set('Authorization', bearer(ownerBToken))
      .send({ notes: 'Alteração indevida' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/suppliers/${supplierId}`)
      .set('Authorization', bearer(ownerBToken))
      .expect(404);

    const purchase = await prisma.purchaseInvoice.create({
      data: {
        tenantId: tenantAId,
        supplierId,
        invoiceNumber: `PURCHASE-E2E-${Date.now()}`,
        subtotal: 2000,
        iva: 0,
        withholdingTax: 0,
        total: 2000,
      },
    });
    const item = await prisma.purchaseInvoiceItem.create({
      data: {
        purchaseInvoiceId: purchase.id,
        productName: 'Serviço de teste',
        quantity: 1,
        unitPrice: 2000,
        total: 2000,
      },
    });

    await request(app.getHttpServer())
      .delete(`/suppliers/${supplierId}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(409);

    await prisma.purchaseInvoice.delete({
      where: { id: purchase.id },
    });
    await expect(
      prisma.purchaseInvoiceItem.findUnique({ where: { id: item.id } }),
    ).resolves.toBeNull();

    await request(app.getHttpServer())
      .delete(`/suppliers/${supplierId}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    await expect(
      prisma.supplier.findUnique({ where: { id: supplierId } }),
    ).resolves.toBeNull();
  });

  it('creates tenant-owned salary/dependent records and cascades them on delete', async () => {
    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salaries`)
      .set('Authorization', bearer(ownerAToken))
      .send({
        baseSalary: 500000.25,
        foodAllowance: 30000,
        effectiveFrom: '2026-09-01',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/dependents`)
      .set('Authorization', bearer(ownerAToken))
      .send({
        name: 'Carlos Manuel',
        relationship: 'Filho',
        taxDependent: true,
      })
      .expect(201);

    const [salaries, dependents] = await Promise.all([
      request(app.getHttpServer())
        .get(`/employees/${employeeId}/salaries`)
        .set('Authorization', bearer(ownerAToken))
        .expect(200),
      request(app.getHttpServer())
        .get(`/employees/${employeeId}/dependents`)
        .set('Authorization', bearer(ownerAToken))
        .expect(200),
    ]);
    expect(salaries.body).toHaveLength(2);
    expect(Number(salaries.body[0].baseSalary)).toBe(500000.25);
    expect(salaries.body[0].active).toBe(true);
    expect(salaries.body[1].active).toBe(false);
    expect(dependents.body).toHaveLength(1);

    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}`)
      .set('Authorization', bearer(ownerAToken))
      .expect(200);

    const [employee, salaryCount, dependentCount] = await Promise.all([
      prisma.employee.findUnique({ where: { id: employeeId } }),
      prisma.employeeSalary.count({ where: { employeeId } }),
      prisma.employeeDependent.count({ where: { employeeId } }),
    ]);
    expect(employee).toBeNull();
    expect(salaryCount).toBe(0);
    expect(dependentCount).toBe(0);
  });
});
