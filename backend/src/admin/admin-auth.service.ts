import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { PlatformAdmin } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import {
  PlatformAdminPrincipal,
  PlatformAdminTokenPayload,
} from './admin.types';

const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const ADMIN_TOKEN_TTL = '15m';
const INVALID_CREDENTIALS = 'Credenciais inválidas.';
const DUMMY_PASSWORD_HASH =
  '$2b$12$JqK4ZqkEdBRCtVZm9HYfVeVdoJrAeZuBN6qisR7v6Q5hYGMCC.PuO';

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto, context: RequestContext) {
    const email = dto.email.trim().toLowerCase();
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      await this.recordAudit(null, 'ADMIN_LOGIN_FAILED', context, {
        reason: 'INVALID_CREDENTIALS',
        emailDigest: this.digestEmail(email),
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const now = new Date();
    if (
      !admin.isActive ||
      (admin.lockedUntil && admin.lockedUntil.getTime() > now.getTime())
    ) {
      await this.recordAudit(admin.id, 'ADMIN_LOGIN_FAILED', context, {
        reason: admin.isActive ? 'ACCOUNT_LOCKED' : 'ACCOUNT_INACTIVE',
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const passwordMatches = await bcrypt.compare(dto.password, admin.password);
    if (!passwordMatches) {
      const failedLoginAttempts = admin.failedLoginAttempts + 1;
      const lockedUntil =
        failedLoginAttempts >= MAX_FAILED_LOGINS
          ? new Date(now.getTime() + LOCK_DURATION_MS)
          : null;

      await this.prisma.$transaction([
        this.prisma.platformAdmin.update({
          where: { id: admin.id },
          data: { failedLoginAttempts, lockedUntil },
        }),
        this.prisma.platformAuditLog.create({
          data: {
            adminId: admin.id,
            action: 'ADMIN_LOGIN_FAILED',
            metadata: {
              reason: 'INVALID_CREDENTIALS',
              accountLocked: Boolean(lockedUntil),
            },
            ...this.auditContext(context),
          },
        }),
      ]);

      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const [updatedAdmin] = await this.prisma.$transaction([
      this.prisma.platformAdmin.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
        },
      }),
      this.prisma.platformAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'ADMIN_LOGIN_SUCCEEDED',
          ...this.auditContext(context),
        },
      }),
    ]);

    return this.buildSession(updatedAdmin);
  }

  async verifyAccessToken(token: string): Promise<PlatformAdminPrincipal> {
    let payload: PlatformAdminTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<PlatformAdminTokenPayload>(
        token,
        { secret: this.getAdminJwtSecret() },
      );
    } catch {
      throw new UnauthorizedException('Sessão administrativa inválida.');
    }

    if (
      payload.kind !== 'platform-admin' ||
      !payload.sub ||
      !Number.isInteger(payload.tokenVersion)
    ) {
      throw new UnauthorizedException('Sessão administrativa inválida.');
    }

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: payload.sub },
    });

    if (
      !admin ||
      !admin.isActive ||
      admin.tokenVersion !== payload.tokenVersion
    ) {
      throw new UnauthorizedException('Sessão administrativa inválida.');
    }

    return this.toPrincipal(admin);
  }

  async changePassword(
    adminId: string,
    dto: ChangeAdminPasswordDto,
    context: RequestContext,
  ) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Sessão administrativa inválida.');
    }

    const currentPasswordMatches = await bcrypt.compare(
      dto.currentPassword,
      admin.password,
    );

    if (!currentPasswordMatches) {
      await this.recordAudit(admin.id, 'ADMIN_PASSWORD_CHANGE_FAILED', context, {
        reason: 'INVALID_CURRENT_PASSWORD',
      });
      throw new BadRequestException('A palavra-passe actual está incorrecta.');
    }

    if (await bcrypt.compare(dto.newPassword, admin.password)) {
      throw new BadRequestException(
        'A nova palavra-passe deve ser diferente da palavra-passe actual.',
      );
    }

    const password = await bcrypt.hash(dto.newPassword, 12);
    const passwordChangedAt = new Date();

    const [updatedAdmin] = await this.prisma.$transaction([
      this.prisma.platformAdmin.update({
        where: { id: admin.id },
        data: {
          password,
          mustChangePassword: false,
          passwordChangedAt,
          failedLoginAttempts: 0,
          lockedUntil: null,
          tokenVersion: { increment: 1 },
        },
      }),
      this.prisma.platformAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'ADMIN_PASSWORD_CHANGED',
          ...this.auditContext(context),
        },
      }),
    ]);

    return this.buildSession(updatedAdmin);
  }

  private async buildSession(admin: PlatformAdmin) {
    const payload: PlatformAdminTokenPayload = {
      sub: admin.id,
      kind: 'platform-admin',
      tokenVersion: admin.tokenVersion,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.getAdminJwtSecret(),
      expiresIn: ADMIN_TOKEN_TTL,
    });

    return {
      access_token: accessToken,
      expires_in: 15 * 60,
      requires_password_change: admin.mustChangePassword,
      admin: this.toPrincipal(admin),
    };
  }

  private toPrincipal(admin: PlatformAdmin): PlatformAdminPrincipal {
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mustChangePassword: admin.mustChangePassword,
    };
  }

  private getAdminJwtSecret() {
    const secret = this.configService.get<string>('ADMIN_JWT_SECRET');

    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new ServiceUnavailableException(
        'A autenticação administrativa não está configurada.',
      );
    }

    return secret;
  }

  private digestEmail(email: string) {
    return createHash('sha256').update(email).digest('hex');
  }

  private auditContext(context: RequestContext) {
    return {
      ipAddress: context.ipAddress?.slice(0, 64) || null,
      userAgent: context.userAgent?.slice(0, 512) || null,
    };
  }

  private async recordAudit(
    adminId: string | null,
    action: string,
    context: RequestContext,
    metadata?: Record<string, string | boolean>,
  ) {
    await this.prisma.platformAuditLog.create({
      data: {
        adminId,
        action,
        metadata,
        ...this.auditContext(context),
      },
    });
  }
}
