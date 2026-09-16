import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import { Request } from 'express';

// =====================================================
// UTILIZADOR AUTENTICADO
// =====================================================

export interface CurrentUserPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

// =====================================================
// REQUEST AUTENTICADO
// =====================================================

export interface AuthenticatedRequest
  extends Request {
  user: CurrentUserPayload;
}

// =====================================================
// DECORATOR
// =====================================================

export const CurrentUser =
  createParamDecorator(
    (
      _data: unknown,
      ctx: ExecutionContext,
    ): CurrentUserPayload => {
      const request =
        ctx
          .switchToHttp()
          .getRequest<AuthenticatedRequest>();

      return request.user;
    },
  );