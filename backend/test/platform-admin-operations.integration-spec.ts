import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AdminModule } from '../src/admin/admin.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Platform admin operational HTTP API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: string;
  let tenantId: string;
  let token: string;

  const suffix = `${Date.now()}`;
  const nif = `9${suffix.slice(-9)}`;
  const bearer = () => `Bearer ${token}`;

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    process.env.ADMIN_JWT_SECRET =
      'local-admin-operations-secret-with-more-than-32-bytes';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AdminModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);
    const admin = await prisma.platformAdmin.create({
      data: {
        email: `operations-admin-${suffix}@example.test`,
        name: 'Admin Operations E2E',
        password: await bcrypt.hash('Operations-password1!', 12),
        mustChangePassword: false,
      },
    });
    adminId = admin.id;
    token = await jwtService.signAsync(
      { sub: admin.id, kind: 'platform-admin', tokenVersion: admin.tokenVersion },
      { secret: process.env.ADMIN_JWT_SECRET, expiresIn: '15m' },
    );

    const tenant = await prisma.tenant.create({
      data: {
        name: `Tenant Operations ${suffix}`,
        nif,
        email: `tenant-${suffix}@example.test`,
        status: 'TRIAL',
        planType: 'FREE',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        storageBaseQuotaBytes: 10_000n,
        storageUsedBytes: 1_024n,
        users: {
          create: {
            name: 'Utilizador E2E',
            email: `user-${suffix}@example.test`,
            password: 'not-used-in-this-test',
            role: 'OWNER',
          },
        },
      },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.platformAuditLog.deleteMany({
        where: { OR: [{ adminId }, { targetId: tenantId }] },
      });
      await prisma.platformAdmin.deleteMany({ where: { id: adminId } });
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
    }
    if (app) await app.close();
  });

  it('lista tenants com paginação, métricas e identificadores mascarados', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/tenants')
      .query({ search: nif, page: 1, pageSize: 10 })
      .set('Authorization', bearer())
      .expect(200);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({ page: 1, pageSize: 10, total: 1 }),
    );
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: tenantId,
        nifMasked: expect.stringContaining(nif.slice(-4)),
        status: 'TRIAL',
        usage: expect.objectContaining({
          users: 1,
          activeUsers: 1,
          storageUsedBytes: '1024',
          storageQuotaBytes: '10000',
        }),
      }),
    );
    expect(response.body.data[0]).not.toHaveProperty('nif');
    expect(response.body.data[0]).not.toHaveProperty('email');
    expect(JSON.stringify(response.body)).not.toContain(`tenant-${suffix}@example.test`);
  });

  it('valida motivo e regista a suspensão na auditoria', async () => {
    await request(app.getHttpServer())
      .patch(`/admin/tenants/${tenantId}/status`)
      .set('Authorization', bearer())
      .send({ status: 'SUSPENDED', reason: 'curto' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/admin/tenants/${tenantId}/status`)
      .set('Authorization', bearer())
      .send({
        status: 'SUSPENDED',
        reason: 'Revisão operacional criada pelo teste isolado.',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            id: tenantId,
            status: 'SUSPENDED',
            changed: true,
          }),
        );
      });

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    const audit = await prisma.platformAuditLog.findFirst({
      where: { targetId: tenantId, action: 'TENANT_SUSPENDED' },
    });
    expect(tenant.status).toBe('SUSPENDED');
    expect(audit).toEqual(expect.objectContaining({ adminId, targetType: 'Tenant' }));
  });

  it('expõe o audit trail sem metadata e contexto técnico', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/audit')
      .query({ action: 'TENANT_SUSPENDED', targetType: 'Tenant' })
      .set('Authorization', bearer())
      .expect(200);

    const event = response.body.data.find(
      (item: { targetId: string }) => item.targetId === tenantId,
    );
    expect(event).toEqual(
      expect.objectContaining({
        action: 'TENANT_SUSPENDED',
        targetId: tenantId,
      }),
    );
    expect(event).not.toHaveProperty('metadata');
    expect(event).not.toHaveProperty('ipAddress');
    expect(event).not.toHaveProperty('userAgent');
  });
});
