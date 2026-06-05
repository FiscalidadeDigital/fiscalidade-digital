import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // =====================================================
  // REGISTER
  // =====================================================

  async register(dto: any) {
    const exists =
      await this.prisma.user.findFirst({
        where: {
          email: dto.email,
        },
      });

    if (exists) {
      throw new BadRequestException(
        'Email já existe',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        dto.password,
        10,
      );

    let retentionRate = 0;

    if (
      dto.companyType === 'SERVICOS'
    ) {
      retentionRate = 6.5;
    }

    const tenant =
      await this.prisma.tenant.create({
        data: {
          name: dto.companyName,

          email: dto.email,

          nif: dto.nif,

          phone: dto.phone || null,

          address:
            dto.address || null,

          sector:
            dto.sector || null,

          companyType:
            dto.companyType ||
            'COMERCIO',

          employees:
            Number(
              dto.employees,
            ) || 0,

          regime:
            dto.regime || 'GERAL',

          retentionRate,
        },
      });

    const user =
      await this.prisma.user.create({
        data: {
          tenantId: tenant.id,

          name: dto.ownerName,

          email: dto.email,

          password:
            hashedPassword,

          role: 'OWNER',
        },
      });

    const accessToken =
      await this.jwtService.signAsync({
        sub: user.id,

        tenantId: tenant.id,

        email: user.email,

        role: user.role,
      });

    return {
      message:
        'Empresa criada com sucesso',

      access_token:
        accessToken,

      user: {
        id: user.id,

        name: user.name,

        email: user.email,

        role: user.role,
      },

      tenant: {
        id: tenant.id,

        name: tenant.name,

        nif: tenant.nif,

        regime:
          tenant.regime,

        retentionRate:
          tenant.retentionRate,

        companyType:
          tenant.companyType,
      },
    };
  }

  // =====================================================
  // LOGIN
  // =====================================================

  async login(dto: any) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          email: dto.email,
        },

        include: {
          tenant: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Credenciais inválidas',
      );
    }

    const passwordMatch =
      await bcrypt.compare(
        dto.password,
        user.password,
      );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        'Credenciais inválidas',
      );
    }

    const accessToken =
      await this.jwtService.signAsync({
        sub: user.id,

        tenantId:
          user.tenantId,

        email: user.email,

        role: user.role,
      });

    return {
      message:
        'Login realizado com sucesso',

      access_token:
        accessToken,

      user: {
        id: user.id,

        name: user.name,

        email: user.email,

        role: user.role,
      },

      tenant: {
        id: user.tenant.id,

        name:
          user.tenant.name,

        nif:
          user.tenant.nif,

        regime:
          user.tenant.regime,

        retentionRate:
          user.tenant
            .retentionRate,

        companyType:
          user.tenant
            .companyType,
      },
    };
  }
}