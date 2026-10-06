import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [
      totalTenants,
      trialTenants,
      activeTenants,
      suspendedTenants,
      totalUsers,
      activeUsers,
      totalEmployees,
      totalDocuments,
      storage,
      tenantsCreatedLast30Days,
      usersCreatedLast30Days,
      expiredTrials,
      recentAuditEvents,
    ] = await this.prisma.$transaction([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'TRIAL' } }),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.employee.count(),
      this.prisma.document.count(),
      this.prisma.tenant.aggregate({
        _sum: { storageUsedBytes: true },
      }),
      this.prisma.tenant.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.tenant.count({
        where: { status: 'TRIAL', trialEndsAt: { lt: now } },
      }),
      this.prisma.platformAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          admin: { select: { name: true } },
        },
      }),
    ]);

    const subscriptionsByStatus = await this.prisma.subscription.groupBy({
      by: ['paymentStatus'],
      where: { isActive: true },
      _count: { _all: true },
    });

    const subscriptionCounts = Object.fromEntries(
      subscriptionsByStatus.map((entry) => [
        entry.paymentStatus,
        entry._count._all,
      ]),
    );

    return {
      generatedAt: now.toISOString(),
      tenants: {
        total: totalTenants,
        trial: trialTenants,
        active: activeTenants,
        suspended: suspendedTenants,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      operations: {
        employees: totalEmployees,
        documents: totalDocuments,
        storageBytes: (storage._sum.storageUsedBytes ?? 0n).toString(),
      },
      growth: {
        periodDays: 30,
        tenantsCreated: tenantsCreatedLast30Days,
        usersCreated: usersCreatedLast30Days,
      },
      subscriptions: {
        activeRecords: subscriptionsByStatus.reduce(
          (total, entry) => total + entry._count._all,
          0,
        ),
        byPaymentStatus: subscriptionCounts,
      },
      alerts: {
        expiredTrials,
      },
      recentAuditEvents: recentAuditEvents.map((event) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }
}
