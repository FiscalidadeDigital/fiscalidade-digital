import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserAccessDto } from './dto/update-user-access.dto';
import { UserQueryDto } from './dto/user-query.dto';

type AccessRequester = {
  userId: string;
  role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, query: UserQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      tenantId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { isActive: query.status === 'ACTIVE' } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy = {
      [query.sortBy ?? 'name']: query.sortDirection ?? 'asc',
    } as Prisma.UserOrderByWithRelationInput;

    const [total, users, tenantTotal, active, owners] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          phone: true,
          avatar: true,
          twoFactorEnabled: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.user.count({
        where: { tenantId, role: UserRole.OWNER, isActive: true },
      }),
    ]);

    return {
      data: users,
      summary: {
        total: tenantTotal,
        active,
        inactive: Math.max(0, tenantTotal - active),
        owners,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async updateAccess(
    tenantId: string,
    targetUserId: string,
    dto: UpdateUserAccessDto,
    requester: AccessRequester,
  ) {
    if (dto.role === undefined && dto.isActive === undefined) {
      throw new BadRequestException(
        'Indique a fun\u00e7\u00e3o ou o estado que pretende alterar.',
      );
    }
    if (targetUserId === requester.userId) {
      throw new BadRequestException(
        'N\u00e3o pode alterar a sua pr\u00f3pria fun\u00e7\u00e3o ou estado.',
      );
    }

    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const target = await transaction.user.findFirst({
            where: { id: targetUserId, tenantId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              updatedAt: true,
            },
          });

          if (!target) {
            throw new NotFoundException('Utilizador n\u00e3o encontrado.');
          }

          this.assertRoleChangeAllowed(target.role, dto.role, requester.role);

          const removesActiveOwner =
            target.role === UserRole.OWNER &&
            target.isActive &&
            (dto.isActive === false ||
              (dto.role !== undefined && dto.role !== UserRole.OWNER));

          if (removesActiveOwner) {
            const activeOwners = await transaction.user.count({
              where: { tenantId, role: UserRole.OWNER, isActive: true },
            });
            if (activeOwners <= 1) {
              throw new ConflictException(
                'A empresa deve manter pelo menos um propriet\u00e1rio activo.',
              );
            }
          }

          const role = dto.role ?? target.role;
          const isActive = dto.isActive ?? target.isActive;
          if (role === target.role && isActive === target.isActive) {
            return { ...target, changed: false };
          }

          const updated = await transaction.user.update({
            where: { id: target.id },
            data: { role, isActive },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              phone: true,
              avatar: true,
              twoFactorEnabled: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          await transaction.auditLog.create({
            data: {
              tenantId,
              userId: requester.userId,
              action: 'USER_ACCESS_UPDATED',
              entity: 'User',
              entityId: target.id,
              oldData: {
                role: target.role,
                isActive: target.isActive,
              },
              newData: {
                role: updated.role,
                isActive: updated.isActive,
                reason: dto.reason,
              },
            },
          });

          return { ...updated, changed: true };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException(
          'O acesso foi alterado em simult\u00e2neo. Actualize a lista e tente novamente.',
        );
      }
      throw error;
    }
  }

  private assertRoleChangeAllowed(
    targetRole: UserRole,
    requestedRole: UserRole | undefined,
    requesterRole: UserRole,
  ) {
    if (requesterRole === UserRole.OWNER) return;

    if (targetRole === UserRole.OWNER || targetRole === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas um propriet\u00e1rio pode gerir propriet\u00e1rios e administradores.',
      );
    }
    if (requestedRole === UserRole.OWNER || requestedRole === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Um administrador n\u00e3o pode atribuir fun\u00e7\u00f5es administrativas.',
      );
    }
  }
}
