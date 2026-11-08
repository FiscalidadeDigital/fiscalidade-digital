import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type PlatformAdminRecoveryInput = {
  email: string;
  passwordHash: string;
  reactivate: boolean;
};

/**
 * Local-only recovery primitive. It intentionally has no HTTP controller: the
 * command that invokes it requires an explicit confirmation in the host
 * environment and writes an immutable administrative audit event.
 */
@Injectable()
export class PlatformAdminRecoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async recover({
    email,
    passwordHash,
    reactivate,
  }: PlatformAdminRecoveryInput) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    if (!admin) {
      throw new NotFoundException(
        'A conta administrativa indicada nao foi encontrada.',
      );
    }

    if (!admin.isActive && !reactivate) {
      throw new ForbiddenException(
        'A conta administrativa esta inactiva. Confirme explicitamente a reactivacao para a recuperar.',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      const recovered = await transaction.platformAdmin.update({
        where: { id: admin.id },
        data: {
          password: passwordHash,
          mustChangePassword: true,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
          tokenVersion: { increment: 1 },
          ...(reactivate ? { isActive: true } : {}),
        },
        select: { id: true },
      });

      await transaction.platformAuditLog.create({
        data: {
          adminId: recovered.id,
          action: 'ADMIN_PASSWORD_RECOVERED',
          metadata: {
            sessionsInvalidated: true,
            accountReactivated: reactivate && !admin.isActive,
          },
        },
      });

      return recovered;
    });
  }
}
