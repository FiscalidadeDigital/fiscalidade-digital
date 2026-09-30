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

import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret =
      configService.get<string>(
        'JWT_SECRET',
      );

    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error(
        'JWT_SECRET não está configurado correctamente (mínimo de 32 bytes).',
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
    if (!payload?.sub) {
      throw new UnauthorizedException(
        'Token de autenticação inválido.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        isActive: true,
        tenant: {
          select: { status: true },
        },
      },
    });

    if (
      !user ||
      !user.isActive ||
      user.tenant.status === 'SUSPENDED'
    ) {
      throw new UnauthorizedException(
        'A sessão não é válida.',
      );
    }

    return {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
  }
}
