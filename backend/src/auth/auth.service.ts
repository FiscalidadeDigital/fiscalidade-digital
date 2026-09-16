import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { ObligationsService } from '../obligations/obligations.service';

@Injectable()
export class AuthService {
  private readonly logger =
    new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly obligationsService: ObligationsService,
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
        'Email já existe.',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        dto.password,
        10,
      );

    // =====================================================
    // RETENÇÃO
    // =====================================================

    let retentionRate = 0;

    if (
      String(dto.companyType || '')
        .trim()
        .toUpperCase() ===
      'SERVICOS'
    ) {
      retentionRate = 6.5;
    }

    // =====================================================
    // REGIME
    // =====================================================

    const regime =
      String(
        dto.regime || 'GERAL',
      )
        .trim()
        .toUpperCase();

    // =====================================================
    // EMPRESA
    // =====================================================

    const tenant =
      await this.prisma.tenant.create({
        data: {
          name:
            dto.companyName,

          email:
            dto.email,

          nif:
            dto.nif,

          phone:
            dto.phone || null,

          address:
            dto.address || null,

          sector:
            dto.sector || null,

          companyType:
            dto.companyType ||
            'COMERCIO',

          employeeCount:
            Number(
              dto.employees,
            ) || 0,

          regime:
            regime as any,

          retentionRate,
        },
      });

    try {
      // ===================================================
      // UTILIZADOR OWNER
      // ===================================================

      const user =
        await this.prisma.user.create({
          data: {
            tenantId:
              tenant.id,

            name:
              dto.ownerName,

            email:
              dto.email,

            password:
              hashedPassword,

            role:
              'OWNER',
          },
        });

      // ===================================================
      // CONFIGURAÇÕES PADRÃO DA EMPRESA
      // ===================================================
      //
      // Toda empresa nova nasce com as configurações
      // necessárias para o sistema funcionar.
      //
      // Isto não cria nenhuma obrigação fiscal.
      // Apenas cria as preferências da empresa.
      // ===================================================

      await this.prisma.companySettings.upsert({
        where: {
          tenantId:
            tenant.id,
        },

        update: {},

        create: {
          tenantId:
            tenant.id,

          emailEnabled:
            true,

          smsEnabled:
            true,

          aiEnabled:
            true,

          fiscalAlertsEnabled:
            true,

          fiscalAlertDaysBefore:
            7,

          fiscalDueDateReminder:
            true,

          fiscalReminderEnabled:
            true,
        },
      });

      this.logger.log(
        [
          'CONFIGURAÇÕES DA EMPRESA CRIADAS',
          `Empresa: ${tenant.name}`,
          `Tenant: ${tenant.id}`,
          'Alertas: ATIVOS',
          'E-mail: ATIVO',
        ].join(' | '),
      );

      // ===================================================
      // OBRIGAÇÕES FISCAIS
      // ===================================================
      //
      // As obrigações continuam sendo obtidas a partir
      // do Calendário Fiscal AGT.
      //
      // IMPORTANTE:
      // O ObligationsService é responsável por garantir
      // que somente obrigações elegíveis sejam criadas.
      // ===================================================

      let obligationsResult:
        | any
        | null = null;

      try {
        obligationsResult =
          await this.obligationsService.syncCompany(
            tenant.id,
          );

        this.logger.log(
          [
            'OBRIGAÇÕES FISCAIS SINCRONIZADAS',
            `Empresa: ${tenant.name}`,
            `NIF: ${tenant.nif}`,
            `Regime: ${tenant.regime}`,
            `Ano: ${obligationsResult?.year ?? new Date().getFullYear()}`,
            `Regras AGT: ${obligationsResult?.calendarRules ?? 0}`,
            `Criadas: ${obligationsResult?.created ?? 0}`,
            `Atualizadas: ${obligationsResult?.updated ?? 0}`,
            `Atrasadas: ${obligationsResult?.late ?? 0}`,
          ].join(' | '),
        );
      } catch (error) {
        this.logger.error(
          `Erro ao sincronizar obrigações da empresa ${tenant.name}.`,
          error instanceof Error
            ? error.stack
            : String(error),
        );

        obligationsResult = {
          success:
            false,

          created:
            0,

          updated:
            0,

          late:
            0,

          year:
            new Date().getFullYear(),

          calendarRules:
            0,

          message:
            'Empresa criada com sucesso. As obrigações fiscais serão sincronizadas posteriormente.',
        };
      }

      // ===================================================
      // JWT
      // ===================================================

      const accessToken =
        await this.jwtService.signAsync({
          sub:
            user.id,

          tenantId:
            tenant.id,

          email:
            user.email,

          role:
            user.role,
        });

      // ===================================================
      // RESPOSTA
      // =====================================================

      return {
        message:
          'Empresa criada com sucesso.',

        access_token:
          accessToken,

        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          tenantId:
            user.tenantId,
        },

        tenant: {
          id:
            tenant.id,

          name:
            tenant.name,

          nif:
            tenant.nif,

          email:
            tenant.email,

          phone:
            tenant.phone,

          address:
            tenant.address,

          sector:
            tenant.sector,

          regime:
            tenant.regime,

          retentionRate:
            tenant.retentionRate,

          companyType:
            tenant.companyType,

          employeeCount:
            tenant.employeeCount,

          status:
            tenant.status,

          planType:
            tenant.planType,

          trialEndsAt:
            tenant.trialEndsAt,
        },

        companySettings: {
          created:
            true,

          fiscalAlertsEnabled:
            true,

          fiscalAlertDaysBefore:
            7,

          fiscalDueDateReminder:
            true,

          fiscalReminderEnabled:
            true,

          emailEnabled:
            true,
        },

        obligations: {
          automatic:
            true,

          created:
            obligationsResult?.created ??
            0,

          updated:
            obligationsResult?.updated ??
            0,

          late:
            obligationsResult?.late ??
            0,

          year:
            obligationsResult?.year ??
            new Date().getFullYear(),

          source:
            'Calendário Fiscal AGT',
        },
      };
    } catch (error) {
      // ===================================================
      // ROLLBACK DA EMPRESA
      // ===================================================

      try {
        await this.prisma.tenant.delete({
          where: {
            id:
              tenant.id,
          },
        });
      } catch (rollbackError) {
        this.logger.error(
          'Falha ao remover empresa após erro no registo.',
          rollbackError instanceof Error
            ? rollbackError.stack
            : String(rollbackError),
        );
      }

      throw error;
    }
  }

  // =====================================================
  // LOGIN
  // =====================================================

  async login(dto: any) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          email:
            dto.email,
        },

        include: {
          tenant: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Credenciais inválidas.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Esta conta está desativada.',
      );
    }

    const passwordMatch =
      await bcrypt.compare(
        dto.password,
        user.password,
      );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        'Credenciais inválidas.',
      );
    }

    // ===================================================
    // ATUALIZAR ÚLTIMO LOGIN
    // ===================================================

    const lastLogin =
      new Date();

    await this.prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
        lastLogin,
      },
    });

    // ===================================================
    // GARANTIR CONFIGURAÇÕES
    // ===================================================
    //
    // Empresas antigas que foram criadas antes desta
    // implementação também passam a ter CompanySettings.
    // ===================================================

    await this.prisma.companySettings.upsert({
      where: {
        tenantId:
          user.tenantId,
      },

      update: {},

      create: {
        tenantId:
          user.tenantId,

        emailEnabled:
          true,

        smsEnabled:
          true,

        aiEnabled:
          true,

        fiscalAlertsEnabled:
          true,

        fiscalAlertDaysBefore:
          7,

        fiscalDueDateReminder:
          true,

        fiscalReminderEnabled:
          true,
      },
    });

    // ===================================================
    // JWT
    // ===================================================

    const accessToken =
      await this.jwtService.signAsync({
        sub:
          user.id,

        tenantId:
          user.tenantId,

        email:
          user.email,

        role:
          user.role,
      });

    // ===================================================
    // RESPOSTA
    // ===================================================

    return {
      message:
        'Login realizado com sucesso.',

      access_token:
        accessToken,

      user: {
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        tenantId:
          user.tenantId,

        isActive:
          user.isActive,

        lastLogin,
      },

      tenant: {
        id:
          user.tenant.id,

        name:
          user.tenant.name,

        nif:
          user.tenant.nif,

        email:
          user.tenant.email,

        phone:
          user.tenant.phone,

        address:
          user.tenant.address,

        sector:
          user.tenant.sector,

        regime:
          user.tenant.regime,

        retentionRate:
          user.tenant.retentionRate,

        companyType:
          user.tenant.companyType,

        employeeCount:
          user.tenant.employeeCount,

        status:
          user.tenant.status,

        planType:
          user.tenant.planType,

        trialEndsAt:
          user.tenant.trialEndsAt,
      },
    };
  }

  // =====================================================
  // UTILIZADOR AUTENTICADO
  // =====================================================

  async getCurrentUser(
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },

        include: {
          tenant: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Utilizador autenticado não encontrado.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Esta conta está desativada.',
      );
    }

    // ===================================================
    // GARANTIR CONFIGURAÇÕES DA EMPRESA
    // ===================================================

    await this.prisma.companySettings.upsert({
      where: {
        tenantId:
          user.tenantId,
      },

      update: {},

      create: {
        tenantId:
          user.tenantId,

        emailEnabled:
          true,

        smsEnabled:
          true,

        aiEnabled:
          true,

        fiscalAlertsEnabled:
          true,

        fiscalAlertDaysBefore:
          7,

        fiscalDueDateReminder:
          true,

        fiscalReminderEnabled:
          true,
      },
    });

    return {
      user: {
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        tenantId:
          user.tenantId,

        isActive:
          user.isActive,

        lastLogin:
          user.lastLogin,
      },

      tenant: {
        id:
          user.tenant.id,

        name:
          user.tenant.name,

        nif:
          user.tenant.nif,

        email:
          user.tenant.email,

        phone:
          user.tenant.phone,

        address:
          user.tenant.address,

        sector:
          user.tenant.sector,

        companyType:
          user.tenant.companyType,

        employeeCount:
          user.tenant.employeeCount,

        regime:
          user.tenant.regime,

        retentionRate:
          user.tenant.retentionRate,

        status:
          user.tenant.status,

        planType:
          user.tenant.planType,

        trialEndsAt:
          user.tenant.trialEndsAt,
      },
    };
  }
}