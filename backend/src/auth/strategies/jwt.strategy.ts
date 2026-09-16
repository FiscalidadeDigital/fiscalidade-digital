import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  PassportStrategy,
} from '@nestjs/passport';

import {
  ConfigService,
} from '@nestjs/config';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private readonly configService: ConfigService,
  ) {
    const secret =
      configService.get<string>(
        'JWT_SECRET',
      );

    if (!secret) {
      throw new Error(
        'JWT_SECRET não está configurado. Defina JWT_SECRET no ficheiro .env.',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: secret,
    });
  }

  async validate(
    payload: JwtPayload,
  ) {
    if (
      !payload?.sub ||
      !payload?.tenantId ||
      !payload?.email ||
      !payload?.role
    ) {
      throw new UnauthorizedException(
        'Token de autenticação inválido.',
      );
    }

    return {
      userId: payload.sub,

      tenantId:
        payload.tenantId,

      email:
        payload.email,

      role:
        payload.role,
    };
  }
}