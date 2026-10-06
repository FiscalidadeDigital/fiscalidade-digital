import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

describe('JWT session validation', () => {
  const config = { get: () => 'test-secret-'.repeat(4) } as any;
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  } as any;
  const strategy = new JwtStrategy(config, prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses current database tenant and role instead of mutable JWT claims', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-current',
      email: 'user@example.test',
      role: 'ACCOUNTANT',
      isActive: true,
      tenant: { status: 'TRIAL' },
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        tenantId: 'tenant-from-token',
        role: 'OWNER',
      } as any),
    ).resolves.toEqual({
      userId: 'user-1',
      tenantId: 'tenant-current',
      email: 'user@example.test',
      role: 'ACCOUNTANT',
    });
  });

  it('rejects a disabled or deleted account on every authenticated request', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'user@example.test',
      role: 'OWNER',
      isActive: false,
      tenant: { status: 'ACTIVE' },
    });

    await expect(strategy.validate({ sub: 'user-1' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects sessions belonging to suspended companies', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'user@example.test',
      role: 'OWNER',
      isActive: true,
      tenant: { status: 'SUSPENDED' },
    });

    await expect(strategy.validate({ sub: 'user-1' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
