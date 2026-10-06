import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';
import { ObligationsController } from '../obligations/obligations.controller';
import { FiscalSituationController } from './fiscal-situation.controller';

const contextFor = (method: string, handler: unknown, controller: unknown) =>
  ({
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ method }) }),
  }) as any;

describe('Fiscal HTTP RBAC', () => {
  const guardFor = (roles?: UserRole[]) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    } as unknown as Reflector;
    return new JwtAuthGuard(reflector);
  };

  it('blocks an unauthenticated request before fiscal read access', () => {
    const guard = guardFor([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER]);

    expect(() => guard.handleRequest(null, null, null, contextFor('GET', FiscalSituationController.prototype.get, FiscalSituationController))).toThrow(UnauthorizedException);
  });

  it('blocks VIEWER from obligation generation and permits ADMIN', async () => {
    const guard = guardFor([UserRole.OWNER, UserRole.ADMIN]);
    const service = { sync: jest.fn().mockResolvedValue({}) };
    const controller = new ObligationsController(service as any);
    const context = contextFor('POST', ObligationsController.prototype.sync, ObligationsController);

    expect(() => guard.handleRequest(null, { role: UserRole.VIEWER }, null, context)).toThrow(ForbiddenException);
    expect(guard.handleRequest(null, { role: UserRole.ADMIN }, null, context)).toEqual({ role: UserRole.ADMIN });

    await controller.sync({ user: { tenantId: 'tenant-auth' } } as any);
    expect(service.sync).toHaveBeenCalledWith('tenant-auth');
  });

  it('uses JwtAuthGuard, allows VIEWER read access, and derives fiscal-situation tenant from the request', async () => {
    const service = { get: jest.fn().mockResolvedValue({}) };
    const controller = new FiscalSituationController(service as any);
    const roles = Reflect.getMetadata(REQUIRED_ROLES_KEY, FiscalSituationController.prototype.get);
    const guards = Reflect.getMetadata(GUARDS_METADATA, FiscalSituationController);
    const guard = guardFor(roles);
    const context = contextFor('GET', FiscalSituationController.prototype.get, FiscalSituationController);

    expect(guards).toContain(JwtAuthGuard);
    expect(roles).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER]);
    expect(guard.handleRequest(null, { role: UserRole.VIEWER }, null, context)).toEqual({ role: UserRole.VIEWER });

    await controller.get({ user: { tenantId: 'tenant-auth' } } as any, '2026-10');
    expect(service.get).toHaveBeenCalledWith('tenant-auth', new Date('2026-10-01T00:00:00.000Z'));
  });
});
