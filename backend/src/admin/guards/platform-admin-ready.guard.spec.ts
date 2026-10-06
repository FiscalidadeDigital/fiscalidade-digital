import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { PlatformAdminReadyGuard } from './platform-admin-ready.guard';

describe('PlatformAdminReadyGuard', () => {
  const guard = new PlatformAdminReadyGuard();

  function context(mustChangePassword: boolean) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          platformAdmin: { mustChangePassword },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('bloqueia o dashboard enquanto a credencial temporária não for alterada', () => {
    expect(() => guard.canActivate(context(true))).toThrow(ForbiddenException);
  });

  it('permite o acesso depois da mudança obrigatória', () => {
    expect(guard.canActivate(context(false))).toBe(true);
  });
});
