import { PrismaService } from '../prisma/prisma.service';
import { SupplierService } from './supplier.service';

describe('SupplierService paged directory', () => {
  it('scopes search, summary and pagination to one tenant', async () => {
    const findMany = jest.fn();
    const prisma = {
      supplier: { count: jest.fn(), findMany },
      $transaction: jest.fn().mockResolvedValue([
        2,
        [{ id: 'supplier-a', tenantId: 'tenant-a', name: 'Fornecedor A' }],
        5,
        4,
        3,
      ]),
    } as unknown as PrismaService;
    const service = new SupplierService(prisma);

    const result = await service.findPage('tenant-a', {
      search: 'fornecedor',
      page: 2,
      pageSize: 1,
      sortBy: 'name',
      sortDirection: 'asc',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
        skip: 1,
        take: 1,
      }),
    );
    expect(result.summary).toEqual({ total: 5, withEmail: 4, withPhone: 3 });
    expect(result.pagination.totalPages).toBe(2);
  });
});
