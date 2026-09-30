import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SubscriptionAccessModule } from '../src/subscription-access/subscription-access.module';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Subscription status HTTP tenant isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  const tenantIds: string[] = [];
  let trialToken: string;
  let paidToken: string;
  const bearer = (token: string) => `Bearer ${token}`;

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AuthModule,
        SubscriptionAccessModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const [trialTenant, paidTenant] = await Promise.all([
      prisma.tenant.create({
        data: {
          name: `Trial Tenant ${runId}`,
          nif: `TRIAL-${runId}`,
          email: `trial-${runId}@example.test`,
          status: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.tenant.create({
        data: {
          name: `Paid Tenant ${runId}`,
          nif: `PAID-${runId}`,
          email: `paid-${runId}@example.test`,
          status: 'ACTIVE',
          trialEndsAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      }),
    ]);
    tenantIds.push(trialTenant.id, paidTenant.id);

    await prisma.subscription.create({
      data: {
        tenantId: paidTenant.id,
        planType: 'PREMIUM',
        priceKwanza: 0,
        startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentStatus: 'PAID',
        isActive: true,
      },
    });

    const [trialOwner, paidOwner] = await Promise.all([
      prisma.user.create({
        data: {
          tenantId: trialTenant.id,
          email: `trial-owner-${runId}@example.test`,
          password: 'not-used',
          name: 'Trial Owner',
          role: UserRole.OWNER,
        },
      }),
      prisma.user.create({
        data: {
          tenantId: paidTenant.id,
          email: `paid-owner-${runId}@example.test`,
          password: 'not-used',
          name: 'Paid Owner',
          role: UserRole.OWNER,
        },
      }),
    ]);

    trialToken = await jwtService.signAsync({ sub: trialOwner.id });
    paidToken = await jwtService.signAsync({ sub: paidOwner.id });
  });

  afterAll(async () => {
    if (prisma && tenantIds.length) {
      await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    }
    if (app) await app.close();
  });

  it('obtém o tenant apenas do JWT mesmo quando a query contém outro ID', async () => {
    const trial = await request(app.getHttpServer())
      .get(`/subscription/status?tenantId=${tenantIds[1]}`)
      .set('Authorization', bearer(trialToken))
      .expect(200);
    const paid = await request(app.getHttpServer())
      .get('/subscription/status')
      .set('Authorization', bearer(paidToken))
      .expect(200);

    expect(trial.body.state).toBe('TRIAL_ACTIVE');
    expect(trial.body.plan.activeSubscriptionId).toBeNull();
    expect(paid.body.state).toBe('SUBSCRIPTION_ACTIVE');
    expect(paid.body.plan.current).toBe('PREMIUM');
  });

  it('exige autenticação e não activa ainda o bloqueio comercial global', async () => {
    await request(app.getHttpServer()).get('/subscription/status').expect(401);

    const response = await request(app.getHttpServer())
      .get('/subscription/status')
      .set('Authorization', bearer(trialToken))
      .expect(200);
    expect(response.body.enforcement.status).toBe('PREPARED_NOT_APPLIED');
  });
});
