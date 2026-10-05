import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { FiscalRegime, TaxType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';
import { FiscalEnrollmentController } from './fiscal-enrollment.controller';

const contextFor = (method: string, handler: unknown) => ({
  getHandler: () => handler,
  getClass: () => FiscalEnrollmentController,
  switchToHttp: () => ({ getRequest: () => ({ method }) }),
}) as any;

describe('FiscalEnrollmentController', () => {
  const setup = () => {
    const service = { list: jest.fn(), create: jest.fn(), end: jest.fn() };
    return { service, controller: new FiscalEnrollmentController(service as any) };
  };
  const guardFor = (roles?: UserRole[]) => new JwtAuthGuard({ getAllAndOverride: jest.fn().mockReturnValue(roles) } as unknown as Reflector);
  const request = { user: { tenantId: 'tenant-authenticated' } } as any;
  const payload = { taxType: TaxType.IVA, regime: FiscalRegime.GERAL, validFrom: '2026-01-01', tenantId: 'tenant-other' } as any;

  it('uses authenticated tenant for GET, create and logical end, never tenantId from client input', async () => {
    const { controller, service } = setup();
    await controller.list(request);
    await controller.create(request, payload);
    await controller.end(request, 'assignment-a', { validUntil: '2026-06-30' });
    expect(service.list).toHaveBeenCalledWith('tenant-authenticated');
    expect(service.create).toHaveBeenCalledWith('tenant-authenticated', payload);
    expect(service.end).toHaveBeenCalledWith('tenant-authenticated', 'assignment-a', '2026-06-30');
  });

  it.each([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT])('%s can read and write fiscal enrollments', (role) => {
    const guard = guardFor([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(guard.handleRequest(null, { role }, null, contextFor('POST', FiscalEnrollmentController.prototype.create))).toEqual({ role });
    expect(guard.handleRequest(null, { role }, null, contextFor('PATCH', FiscalEnrollmentController.prototype.end))).toEqual({ role });
  });

  it('permits VIEWER read access but blocks fiscal enrollment writes', () => {
    const reader = guardFor([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER]);
    expect(reader.handleRequest(null, { role: UserRole.VIEWER }, null, contextFor('GET', FiscalEnrollmentController.prototype.list))).toEqual({ role: UserRole.VIEWER });
    const writer = guardFor([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(() => writer.handleRequest(null, { role: UserRole.VIEWER }, null, contextFor('POST', FiscalEnrollmentController.prototype.create))).toThrow(ForbiddenException);
    expect(() => writer.handleRequest(null, { role: UserRole.VIEWER }, null, contextFor('PATCH', FiscalEnrollmentController.prototype.end))).toThrow(ForbiddenException);
  });

  it('blocks unauthenticated access and exposes the intended guard and policies', () => {
    const guard = guardFor([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER]);
    expect(() => guard.handleRequest(null, null, null, contextFor('GET', FiscalEnrollmentController.prototype.list))).toThrow(UnauthorizedException);
    expect(Reflect.getMetadata(GUARDS_METADATA, FiscalEnrollmentController)).toContain(JwtAuthGuard);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, FiscalEnrollmentController.prototype.list)).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER]);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, FiscalEnrollmentController.prototype.create)).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, FiscalEnrollmentController.prototype.end)).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
  });
});
