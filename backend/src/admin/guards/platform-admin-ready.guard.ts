import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { PlatformAdminRequest } from './platform-admin-auth.guard';

@Injectable()
export class PlatformAdminReadyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<PlatformAdminRequest>();

    if (!request.platformAdmin || request.platformAdmin.mustChangePassword) {
      throw new ForbiddenException({
        code: 'ADMIN_PASSWORD_CHANGE_REQUIRED',
        message: 'É necessário alterar a palavra-passe temporária.',
      });
    }

    return true;
  }
}
