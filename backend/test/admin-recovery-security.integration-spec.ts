import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { AdminAuthService } from '../src/admin/admin-auth.service';
import { AdminModule } from '../src/admin/admin.module';
import { AdminPlatformService } from '../src/admin/admin-platform.service';
import { PlatformAdminRecoveryService } from '../src/admin/platform-admin-recovery.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { FiscalEnrollmentService } from '../src/fiscal-enrollment/fiscal-enrollment.service';
import { MailService } from '../src/mail/mail.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Admin recovery and suspended tenant security', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAuth: AdminAuthService;
  let adminPlatform: AdminPlatformService;
  let recovery: PlatformAdminRecoveryService;
  let tenantAuth: AuthService;
  let tenantJwtStrategy: JwtStrategy;
  let tenantJwtService: JwtService;
  let adminId: string;
  let tenantId: string;
  let tenantUserId: string;

  const suffix = `${Date.now()}`;
  const adminEmail = `recovery-admin-${suffix}@example.test`;
  const tenantEmail = `suspended-tenant-${suffix}@example.test`;
  const tenantUserEmail = `suspended-user-${suffix}@example.test`;
  const tenantNif = `9${suffix.slice(-9)}`;
  const originalAdminPassword = 'Admin-recovery-original-1!';
  const recoveredAdminPassword = 'Admin-recovery-replaced-1!';
  const tenantUserPassword = 'Tenant-suspension-user-1!';

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    process.env.ADMIN_JWT_SECRET =
      'local-admin-recovery-secret-with-more-than-32-bytes';
    process.env.JWT_SECRET =
      'local-tenant-recovery-secret-with-more-than-32-bytes';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AdminModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    adminAuth = app.get(AdminAuthService);
    adminPlatform = app.get(AdminPlatformService);
    recovery = new PlatformAdminRecoveryService(prisma);

    tenantJwtService = new JwtService({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    });
    tenantAuth = new AuthService(
      prisma,
      tenantJwtService,
      {} as MailService,
      {} as FiscalEnrollmentService,
    );
    tenantJwtStrategy = new JwtStrategy(app.get(ConfigService), prisma);

    const admin = await prisma.platformAdmin.create({
      data: {
        email: adminEmail,
        name: 'Admin Recovery Integration',
        password: await bcrypt.hash(originalAdminPassword, 12),
        mustChangePassword: false,
        failedLoginAttempts: 3,
      },
    });
    adminId = admin.id;

    const tenant = await prisma.tenant.create({
      data: {
        name: `Suspended Tenant ${suffix}`,
        nif: tenantNif,
        email: tenantEmail,
        status: 'ACTIVE',
      },
    });
    tenantId = tenant.id;

    const tenantUser = await prisma.user.create({
      data: {
        tenantId,
        name: 'Tenant Security Integration User',
        email: tenantUserEmail,
        password: await bcrypt.hash(tenantUserPassword, 12),
        role: 'OWNER',
      },
    });
    tenantUserId = tenantUser.id;
  });

  afterAll(async () => {
    if (prisma) {
      const auditWhere = {
        OR: [
          ...(adminId ? [{ adminId }] : []),
          ...(tenantId ? [{ targetId: tenantId }] : []),
        ],
      };

      if (auditWhere.OR.length) {
        await prisma.platformAuditLog.deleteMany({ where: auditWhere });
      }
      if (adminId) {
        await prisma.platformAdmin.deleteMany({ where: { id: adminId } });
      }
      if (tenantId) {
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      }
    }
    if (app) await app.close();
  });

  it('recovers an existing admin, invalidates the previous session and forces a password change', async () => {
    const existingSession = await adminAuth.login(
      { email: adminEmail, password: originalAdminPassword },
      {},
    );

    await prisma.platformAdmin.update({
      where: { id: adminId },
      data: {
        failedLoginAttempts: 3,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await recovery.recover({
      email: adminEmail,
      passwordHash: await bcrypt.hash(recoveredAdminPassword, 12),
      reactivate: false,
    });

    await expect(
      adminAuth.verifyAccessToken(existingSession.access_token),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const recovered = await prisma.platformAdmin.findUniqueOrThrow({
      where: { id: adminId },
    });
    expect(recovered.mustChangePassword).toBe(true);
    expect(recovered.failedLoginAttempts).toBe(0);
    expect(recovered.lockedUntil).toBeNull();
    await expect(
      bcrypt.compare(recoveredAdminPassword, recovered.password),
    ).resolves.toBe(true);

    await expect(
      adminAuth.login(
        { email: adminEmail, password: originalAdminPassword },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      adminAuth.login(
        { email: adminEmail, password: recoveredAdminPassword },
        {},
      ),
    ).resolves.toEqual(
      expect.objectContaining({ requires_password_change: true }),
    );

    const recoveryAudit = await prisma.platformAuditLog.findFirst({
      where: { adminId, action: 'ADMIN_PASSWORD_RECOVERED' },
    });
    expect(recoveryAudit?.metadata).toEqual({
      sessionsInvalidated: true,
      accountReactivated: false,
    });
  });

  it('blocks both an existing tenant session and a new login after suspension', async () => {
    const login = await tenantAuth.login({
      email: tenantUserEmail.toUpperCase(),
      password: tenantUserPassword,
    });
    const payload = await tenantJwtService.verifyAsync<{ sub: string }>(
      login.access_token,
    );

    await expect(tenantJwtStrategy.validate(payload)).resolves.toEqual(
      expect.objectContaining({ userId: tenantUserId, tenantId }),
    );

    await adminPlatform.updateTenantStatus(
      tenantId,
      {
        status: 'SUSPENDED',
        reason: 'Suspensao criada pelo teste de seguranca isolado.',
      },
      { adminId },
    );

    await expect(tenantJwtStrategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      tenantAuth.login({
        email: tenantUserEmail,
        password: tenantUserPassword,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      prisma.platformAuditLog.findFirst({
        where: { targetId: tenantId, action: 'TENANT_SUSPENDED' },
      }),
    ).resolves.toEqual(expect.objectContaining({ adminId }));
  });
});
