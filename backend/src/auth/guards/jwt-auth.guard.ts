import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { REQUIRED_ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest(
    error: any,
    user: any,
    info: any,
    context: any,
    status?: any,
  ) {
    const authenticatedUser = super.handleRequest(
      error,
      user,
      info,
      context,
      status,
    );
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && !requiredRoles.includes(authenticatedUser.role)) {
      throw new ForbiddenException('Não tem permissão para executar esta operação.');
    }

    const method = context.switchToHttp().getRequest().method;
    const isReadOnlyMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (!requiredRoles && !isReadOnlyMethod && authenticatedUser.role === UserRole.VIEWER) {
      throw new ForbiddenException('O perfil de consulta não pode alterar dados.');
    }

    return authenticatedUser;
  }
}
