import { UserRole } from '@prisma/client';

import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

describe('InvoiceController tenant paging', () => {
  const service = {
    findPage: jest.fn(),
    findAll: jest.fn(),
  } as unknown as InvoiceService;
  const controller = new InvoiceController(service);
  const user: CurrentUserPayload = {
    userId: 'owner-a',
    tenantId: 'tenant-a',
    email: 'owner@example.test',
    role: UserRole.OWNER,
  };

  beforeEach(() => jest.clearAllMocks());

  it('uses the authenticated tenant for paged list requests', () => {
    controller.findAll(user, {
      search: 'FT-2026',
      status: 'PENDING',
      page: 1,
      pageSize: 20,
      sortBy: 'issuedAt',
      sortDirection: 'desc',
    });

    expect(service.findPage).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ page: 1, status: 'PENDING' }),
    );
  });
});
