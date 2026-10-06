import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FiscalRegime,
  ObligationType,
  TaxType,
  UserRole,
} from '@prisma/client';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { EmployeeModule } from '../src/employee/employee.module';
import { PayrollModule } from '../src/payroll/payroll.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Payroll HTTP tenant isolation and versioned calculations', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let tenantAId: string;
  let tenantBId: string;
  let employeeAId: string;
  let payrollId: string;
  let ownerAToken: string;
  let accountantAToken: string;
  let viewerAToken: string;
  let ownerBToken: string;
  let calendarCodes: string[] = [];

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
        AuthModule,
        EmployeeModule,
        PayrollModule,
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

    const staleTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { startsWith: 'Payroll Tenant A ' } },
          { name: { startsWith: 'Payroll Tenant B ' } },
        ],
      },
      select: { id: true },
    });
    const staleTenantIds = staleTenants.map((tenant) => tenant.id);
    if (staleTenantIds.length > 0) {
      await prisma.payroll.deleteMany({
        where: { tenantId: { in: staleTenantIds } },
      });
      await prisma.tenant.deleteMany({
        where: { id: { in: staleTenantIds } },
      });
    }
    await prisma.fiscalCalendar.deleteMany({
      where: {
        OR: [
          { code: { startsWith: 'PAYROLL-IRT-' } },
          { code: { startsWith: 'PAYROLL-SS-' } },
        ],
      },
    });

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    calendarCodes = [
      `PAYROLL-IRT-${runId}`,
      `PAYROLL-SS-${runId}`,
    ];

    const [tenantA, tenantB] = await Promise.all([
      prisma.tenant.create({
        data: {
          name: `Payroll Tenant A ${runId}`,
          nif: `PAY-A-${runId}`,
          email: `pay-a-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
        },
      }),
      prisma.tenant.create({
        data: {
          name: `Payroll Tenant B ${runId}`,
          nif: `PAY-B-${runId}`,
          email: `pay-b-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
        },
      }),
    ]);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const [ownerA, accountantA, viewerA, ownerB] = await Promise.all([
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          email: `pay-owner-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Payroll Owner A',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          email: `pay-accountant-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Payroll Accountant A',
          role: UserRole.ACCOUNTANT,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          email: `pay-viewer-a-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Payroll Viewer A',
          role: UserRole.VIEWER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantBId,
          email: `pay-owner-b-${runId}@example.test`,
          password: 'not-used-by-integration-test',
          name: 'Payroll Owner B',
          role: UserRole.OWNER,
        },
      }),
    ]);

    [ownerAToken, accountantAToken, viewerAToken, ownerBToken] =
      await Promise.all(
        [ownerA, accountantA, viewerA, ownerB].map((user) =>
          jwtService.signAsync({ sub: user.id }),
        ),
      );

    const employeeA = await prisma.employee.create({
      data: {
        tenantId: tenantAId,
        employeeNumber: 'PAY-001',
        name: 'Trabalhador A',
        nif: `EMP-${runId}`,
        hireDate: new Date('2025-01-01T00:00:00.000Z'),
        status: 'ACTIVE',
        socialSecurityCategory: 'STANDARD',
        salaries: {
          create: {
            baseSalary: '200000.10',
            foodAllowance: '30000',
            transportAllowance: '30000',
            effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          },
        },
      },
    });
    employeeAId = employeeA.id;

    await prisma.employee.create({
      data: {
        tenantId: tenantBId,
        employeeNumber: 'PAY-001',
        name: 'Trabalhador B',
        hireDate: new Date('2025-01-01T00:00:00.000Z'),
        status: 'ACTIVE',
        salaries: {
          create: {
            baseSalary: '999999.99',
            effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          },
        },
      },
    });

    await Promise.all([
      prisma.fiscalCalendar.create({
        data: {
          code: calendarCodes[0],
          title: 'IRT GRUPO A - MAPA DE REMUNERACOES DO MES ANTERIOR',
          description: 'Entrega mensal do mapa de remuneracoes do Grupo A.',
          taxType: TaxType.IRT,
          obligationType: ObligationType.IRT,
          dueDate: new Date('2026-10-30T12:00:00.000Z'),
          period: 'OUTUBRO',
          referenceYear: 2026,
          active: true,
          regimes: {
            create: { regime: FiscalRegime.GERAL },
          },
        },
      }),
      prisma.fiscalCalendar.create({
        data: {
          code: calendarCodes[1],
          title: 'SEGURANCA SOCIAL - MES ANTERIOR',
          description: 'Contribuicoes da entidade empregadora e do trabalhador.',
          taxType: TaxType.SS,
          obligationType: ObligationType.SS,
          dueDate: new Date('2026-10-10T12:00:00.000Z'),
          period: 'OUTUBRO',
          referenceYear: 2026,
          active: true,
          regimes: {
            create: { regime: FiscalRegime.GERAL },
          },
        },
      }),
    ]);
  });

  afterAll(async () => {
    if (prisma && tenantAId && tenantBId) {
      await prisma.payroll.deleteMany({
        where: {
          tenantId: { in: [tenantAId, tenantBId] },
        },
      });
      await prisma.tenant.deleteMany({
        where: {
          id: { in: [tenantAId, tenantBId] },
        },
      });
      await prisma.fiscalCalendar.deleteMany({
        where: {
          code: { in: calendarCodes },
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('protects payroll salary data with authentication and RBAC', async () => {
    await request(app.getHttpServer()).get('/payroll').expect(401);
    await request(app.getHttpServer())
      .get('/payroll')
      .set('Authorization', bearer(viewerAToken))
      .expect(403);
    await request(app.getHttpServer())
      .post('/payroll')
      .set('Authorization', bearer(viewerAToken))
      .send({ month: 9, year: 2026 })
      .expect(403);
  });

  it('serializes concurrent period creation and persists exact 2026 amounts', async () => {
    const concurrent = await Promise.all([
      request(app.getHttpServer())
        .post('/payroll')
        .set('Authorization', bearer(accountantAToken))
        .send({ month: 8, year: 2026 }),
      request(app.getHttpServer())
        .post('/payroll')
        .set('Authorization', bearer(accountantAToken))
        .send({ month: 8, year: 2026 }),
    ]);
    expect(concurrent.map((response) => response.status).sort()).toEqual([
      201,
      400,
    ]);

    const created = await request(app.getHttpServer())
      .post('/payroll')
      .set('Authorization', bearer(accountantAToken))
      .send({ month: 9, year: 2026 })
      .expect(201);
    payrollId = created.body.id;

    expect(created.body).toEqual(
      expect.objectContaining({
        period: '2026-09',
        status: 'CALCULATED',
        employeeCount: 1,
        taxRuleVersion: 'AO-PAYROLL-2026-OGE14-25-INSS227-18',
      }),
    );
    expect(String(created.body.grossAmount)).toBe('260000.1');
    expect(String(created.body.socialSecurityAmount)).toBe('7800');
    expect(String(created.body.employerSocialSecurityAmount)).toBe(
      '20800.01',
    );
    expect(String(created.body.irtAmount)).toBe('19252.02');
    expect(String(created.body.netAmount)).toBe('232948.08');

    const stored = await prisma.payroll.findUniqueOrThrow({
      where: { id: payrollId },
      include: { items: true },
    });
    expect(stored.grossAmount.toFixed(2)).toBe('260000.10');
    expect(stored.items[0].employeeSocialSecurityRate.toFixed(6)).toBe(
      '0.030000',
    );
    expect(stored.items[0].employerSocialSecurityRate.toFixed(6)).toBe(
      '0.080000',
    );

    const obligations = await prisma.fiscalObligation.findMany({
      where: {
        tenantId: tenantAId,
        fiscalCalendarId: { not: null },
      },
    });
    const irt = obligations.find((item) => item.type === ObligationType.IRT);
    const socialSecurity = obligations.find(
      (item) => item.type === ObligationType.SS,
    );
    expect(irt?.amountValue?.toFixed(2)).toBe('19252.02');
    expect(socialSecurity?.amountValue?.toFixed(2)).toBe('28600.01');

    await request(app.getHttpServer())
      .post('/payroll')
      .set('Authorization', bearer(accountantAToken))
      .send({ month: 9, year: 2026 })
      .expect(400);
  });

  it('isolates tenants and protects every status transition', async () => {
    await request(app.getHttpServer())
      .get('/payroll/2026/9')
      .set('Authorization', bearer(ownerBToken))
      .expect(404);

    for (const action of ['calculate', 'approve', 'pay', 'close']) {
      await request(app.getHttpServer())
        .post(`/payroll/${payrollId}/${action}`)
        .set('Authorization', bearer(ownerBToken))
        .expect(404);
    }

    await request(app.getHttpServer())
      .post(`/payroll/${payrollId}/approve`)
      .set('Authorization', bearer(accountantAToken))
      .expect(403);

    await request(app.getHttpServer())
      .post(`/payroll/${payrollId}/approve`)
      .set('Authorization', bearer(ownerAToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('APPROVED'));

    await request(app.getHttpServer())
      .post(`/payroll/${payrollId}/calculate`)
      .set('Authorization', bearer(accountantAToken))
      .expect(400);

    await request(app.getHttpServer())
      .post(`/payroll/${payrollId}/pay`)
      .set('Authorization', bearer(ownerAToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('PAID'));

    await request(app.getHttpServer())
      .post(`/payroll/${payrollId}/close`)
      .set('Authorization', bearer(ownerAToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('CLOSED'));

    await request(app.getHttpServer())
      .post(`/payroll/${payrollId}/calculate`)
      .set('Authorization', bearer(accountantAToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('CLOSED'));

    const auditCount = await prisma.auditLog.count({
      where: {
        tenantId: tenantAId,
        entity: 'Payroll',
        entityId: payrollId,
      },
    });
    expect(auditCount).toBeGreaterThanOrEqual(4);
  });

  it('uses the salary valid at period start and blocks unsupported mid-month changes', async () => {
    await request(app.getHttpServer())
      .post(`/employees/${employeeAId}/salaries`)
      .set('Authorization', bearer(accountantAToken))
      .send({
        baseSalary: 300000,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
      })
      .expect(201);

    const october = await request(app.getHttpServer())
      .post('/payroll')
      .set('Authorization', bearer(accountantAToken))
      .send({ month: 10, year: 2026 })
      .expect(201);
    expect(String(october.body.items[0].baseSalary)).toBe('300000');

    await request(app.getHttpServer())
      .post(`/employees/${employeeAId}/salaries`)
      .set('Authorization', bearer(accountantAToken))
      .send({
        baseSalary: 350000,
        effectiveFrom: '2026-11-15T00:00:00.000Z',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/payroll')
      .set('Authorization', bearer(accountantAToken))
      .send({ month: 11, year: 2026 })
      .expect(400)
      .expect(({ body }) => {
        expect(String(body.message)).toContain('meio do mês');
      });
  });
});
