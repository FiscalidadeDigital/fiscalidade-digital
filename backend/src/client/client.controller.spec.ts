import { UserRole } from '@prisma/client';

import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

describe('ClientController tenant paging', () => {
  const service = {
    create: jest.fn(),
    findPage: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
  } as unknown as ClientService;
  const controller = new ClientController(service);
  const user: CurrentUserPayload = {
    userId: 'owner-a',
    tenantId: 'tenant-a',
    email: 'owner@example.test',
    role: UserRole.OWNER,
  };

  beforeEach(() => jest.clearAllMocks());

  it('uses the authenticated tenant for paged queries', () => {
    controller.findAll(user, {
      search: 'ana',
      page: 2,
      pageSize: 20,
      sortBy: 'name',
      sortDirection: 'asc',
    });

    expect(service.findPage).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ page: 2, search: 'ana' }),
    );
  });
});
