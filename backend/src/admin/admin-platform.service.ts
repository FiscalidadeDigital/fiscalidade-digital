import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditQueryDto } from './dto/admin-audit-query.dto';
import { AdminTenantQueryDto } from './dto/admin-tenant-query.dto';
import { UpdateAdminTenantStatusDto } from './dto/update-admin-tenant-status.dto';

type AdminActionContext = {
  adminId: string;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AdminPlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(query: AdminTenantQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.TenantWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.planType ? { planType: query.planType } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { nif: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDirection = query.sortDirection ?? 'desc';
    const orderBy = {
      [sortBy]: sortDirection,
    } as Prisma.TenantOrderByWithRelationInput;

    const [total, tenants] = await this.prisma.$transaction([
      this.prisma.tenant.count({ where }),
      this.prisma.tenant.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          nif: true,
          email: true,
          status: true,
          planType: true,
          trialEndsAt: true,
          createdAt: true,
          updatedAt: true,
          storageBaseQuotaBytes: true,
          storageAdditionalBytes: true,
          storageUsedBytes: true,
          _count: {
            select: {
              users: true,
              employees: true,
              documents: true,
            },
          },
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              planType: true,
              paymentStatus: true,
              isActive: true,
              startsAt: true,
              endsAt: true,
            },
          },
        },
      }),
    ]);

    const tenantIds = tenants.map((tenant) => tenant.id);
    const activeUserGroups = tenantIds.length
      ? await this.prisma.user.groupBy({
          by: ['tenantId'],
          where: { tenantId: { in: tenantIds }, isActive: true },
          _count: { _all: true },
        })
      : [];
    const activeUsersByTenant = new Map(
      activeUserGroups.map((group) => [group.tenantId, group._count._all]),
    );

    return {
      data: tenants.map((tenant) => {
        const effectiveQuota =
          tenant.storageBaseQuotaBytes === null
            ? null
            : tenant.storageBaseQuotaBytes + tenant.storageAdditionalBytes;

        return {
          id: tenant.id,
          name: tenant.name,
          nifMasked: this.maskIdentifier(tenant.nif),
          emailMasked: this.maskEmail(tenant.email),
          status: tenant.status,
          planType: tenant.planType,
          trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
          usage: {
            users: tenant._count.users,
            activeUsers: activeUsersByTenant.get(tenant.id) ?? 0,
            employees: tenant._count.employees,
            documents: tenant._count.documents,
            storageUsedBytes: tenant.storageUsedBytes.toString(),
            storageQuotaBytes: effectiveQuota?.toString() ?? null,
          },
          subscription: tenant.subscriptions[0]
            ? {
                planType: tenant.subscriptions[0].planType,
                paymentStatus: tenant.subscriptions[0].paymentStatus,
                isActive: tenant.subscriptions[0].isActive,
                startsAt: tenant.subscriptions[0].startsAt.toISOString(),
                endsAt: tenant.subscriptions[0].endsAt.toISOString(),
              }
            : null,
        };
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async updateTenantStatus(
    tenantId: string,
    dto: UpdateAdminTenantStatusDto,
    context: AdminActionContext,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, status: true, updatedAt: true },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    if (tenant.status === dto.status) {
      return {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        updatedAt: tenant.updatedAt.toISOString(),
        changed: false,
      };
    }

    const [updatedTenant] = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: dto.status },
        select: { id: true, name: true, status: true, updatedAt: true },
      }),
      this.prisma.platformAuditLog.create({
        data: {
          adminId: context.adminId,
          action:
            dto.status === 'SUSPENDED'
              ? 'TENANT_SUSPENDED'
              : 'TENANT_REACTIVATED',
          targetType: 'Tenant',
          targetId: tenant.id,
          metadata: {
            previousStatus: tenant.status,
            newStatus: dto.status,
            reason: dto.reason,
          },
          ipAddress: context.ipAddress?.slice(0, 64) || null,
          userAgent: context.userAgent?.slice(0, 512) || null,
        },
      }),
    ]);

    return {
      id: updatedTenant.id,
      name: updatedTenant.name,
      status: updatedTenant.status,
      updatedAt: updatedTenant.updatedAt.toISOString(),
      changed: true,
    };
  }

  async listAuditEvents(query: AdminAuditQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const where: Prisma.PlatformAuditLogWhereInput = {
      ...(query.action
        ? { action: { contains: query.action, mode: 'insensitive' } }
        : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [total, events] = await this.prisma.$transaction([
      this.prisma.platformAuditLog.count({ where }),
      this.prisma.platformAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      data: events.map((event) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  private maskIdentifier(value: string) {
    if (value.length <= 4) return '*'.repeat(value.length);
    return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
  }

  private maskEmail(value: string) {
    const [localPart, domain] = value.split('@');
    if (!domain) return '***';
    const visible = localPart.slice(0, Math.min(2, localPart.length));
    return `${visible}${'*'.repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
  }
}
