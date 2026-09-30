import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from './product.service';

describe('ProductService paged catalog', () => {
  it('filters and counts within the authenticated tenant', async () => {
    const count = jest.fn();
    const findMany = jest.fn();
    const prisma = {
      product: { count, findMany },
      $transaction: jest.fn().mockResolvedValue([
        1,
        [{ id: 'product-a', tenantId: 'tenant-a', name: 'Consultoria' }],
        3,
        1,
      ]),
    } as unknown as PrismaService;
    const service = new ProductService(prisma);

    const result = await service.findPage('tenant-a', {
      search: 'consult',
      status: 'ACTIVE',
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDirection: 'asc',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a', isActive: true }),
        skip: 0,
        take: 20,
      }),
    );
    expect(result.summary).toEqual({ total: 4, active: 3, inactive: 1 });
    expect(result.pagination).toEqual(
      expect.objectContaining({ page: 1, total: 1, totalPages: 1 }),
    );
  });
});
