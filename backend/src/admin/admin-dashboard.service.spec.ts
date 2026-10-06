import { PrismaService } from '../prisma/prisma.service';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  it('devolve apenas métricas agregadas da plataforma', async () => {
    const prisma = {
      tenant: { count: jest.fn(), aggregate: jest.fn() },
      user: { count: jest.fn() },
      employee: { count: jest.fn() },
      document: { count: jest.fn() },
      subscription: {
        groupBy: jest.fn().mockResolvedValue([
          { paymentStatus: 'PAID', _count: { _all: 2 } },
          { paymentStatus: 'PENDING', _count: { _all: 1 } },
        ]),
      },
      platformAuditLog: { findMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([
        12,
        3,
        8,
        1,
        20,
        18,
        44,
        30,
        { _sum: { storageUsedBytes: 4096n } },
        2,
        5,
        1,
        [],
      ]),
    } as unknown as PrismaService;

    const service = new AdminDashboardService(prisma);
    const result = await service.getSummary();

    expect(result.tenants).toEqual({
      total: 12,
      trial: 3,
      active: 8,
      suspended: 1,
    });
    expect(result.operations).toEqual({
      employees: 44,
      documents: 30,
      storageBytes: '4096',
    });
    expect(result.growth).toEqual({
      periodDays: 30,
      tenantsCreated: 2,
      usersCreated: 5,
    });
    expect(result.subscriptions).toEqual({
      activeRecords: 3,
      byPaymentStatus: { PAID: 2, PENDING: 1 },
    });
    expect(result.alerts).toEqual({ expiredTrials: 1 });
    expect(result).not.toHaveProperty('tenant');
  });
});
