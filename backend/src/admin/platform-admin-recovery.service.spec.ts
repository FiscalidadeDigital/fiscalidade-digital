import { ForbiddenException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';
import { PlatformAdminRecoveryService } from './platform-admin-recovery.service';

describe('PlatformAdminRecoveryService', () => {
  type RecoveryAdmin = { id: string; isActive: boolean };
  type RecoveryUpdateInput = {
    where: { id: string };
    data: {
      password: string;
      mustChangePassword: boolean;
      passwordChangedAt: Date;
      failedLoginAttempts: number;
      lockedUntil: null;
      tokenVersion: { increment: number };
      isActive?: true;
    };
  };
  type RecoveryAuditInput = {
    data: {
      adminId: string;
      action: string;
      metadata: {
        sessionsInvalidated: boolean;
        accountReactivated: boolean;
      };
    };
  };
  type RecoveryTransaction = {
    platformAdmin: {
      update: jest.Mock<Promise<{ id: string }>, [RecoveryUpdateInput]>;
    };
    platformAuditLog: {
      create: jest.Mock<Promise<{ id: string }>, [RecoveryAuditInput]>;
    };
  };

  function makeFixture(
    admin: RecoveryAdmin | null = {
      id: 'admin-1',
      isActive: true,
    },
  ) {
    const transaction: RecoveryTransaction = {
      platformAdmin: {
        update: jest
          .fn<Promise<{ id: string }>, [RecoveryUpdateInput]>()
          .mockResolvedValue({ id: admin?.id ?? 'admin-1' }),
      },
      platformAuditLog: {
        create: jest
          .fn<Promise<{ id: string }>, [RecoveryAuditInput]>()
          .mockResolvedValue({ id: 'audit-1' }),
      },
    };
    const runTransaction = async (
      callback: (client: RecoveryTransaction) => Promise<unknown>,
    ) => callback(transaction);
    const prisma = {
      platformAdmin: {
        findUnique: jest
          .fn<Promise<RecoveryAdmin | null>, [unknown]>()
          .mockResolvedValue(admin),
      },
      $transaction: runTransaction,
    };

    return {
      service: new PlatformAdminRecoveryService(
        prisma as unknown as PrismaService,
      ),
      prisma,
      transaction,
    };
  }

  it('recovers an existing account, invalidates its sessions and audits the action', async () => {
    const { service, transaction } = makeFixture();

    await expect(
      service.recover({
        email: 'admin@example.test',
        passwordHash: 'new-stored-password-value',
        reactivate: false,
      }),
    ).resolves.toEqual({ id: 'admin-1' });

    const update = transaction.platformAdmin.update.mock.calls[0]?.[0];
    expect(update?.where).toEqual({ id: 'admin-1' });
    expect(update?.data.mustChangePassword).toBe(true);
    expect(update?.data.failedLoginAttempts).toBe(0);
    expect(update?.data.lockedUntil).toBeNull();
    expect(update?.data.tokenVersion).toEqual({ increment: 1 });
    expect(update?.data.passwordChangedAt).toBeInstanceOf(Date);

    const audit = transaction.platformAuditLog.create.mock.calls[0]?.[0];
    expect(audit).toEqual({
      data: {
        adminId: 'admin-1',
        action: 'ADMIN_PASSWORD_RECOVERED',
        metadata: {
          sessionsInvalidated: true,
          accountReactivated: false,
        },
      },
    });
  });

  it('does not reactivate an inactive account without an explicit choice', async () => {
    const { service, transaction } = makeFixture({
      id: 'admin-1',
      isActive: false,
    });

    await expect(
      service.recover({
        email: 'admin@example.test',
        passwordHash: 'new-stored-password-value',
        reactivate: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(transaction.platformAdmin.update).not.toHaveBeenCalled();
  });

  it('requires an existing administrative account', async () => {
    const { service } = makeFixture(null);

    await expect(
      service.recover({
        email: 'missing@example.test',
        passwordHash: 'new-stored-password-value',
        reactivate: false,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reactivates only when explicitly requested', async () => {
    const { service, transaction } = makeFixture({
      id: 'admin-1',
      isActive: false,
    });

    await service.recover({
      email: 'admin@example.test',
      passwordHash: 'new-stored-password-value',
      reactivate: true,
    });

    const update = transaction.platformAdmin.update.mock.calls[0]?.[0];
    expect(update?.data.isActive).toBe(true);
  });
});
