import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { PlatformAdmin } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AdminAuthService } from './admin-auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const comparePassword = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;
const hashPassword = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

function createAdmin(overrides: Partial<PlatformAdmin> = {}): PlatformAdmin {
  return {
    id: 'admin-1',
    email: 'admin@example.com',
    password: 'stored-hash',
    name: 'Administrador',
    role: 'SUPER_ADMIN',
    isActive: true,
    mustChangePassword: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    passwordChangedAt: null,
    tokenVersion: 0,
    createdAt: new Date('2026-09-29T00:00:00.000Z'),
    updatedAt: new Date('2026-09-29T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AdminAuthService', () => {
  const platformAdmin = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const platformAuditLog = {
    create: jest.fn(),
  };
  const prisma = {
    platformAdmin,
    platformAuditLog,
    $transaction: jest.fn(async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    ),
  } as unknown as PrismaService;
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn().mockReturnValue('a'.repeat(48)),
  } as unknown as ConfigService;

  let service: AdminAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminAuthService(prisma, jwtService, configService);
  });

  it('devolve a mesma resposta genérica quando a conta não existe', async () => {
    platformAdmin.findUnique.mockResolvedValue(null);
    platformAuditLog.create.mockResolvedValue({});
    comparePassword.mockResolvedValue(false as never);

    await expect(
      service.login(
        { email: 'unknown@example.com', password: 'Invalid-password1!' },
        {},
      ),
    ).rejects.toEqual(new UnauthorizedException('Credenciais inválidas.'));

    expect(platformAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: null,
          action: 'ADMIN_LOGIN_FAILED',
          metadata: expect.objectContaining({ emailDigest: expect.any(String) }),
        }),
      }),
    );
  });

  it('bloqueia temporariamente a conta na quinta tentativa inválida', async () => {
    platformAdmin.findUnique.mockResolvedValue(
      createAdmin({ failedLoginAttempts: 4 }),
    );
    platformAdmin.update.mockResolvedValue(createAdmin());
    platformAuditLog.create.mockResolvedValue({});
    comparePassword.mockResolvedValue(false as never);

    await expect(
      service.login(
        { email: 'admin@example.com', password: 'Invalid-password1!' },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(platformAdmin.update).toHaveBeenCalledWith({
      where: { id: 'admin-1' },
      data: {
        failedLoginAttempts: 5,
        lockedUntil: expect.any(Date),
      },
    });
  });

  it('emite token próprio e conserva a obrigação de mudar a palavra-passe', async () => {
    const admin = createAdmin();
    platformAdmin.findUnique.mockResolvedValue(admin);
    platformAdmin.update.mockResolvedValue(admin);
    platformAuditLog.create.mockResolvedValue({});
    comparePassword.mockResolvedValue(true as never);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('admin-token');

    const result = await service.login(
      { email: 'ADMIN@example.com', password: 'Temporary-password1!' },
      { ipAddress: '127.0.0.1' },
    );

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        sub: 'admin-1',
        kind: 'platform-admin',
        tokenVersion: 0,
      },
      expect.objectContaining({ expiresIn: '15m' }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        access_token: 'admin-token',
        requires_password_change: true,
      }),
    );
    expect(result.admin).not.toHaveProperty('password');
  });

  it('recusa um JWT empresarial no guard administrativo', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'tenant-user-1',
      tenantId: 'tenant-1',
      tokenVersion: 0,
    });

    await expect(service.verifyAccessToken('tenant-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(platformAdmin.findUnique).not.toHaveBeenCalled();
  });

  it('altera a credencial temporária, invalida tokens anteriores e emite nova sessão', async () => {
    const admin = createAdmin();
    const updated = createAdmin({
      mustChangePassword: false,
      tokenVersion: 1,
      passwordChangedAt: new Date(),
    });
    platformAdmin.findUnique.mockResolvedValue(admin);
    platformAdmin.update.mockResolvedValue(updated);
    platformAuditLog.create.mockResolvedValue({});
    comparePassword.mockResolvedValueOnce(true as never).mockResolvedValueOnce(
      false as never,
    );
    hashPassword.mockResolvedValue('new-hash' as never);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('new-admin-token');

    const result = await service.changePassword(
      admin.id,
      {
        currentPassword: 'Temporary-password1!',
        newPassword: 'Permanent-password2!',
      },
      {},
    );

    expect(platformAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mustChangePassword: false,
          tokenVersion: { increment: 1 },
        }),
      }),
    );
    expect(result.requires_password_change).toBe(false);
    expect(result.access_token).toBe('new-admin-token');
  });

  it('impede a reutilização da palavra-passe temporária', async () => {
    platformAdmin.findUnique.mockResolvedValue(createAdmin());
    comparePassword.mockResolvedValue(true as never);

    await expect(
      service.changePassword(
        'admin-1',
        {
          currentPassword: 'Temporary-password1!',
          newPassword: 'Temporary-password1!',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
