import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { REQUIRED_ROLES_KEY } from '../src/common/decorators/roles.decorator';

describe('Authenticated role policy', () => {
  const createContext = (method: string) => ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ method }),
    }),
  }) as any;

  it('allows VIEWER reads and rejects writes', () => {
    const reflector = { getAllAndOverride: () => undefined } as any;
    const guard = new JwtAuthGuard(reflector);

    expect(
      guard.handleRequest(null, { role: UserRole.VIEWER }, null, createContext('GET')),
    ).toEqual({ role: UserRole.VIEWER });
    expect(() =>
      guard.handleRequest(null, { role: UserRole.VIEWER }, null, createContext('PATCH')),
    ).toThrow(ForbiddenException);
  });

  it('applies explicit roles to sensitive operations', () => {
    const reflector = {
      getAllAndOverride: (key: string) =>
        key === REQUIRED_ROLES_KEY ? [UserRole.OWNER, UserRole.ADMIN] : undefined,
    } as any;
    const guard = new JwtAuthGuard(reflector);

    expect(() =>
      guard.handleRequest(null, { role: UserRole.ACCOUNTANT }, null, createContext('PATCH')),
    ).toThrow(ForbiddenException);
    expect(
      guard.handleRequest(null, { role: UserRole.ADMIN }, null, createContext('PATCH')),
    ).toEqual({ role: UserRole.ADMIN });
  });
});
