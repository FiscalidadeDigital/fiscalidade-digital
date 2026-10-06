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

describe('Platform admin HTTP isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminId: string;

  const temporaryPassword = 'Temporary-admin1!';
  const permanentPassword = 'Permanent-admin2!';
  const email = `platform-admin-${Date.now()}@example.test`;
  const bearer = (token: string) => `Bearer ${token}`;

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    process.env.ADMIN_JWT_SECRET =
      'local-admin-integration-secret-with-more-than-32-bytes';

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
    jwtService = app.get(JwtService);

    const admin = await prisma.platformAdmin.create({
      data: {
        email,
        name: 'Admin E2E',
        password: await bcrypt.hash(temporaryPassword, 12),
        mustChangePassword: true,
      },
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    if (prisma && adminId) {
      await prisma.platformAuditLog.deleteMany({ where: { adminId } });
      await prisma.platformAdmin.deleteMany({ where: { id: adminId } });
    }
    if (app) await app.close();
  });

  it('recusa um token de utilizador empresarial na área administrativa', async () => {
    const tenantToken = await jwtService.signAsync(
      { sub: 'tenant-user', tenantId: 'tenant-a', role: 'OWNER' },
      { secret: process.env.JWT_SECRET },
    );

    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', bearer(tenantToken))
      .expect(401);
  });

  it('obriga a mudar a credencial temporária antes de consultar métricas', async () => {
    const login = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email, password: temporaryPassword })
      .expect(201);

    expect(login.body.requires_password_change).toBe(true);
    expect(login.body.admin).not.toHaveProperty('password');
    const temporaryToken = login.body.access_token as string;

    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', bearer(temporaryToken))
      .expect(403)
      .expect(({ body }) => {
        expect(body.code).toBe('ADMIN_PASSWORD_CHANGE_REQUIRED');
      });

    const changed = await request(app.getHttpServer())
      .post('/admin/auth/change-password')
      .set('Authorization', bearer(temporaryToken))
      .send({
        currentPassword: temporaryPassword,
        newPassword: permanentPassword,
      })
      .expect(201);

    expect(changed.body.requires_password_change).toBe(false);
    const permanentToken = changed.body.access_token as string;

    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', bearer(temporaryToken))
      .expect(401);

    const dashboard = await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', bearer(permanentToken))
      .expect(200);

    expect(dashboard.body).toEqual(
      expect.objectContaining({
        tenants: expect.objectContaining({ total: expect.any(Number) }),
        users: expect.objectContaining({ total: expect.any(Number) }),
        operations: expect.objectContaining({
          employees: expect.any(Number),
          documents: expect.any(Number),
          storageBytes: expect.any(Number),
        }),
      }),
    );
    expect(dashboard.body).not.toHaveProperty('tenantData');
  });

  it('mantém mensagem genérica para credenciais erradas', async () => {
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email, password: 'Incorrect-admin9!' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.message).toBe('Credenciais inválidas.');
      });
  });
});
