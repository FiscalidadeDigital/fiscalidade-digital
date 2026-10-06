import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { FiscalRegime, UserRole } from '@prisma/client';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersModule } from '../src/users/users.module';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Users HTTP tenant access management', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantAId: string;
  let tenantBId: string;
  let ownerAId: string;
  let ownerAToken: string;
  let ownerBToken: string;
  let adminAToken: string;
  let viewerAToken: string;
  let accountantAId: string;

  const bearer = (token: string) => `Bearer ${token}`;

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AuthModule,
        UsersModule,
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
    const jwt = app.get(JwtService);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const [tenantA, tenantB] = await Promise.all([
      prisma.tenant.create({
        data: {
          name: `Users Tenant A ${runId}`,
          nif: `UA-${runId}`,
          email: `users-a-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
        },
      }),
      prisma.tenant.create({
        data: {
          name: `Users Tenant B ${runId}`,
          nif: `UB-${runId}`,
          email: `users-b-${runId}@example.test`,
          status: 'ACTIVE',
          regime: FiscalRegime.GERAL,
        },
      }),
    ]);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const [ownerA, ownerB, adminA, viewerA, accountantA] = await Promise.all([
      prisma.user.create({ data: { tenantId: tenantAId, email: `owner-a-${runId}@example.test`, password: 'not-used', name: 'Owner A', role: UserRole.OWNER } }),
      prisma.user.create({ data: { tenantId: tenantBId, email: `owner-b-${runId}@example.test`, password: 'not-used', name: 'Owner B', role: UserRole.OWNER } }),
      prisma.user.create({ data: { tenantId: tenantAId, email: `admin-a-${runId}@example.test`, password: 'not-used', name: 'Admin A', role: UserRole.ADMIN } }),
      prisma.user.create({ data: { tenantId: tenantAId, email: `viewer-a-${runId}@example.test`, password: 'not-used', name: 'Viewer A', role: UserRole.VIEWER } }),
      prisma.user.create({ data: { tenantId: tenantAId, email: `accountant-a-${runId}@example.test`, password: 'not-used', name: 'Accountant A', role: UserRole.ACCOUNTANT } }),
    ]);
    ownerAId = ownerA.id;
    accountantAId = accountantA.id;
    [ownerAToken, ownerBToken, adminAToken, viewerAToken] = await Promise.all([
      jwt.signAsync({ sub: ownerA.id }),
      jwt.signAsync({ sub: ownerB.id }),
      jwt.signAsync({ sub: adminA.id }),
      jwt.signAsync({ sub: viewerA.id }),
    ]);
  });

  afterAll(async () => {
    if (prisma && tenantAId && tenantBId) {
      await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    }
    if (app) await app.close();
  });

  it('lists only the authenticated tenant and never returns password hashes', async () => {
    const response = await request(app.getHttpServer())
      .get('/users?page=1&pageSize=20&sortBy=name&sortDirection=asc')
      .set('Authorization', bearer(ownerAToken))
      .expect(200);

    expect(response.body.data).toHaveLength(4);
    expect(response.body.summary).toEqual({ total: 4, active: 4, inactive: 0, owners: 1 });
    expect(response.body.data.every((user: Record<string, unknown>) => !('password' in user))).toBe(true);
    expect(
      response.body.data.every(
        (user: { email: string }) => !user.email.includes('owner-b-'),
      ),
    ).toBe(true);
  });

  it('rejects unauthenticated and non-administrative access', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', bearer(viewerAToken))
      .expect(403);
  });

  it('hides cross-tenant targets and blocks administrator privilege escalation', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${accountantAId}/access`)
      .set('Authorization', bearer(ownerBToken))
      .send({ isActive: false, reason: 'Tentativa entre empresas.' })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/users/${ownerAId}/access`)
      .set('Authorization', bearer(adminAToken))
      .send({ isActive: false, reason: 'Tentativa sobre propriet\u00e1rio.' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/users/${accountantAId}/access`)
      .set('Authorization', bearer(adminAToken))
      .send({ role: 'ADMIN', reason: 'Tentativa de eleva\u00e7\u00e3o indevida.' })
      .expect(403);
  });

  it('updates access and creates a tenant audit event in one request', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${accountantAId}/access`)
      .set('Authorization', bearer(ownerAToken))
      .send({ role: 'VIEWER', isActive: false, reason: 'Acesso revisto pelo propriet\u00e1rio.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(expect.objectContaining({ role: 'VIEWER', isActive: false, changed: true }));
        expect(body).not.toHaveProperty('password');
      });

    await expect(
      prisma.auditLog.findFirst({
        where: {
          tenantId: tenantAId,
          userId: ownerAId,
          entityId: accountantAId,
          action: 'USER_ACCESS_UPDATED',
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ entity: 'User' }));
  });
});
