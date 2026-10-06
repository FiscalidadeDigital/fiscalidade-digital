import { PrismaService } from '../prisma/prisma.service';
import { AdminPlatformService } from './admin-platform.service';

describe('AdminPlatformService', () => {
  const tenant = {
    id: 'tenant-1',
    name: 'Empresa Exemplo',
    nif: '5417123456',
    email: 'financeiro@empresa.ao',
    status: 'TRIAL',
    planType: 'FREE',
    trialEndsAt: new Date('2026-10-06T00:00:00.000Z'),
    createdAt: new Date('2026-09-29T00:00:00.000Z'),
    updatedAt: new Date('2026-09-29T00:00:00.000Z'),
    storageBaseQuotaBytes: 10_000n,
    storageAdditionalBytes: 2_000n,
    storageUsedBytes: 1_500n,
    _count: { users: 3, employees: 5, documents: 8 },
    subscriptions: [],
  };

  it('lista apenas dados operacionais e mascara identificadores do tenant', async () => {
    const prisma = {
      tenant: { count: jest.fn(), findMany: jest.fn() },
      user: {
        groupBy: jest
          .fn()
          .mockResolvedValue([{ tenantId: 'tenant-1', _count: { _all: 2 } }]),
      },
      $transaction: jest.fn().mockResolvedValue([1, [tenant]]),
    } as unknown as PrismaService;
    const service = new AdminPlatformService(prisma);

    const result = await service.listTenants({
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        nifMasked: '******3456',
        emailMasked: 'fi********@empresa.ao',
        usage: expect.objectContaining({
          activeUsers: 2,
          storageUsedBytes: '1500',
          storageQuotaBytes: '12000',
        }),
      }),
    );
    expect(result.data[0]).not.toHaveProperty('nif');
    expect(result.data[0]).not.toHaveProperty('email');
  });

  it('altera o estado e cria auditoria administrativa na mesma transacção', async () => {
    const updatedAt = new Date('2026-09-29T10:00:00.000Z');
    const tenantFindUnique = jest.fn().mockResolvedValue({
      id: tenant.id,
      name: tenant.name,
      status: 'TRIAL',
      updatedAt: tenant.updatedAt,
    });
    const tenantUpdate = jest.fn();
    const auditCreate = jest.fn();
    const prisma = {
      tenant: { findUnique: tenantFindUnique, update: tenantUpdate },
      platformAuditLog: { create: auditCreate },
      $transaction: jest.fn().mockResolvedValue([
        {
          id: tenant.id,
          name: tenant.name,
          status: 'SUSPENDED',
          updatedAt,
        },
        {},
      ]),
    } as unknown as PrismaService;
    const service = new AdminPlatformService(prisma);

    const result = await service.updateTenantStatus(
      tenant.id,
      { status: 'SUSPENDED', reason: 'Revisão operacional solicitada.' },
      { adminId: 'admin-1', ipAddress: '127.0.0.1' },
    );

    expect(tenantUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: tenant.id },
        data: { status: 'SUSPENDED' },
      }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: 'admin-1',
          action: 'TENANT_SUSPENDED',
          targetId: tenant.id,
          metadata: expect.objectContaining({
            previousStatus: 'TRIAL',
            reason: 'Revisão operacional solicitada.',
          }),
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ status: 'SUSPENDED', changed: true }),
    );
  });

  it('não expõe metadata, endereço IP ou user agent na consulta de auditoria', async () => {
    const prisma = {
      platformAuditLog: { count: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([
        1,
        [
          {
            id: 'audit-1',
            action: 'TENANT_SUSPENDED',
            targetType: 'Tenant',
            targetId: tenant.id,
            createdAt: new Date('2026-09-29T11:00:00.000Z'),
            admin: {
              id: 'admin-1',
              name: 'Administrador',
              email: 'admin@example.test',
            },
          },
        ],
      ]),
    } as unknown as PrismaService;
    const service = new AdminPlatformService(prisma);

    const result = await service.listAuditEvents({ page: 1, pageSize: 25 });

    expect(result.data[0]).not.toHaveProperty('metadata');
    expect(result.data[0]).not.toHaveProperty('ipAddress');
    expect(result.data[0]).not.toHaveProperty('userAgent');
  });
});
