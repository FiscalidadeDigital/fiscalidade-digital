import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AdminAuthService } from '../admin-auth.service';
import type { PlatformAdminPrincipal } from '../admin.types';

export type PlatformAdminRequest = Request & {
  platformAdmin?: PlatformAdminPrincipal;
};

@Injectable()
export class PlatformAdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AdminAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<PlatformAdminRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Sessão administrativa em falta.');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Sessão administrativa em falta.');
    }

    request.platformAdmin = await this.authService.verifyAccessToken(token);
    return true;
  }
}
