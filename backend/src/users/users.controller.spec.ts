import { UserRole } from '@prisma/client';

import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController authorization', () => {
  const usersService = {
    list: jest.fn(),
    updateAccess: jest.fn(),
  } as unknown as UsersService;
  const controller = new UsersController(usersService);
  const owner: CurrentUserPayload = {
    userId: 'owner-a',
    tenantId: 'tenant-a',
    email: 'owner@example.test',
    role: UserRole.OWNER,
  };

  beforeEach(() => jest.clearAllMocks());

  it.each(['list', 'updateAccess'] as const)(
    'allows only owners and administrators to call %s',
    (method) => {
      expect(
        Reflect.getMetadata(REQUIRED_ROLES_KEY, UsersController.prototype[method]),
      ).toEqual([UserRole.OWNER, UserRole.ADMIN]);
    },
  );

  it('uses the tenant and user identity from the authenticated principal', () => {
    controller.list(owner, {
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDirection: 'asc',
    });
    controller.updateAccess(owner, 'f11da335-6f91-44db-b7a2-cf971bc664d2', {
      isActive: false,
      reason: 'Fim da colabora\u00e7\u00e3o com a empresa.',
    });

    expect(usersService.list).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ page: 1 }),
    );
    expect(usersService.updateAccess).toHaveBeenCalledWith(
      'tenant-a',
      'f11da335-6f91-44db-b7a2-cf971bc664d2',
      expect.objectContaining({ isActive: false }),
      { userId: 'owner-a', role: UserRole.OWNER },
    );
  });
});
