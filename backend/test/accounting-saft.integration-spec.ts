import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { FiscalRegime, UserRole } from '@prisma/client';
import request from 'supertest';

import { AccountingSaftModule } from '../src/accounting-saft/accounting-saft.module';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Accounting SAF-T readiness HTTP isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  const tenantIds: string[] = [];
  let ownerAToken: string;
  let ownerBToken: string;
  let viewerAToken: string;
  const bearer = (token: string) => `Bearer ${token}`;

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AuthModule,
        AccountingSaftModule,
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
          name: `SAFT Tenant A ${runId}`,
          nif: `SAFT-A-${runId}`,
          email: `saft-a-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
        },
      }),
      prisma.tenant.create({
        data: {
          name: `SAFT Tenant B ${runId}`,
          nif: `SAFT-B-${runId}`,
          email: `saft-b-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
        },
      }),
    ]);
    tenantIds.push(tenantA.id, tenantB.id);

    const [ownerA, ownerB, viewerA] = await Promise.all([
      prisma.user.create({
        data: {
          tenantId: tenantA.id,
          email: `saft-owner-a-${runId}@example.test`,
          password: 'not-used',
          name: 'Owner A',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantB.id,
          email: `saft-owner-b-${runId}@example.test`,
          password: 'not-used',
          name: 'Owner B',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantA.id,
          email: `saft-viewer-a-${runId}@example.test`,
          password: 'not-used',
          name: 'Viewer A',
          role: UserRole.VIEWER,
        },
      }),
    ]);

    const client = await prisma.client.create({
      data: {
        tenantId: tenantA.id,
        name: 'Cliente SAF-T A',
        nif: '5000000001',
      },
    });
    await prisma.invoice.create({
      data: {
        tenantId: tenantA.id,
        clientId: client.id,
        invoiceNumber: `SAFT-${runId}`,
        subtotal: 1000,
        iva: 140,
        total: 1140,
        issuedAt: new Date('2026-06-15T12:00:00.000Z'),
      },
    });

    ownerAToken = await jwtService.signAsync({ sub: ownerA.id });
    ownerBToken = await jwtService.signAsync({ sub: ownerB.id });
    viewerAToken = await jwtService.signAsync({ sub: viewerA.id });
  });

  afterAll(async () => {
    if (prisma && tenantIds.length) {
      await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    }
    if (app) await app.close();
  });

  it('calcula a prontidão apenas com dados da empresa autenticada', async () => {
    const tenantA = await request(app.getHttpServer())
      .get('/accounting/saft/readiness?fiscalYear=2026')
      .set('Authorization', bearer(ownerAToken))
      .expect(200);
    const tenantB = await request(app.getHttpServer())
      .get('/accounting/saft/readiness?fiscalYear=2026')
      .set('Authorization', bearer(ownerBToken))
      .expect(200);

    expect(tenantA.body.sections.masterData.clients).toBe(1);
    expect(tenantA.body.sections.accountingMovements.salesDocuments).toBe(1);
    expect(tenantB.body.sections.masterData.clients).toBe(0);
    expect(tenantB.body.sections.accountingMovements.salesDocuments).toBe(0);
    expect(tenantA.body.canExport).toBe(false);
  });

  it('recusa tenant forjado, VIEWER e qualquer rota de exportação inexistente', async () => {
    await request(app.getHttpServer())
      .get(
        `/accounting/saft/readiness?fiscalYear=2026&tenantId=${tenantIds[1]}`,
      )
      .set('Authorization', bearer(ownerAToken))
      .expect(400);

    await request(app.getHttpServer())
      .get('/accounting/saft/readiness?fiscalYear=2026')
      .set('Authorization', bearer(viewerAToken))
      .expect(403);

    await request(app.getHttpServer())
      .get('/accounting/saft/export?fiscalYear=2026')
      .set('Authorization', bearer(ownerAToken))
      .expect(404);
  });
});
