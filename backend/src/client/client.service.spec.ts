import { PrismaService } from '../prisma/prisma.service';
import { ClientService } from './client.service';

describe('ClientService paged directory', () => {
  it('scopes search, summary and pagination to one tenant', async () => {
    const findMany = jest.fn();
    const prisma = {
      client: { count: jest.fn(), findMany },
      $transaction: jest.fn().mockResolvedValue([
        1,
        [{ id: 'client-a', tenantId: 'tenant-a', name: 'Cliente A' }],
        4,
        3,
        2,
      ]),
    } as unknown as PrismaService;
    const service = new ClientService(prisma);

    const result = await service.findPage('tenant-a', {
      search: 'cliente',
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDirection: 'asc',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
        skip: 0,
        take: 20,
      }),
    );
    expect(result.summary).toEqual({ total: 4, withEmail: 3, withPhone: 2 });
  });

  it('persiste city ao criar e editar sem sair do tenant autenticado', async () => {
    const prisma = {
      client: {
        create: jest.fn().mockResolvedValue({ id: 'client-a' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'client-a', tenantId: 'tenant-a' }),
        update: jest.fn().mockResolvedValue({ id: 'client-a', city: 'Benguela' }),
      },
    } as unknown as PrismaService;
    const service = new ClientService(prisma);

    await service.create('tenant-a', { name: 'Cliente A', city: '  Luanda  ' });
    await service.update('tenant-a', 'client-a', { city: '  Benguela  ' });

    expect(prisma.client.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: 'tenant-a', city: 'Luanda' }),
    }));
    expect(prisma.client.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'client-a', tenantId: 'tenant-a' }),
    }));
    expect(prisma.client.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'client-a' }, data: expect.objectContaining({ city: 'Benguela' }),
    }));
  });
});
