import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';
import { MailService } from '../mail/mail.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService login', () => {
  function makeUser(status: 'ACTIVE' | 'SUSPENDED') {
    return {
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'owner@example.test',
      password: 'stored-password-value',
      name: 'Responsavel',
      role: 'OWNER',
      isActive: true,
      emailVerificationRequired: false,
      emailVerifiedAt: new Date(),
      tenant: {
        id: 'tenant-1',
        name: 'Empresa de Teste',
        nif: '5417123456',
        email: 'empresa@example.test',
        phone: null,
        address: null,
        sector: null,
        regime: 'GERAL',
        retentionRate: 0,
        companyType: null,
        employeeCount: 0,
        status,
        planType: 'FREE',
        trialEndsAt: null,
      },
    };
  }

  function makeFixture(status: 'ACTIVE' | 'SUSPENDED') {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(makeUser(status)),
        update: jest.fn().mockResolvedValue({}),
      },
      companySettings: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('tenant-access-token'),
    };

    return {
      service: new AuthService(
        prisma as unknown as PrismaService,
        jwtService as unknown as JwtService,
        {} as MailService,
        {} as FiscalEnrollmentService,
      ),
      prisma,
      jwtService,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('normalizes email and refuses a suspended company before issuing a token', async () => {
    const { service, prisma, jwtService } = makeFixture('SUSPENDED');

    await expect(
      service.login({ email: 'OWNER@EXAMPLE.TEST ', password: 'test-input' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'owner@example.test' } }),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.companySettings.upsert).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('updates login metadata, ensures settings and signs the session for an active company', async () => {
    const { service, prisma, jwtService } = makeFixture('ACTIVE');

    const result = await service.login({
      email: 'owner@example.test',
      password: 'test-input',
    });

    expect(result.access_token).toBe('tenant-access-token');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
    expect(prisma.companySettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1' } }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user-1', tenantId: 'tenant-1' }),
    );
  });
});
