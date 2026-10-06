import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService tenant access management', () => {
  const target = {
    id: 'target-user',
    name: 'Ana Manuel',
    email: 'ana@example.test',
    role: UserRole.ACCOUNTANT,
    isActive: true,
    updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  };

  function createTransactionalService(overrides: Record<string, unknown> = {}) {
    const transaction = {
      user: {
        findFirst: jest.fn().mockResolvedValue(target),
        count: jest.fn().mockResolvedValue(2),
        update: jest.fn().mockResolvedValue({
          ...target,
          role: UserRole.VIEWER,
          phone: null,
          avatar: null,
          twoFactorEnabled: false,
          lastLogin: null,
          createdAt: new Date('2026-09-01T00:00:00.000Z'),
          updatedAt: new Date('2026-09-29T10:00:00.000Z'),
        }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      ...overrides,
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    } as unknown as PrismaService;

    return { service: new UsersService(prisma), transaction };
  }

  it('filters every list query by the authenticated tenant and selects no password', async () => {
    const userCount = jest.fn();
    const userFindMany = jest.fn();
    const prisma = {
      user: { count: userCount, findMany: userFindMany },
      $transaction: jest.fn().mockResolvedValue([
        1,
        [target],
        3,
        1,
        1,
      ]),
    } as unknown as PrismaService;
    const service = new UsersService(prisma);

    const result = await service.list('tenant-a', {
      search: 'ana',
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDirection: 'asc',
    });

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
        select: expect.not.objectContaining({ password: true }),
      }),
    );
    expect(result.data).toEqual([target]);
  });

  it('does not reveal whether a user from another tenant exists', async () => {
    const { service, transaction } = createTransactionalService();
    transaction.user.findFirst.mockResolvedValue(null);

    await expect(
      service.updateAccess(
        'tenant-a',
        'user-from-tenant-b',
        { isActive: false, reason: 'Fim da colabora\u00e7\u00e3o.' },
        { userId: 'owner-a', role: UserRole.OWNER },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transaction.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-from-tenant-b', tenantId: 'tenant-a' },
      }),
    );
  });

  it('blocks self-demotion and empty access updates', async () => {
    const { service } = createTransactionalService();

    await expect(
      service.updateAccess(
        'tenant-a',
        'owner-a',
        { role: UserRole.VIEWER, reason: 'Revis\u00e3o de acessos.' },
        { userId: 'owner-a', role: UserRole.OWNER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateAccess(
        'tenant-a',
        'target-user',
        { reason: 'Revis\u00e3o sem altera\u00e7\u00f5es.' },
        { userId: 'owner-a', role: UserRole.OWNER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents an administrator from managing privileged roles', async () => {
    const { service, transaction } = createTransactionalService();
    transaction.user.findFirst.mockResolvedValue({
      ...target,
      role: UserRole.OWNER,
    });

    await expect(
      service.updateAccess(
        'tenant-a',
        'target-user',
        { isActive: false, reason: 'Revis\u00e3o administrativa.' },
        { userId: 'admin-a', role: UserRole.ADMIN },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps at least one active owner in the tenant', async () => {
    const { service, transaction } = createTransactionalService();
    transaction.user.findFirst.mockResolvedValue({
      ...target,
      role: UserRole.OWNER,
    });
    transaction.user.count.mockResolvedValue(1);

    await expect(
      service.updateAccess(
        'tenant-a',
        'target-user',
        { isActive: false, reason: 'Sa\u00edda do propriet\u00e1rio.' },
        { userId: 'owner-a', role: UserRole.OWNER },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates access and writes a tenant-scoped audit record atomically', async () => {
    const { service, transaction } = createTransactionalService();

    const result = await service.updateAccess(
      'tenant-a',
      'target-user',
      { role: UserRole.VIEWER, reason: 'Fun\u00e7\u00e3o revista pelo propriet\u00e1rio.' },
      { userId: 'owner-a', role: UserRole.OWNER },
    );

    expect(transaction.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'target-user' },
        data: { role: UserRole.VIEWER, isActive: true },
      }),
    );
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-a',
        userId: 'owner-a',
        action: 'USER_ACCESS_UPDATED',
        entityId: 'target-user',
        newData: expect.objectContaining({
          role: UserRole.VIEWER,
          reason: 'Fun\u00e7\u00e3o revista pelo propriet\u00e1rio.',
        }),
      }),
    });
    expect(result.changed).toBe(true);
  });
});
