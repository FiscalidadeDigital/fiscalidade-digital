import { UserRole } from '@prisma/client';

import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';

describe('SupplierController tenant paging', () => {
  const service = {
    create: jest.fn(),
    findPage: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
  } as unknown as SupplierService;
  const controller = new SupplierController(service);
  const user: CurrentUserPayload = {
    userId: 'owner-a',
    tenantId: 'tenant-a',
    email: 'owner@example.test',
    role: UserRole.OWNER,
  };

  beforeEach(() => jest.clearAllMocks());

  it('uses the authenticated tenant for paged queries', () => {
    controller.findAll(user, {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });

    expect(service.findPage).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ page: 1 }),
    );
  });
});
