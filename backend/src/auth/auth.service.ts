import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

import { calculateTrialEnd } from '../common/config/trial-policy';
import { MailService } from '../mail/mail.service';
import { AuthChallengePurpose, LegalDocumentType, Prisma, TaxRegimeAssignmentStatus, UserRole } from '@prisma/client';
import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';

@Injectable()
export class AuthService {
  private static readonly TERMS_VERSION = '2026-10-05';
  private static readonly PRIVACY_VERSION = '2026-10-05';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly fiscalEnrollmentService: FiscalEnrollmentService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashSecret(secret: string) {
    return createHash('sha256').update(secret).digest('hex');
  }

  private newOtp() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async issueChallenge(
    email: string,
    purpose: AuthChallengePurpose,
    links: { userId?: string; pendingRegistrationId?: string },
  ) {
    const now = new Date();
    const latest = await this.prisma.authChallenge.findFirst({
      where: { email, purpose, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (latest && now.getTime() - latest.lastSentAt.getTime() < 60_000) {
      throw new HttpException('Aguarde antes de pedir um novo código.', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.prisma.authChallenge.updateMany({
      where: { email, purpose, usedAt: null },
      data: { usedAt: now },
    });
    const code = this.newOtp();
    await this.prisma.authChallenge.create({
      data: {
        email,
        purpose,
        codeHash: this.hashSecret(code),
        expiresAt: new Date(now.getTime() + 10 * 60_000),
        lastSentAt: now,
        ...links,
      },
    });
    return code;
  }

  private async consumeChallenge(
    email: string,
    purpose: AuthChallengePurpose,
    code: string,
  ) {
    const challenge = await this.prisma.authChallenge.findFirst({
      where: { email, purpose, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    if (!challenge || challenge.expiresAt <= now || challenge.attemptCount >= 5) {
      throw new BadRequestException('O código é inválido ou expirou.');
    }
    if (challenge.codeHash !== this.hashSecret(code)) {
      await this.prisma.authChallenge.updateMany({
        where: { id: challenge.id, usedAt: null, attemptCount: { lt: 5 } },
        data: { attemptCount: { increment: 1 } },
      });
      throw new BadRequestException('O código é inválido ou expirou.');
    }
    const claimed = await this.prisma.authChallenge.updateMany({
      where: { id: challenge.id, usedAt: null, expiresAt: { gt: now }, attemptCount: { lt: 5 } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) throw new BadRequestException('O código é inválido ou expirou.');
    return challenge;
  }

  /** Account creation intentionally precedes company/fiscal onboarding. */
  async registerAccount(dto: {
    name: string; email: string; password: string; confirmPassword: string;
    phone?: string; acceptTerms: boolean; acceptPrivacyPolicy: boolean;
  }) {
    const email = this.normalizeEmail(dto.email);
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('As palavras-passe não coincidem.');
    }
    const [existingUser, existingPending] = await Promise.all([
      this.prisma.user.findFirst({ where: { email } }),
      this.prisma.pendingRegistration.findUnique({ where: { email } }),
    ]);
    if (existingUser || existingPending) {
      throw new BadRequestException('Não foi possível criar esta conta.');
    }
    const acceptedAt = new Date();
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const pending = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.pendingRegistration.create({ data: {
        name: dto.name.trim(), email, phone: dto.phone?.trim() || null, passwordHash,
        acceptedTermsAt: acceptedAt, acceptedPrivacyAt: acceptedAt,
      } });
      await transaction.legalAcceptance.createMany({ data: [
        { documentType: LegalDocumentType.TERMS_OF_USE, version: AuthService.TERMS_VERSION, acceptedAt, pendingRegistrationId: created.id },
        { documentType: LegalDocumentType.PRIVACY_POLICY, version: AuthService.PRIVACY_VERSION, acceptedAt, pendingRegistrationId: created.id },
      ] });
      return created;
    });
    const code = await this.issueChallenge(email, AuthChallengePurpose.EMAIL_VERIFICATION, {
      pendingRegistrationId: pending.id,
    });
    await this.mailService.sendEmailVerification(email, pending.name, code);
    return { message: 'Verifique o seu email para continuar.', email };
  }

  async verifyEmail(dto: { email: string; code: string }) {
    const email = this.normalizeEmail(dto.email);
    const pending = await this.prisma.pendingRegistration.findUnique({ where: { email } });
    if (!pending) throw new BadRequestException('O código é inválido ou expirou.');
    await this.consumeChallenge(email, AuthChallengePurpose.EMAIL_VERIFICATION, dto.code);
    await this.prisma.pendingRegistration.update({
      where: { id: pending.id }, data: { emailVerifiedAt: new Date() },
    });
    const onboardingToken = await this.jwtService.signAsync(
      { sub: pending.id, purpose: 'ONBOARDING' }, { expiresIn: '30m' },
    );
    return { message: 'Email confirmado. Continue a configuração da empresa.', onboardingToken };
  }

  async resendVerification(dto: { email: string }) {
    const email = this.normalizeEmail(dto.email);
    const pending = await this.prisma.pendingRegistration.findUnique({ where: { email } });
    if (!pending || pending.emailVerifiedAt) {
      return { message: 'Se existir uma conta pendente, enviámos novas instruções.' };
    }
    const code = await this.issueChallenge(email, AuthChallengePurpose.EMAIL_VERIFICATION, {
      pendingRegistrationId: pending.id,
    });
    await this.mailService.sendEmailVerification(email, pending.name, code);
    return { message: 'Se existir uma conta pendente, enviámos novas instruções.' };
  }

  async forgotPassword(dto: { email: string }) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findFirst({ where: { email, isActive: true } });
    if (user) {
      const code = await this.issueChallenge(email, AuthChallengePurpose.PASSWORD_RESET, { userId: user.id });
      await this.mailService.sendPasswordRecovery(email, user.name, code);
    }
    return { message: 'Se existir uma conta associada, enviámos instruções para redefinir a palavra-passe.' };
  }

  async resetPassword(dto: { email: string; code: string; password: string; confirmPassword: string }) {
    if (dto.password !== dto.confirmPassword) throw new BadRequestException('As palavras-passe não coincidem.');
    const email = this.normalizeEmail(dto.email);
    const challenge = await this.consumeChallenge(email, AuthChallengePurpose.PASSWORD_RESET, dto.code);
    if (!challenge.userId) throw new BadRequestException('O código é inválido ou expirou.');
    const user = await this.prisma.user.update({
      where: { id: challenge.userId },
      data: { password: await bcrypt.hash(dto.password, 12), passwordChangedAt: new Date() },
    });
    await this.prisma.authChallenge.updateMany({
      where: { userId: user.id, purpose: AuthChallengePurpose.PASSWORD_RESET, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.mailService.sendPasswordChanged(user.email, user.name);
    return { message: 'Palavra-passe alterada com sucesso.' };
  }

  async completeOnboarding(dto: {
    onboardingToken: string; companyName: string; nif: string; phone?: string;
    address?: string; sector?: string; companyType?: string; employees?: number;
    enrollments?: Array<{ taxType: any; regime: any; validFrom: string; validUntil?: string; legalReference?: string }>;
  }) {
    let payload: { sub?: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.onboardingToken);
    } catch {
      throw new UnauthorizedException('A sessão de onboarding expirou. Confirme o email novamente.');
    }
    if (payload.purpose !== 'ONBOARDING' || !payload.sub) {
      throw new UnauthorizedException('A sessão de onboarding é inválida.');
    }
    const parsedEnrollments = (dto.enrollments ?? []).map((enrollment) => {
      const validFrom = new Date(enrollment.validFrom);
      const validUntil = enrollment.validUntil ? new Date(enrollment.validUntil) : null;
      if (Number.isNaN(validFrom.getTime()) || (validUntil && validUntil < validFrom)) {
        throw new BadRequestException('Vigência fiscal inválida.');
      }
      return { ...enrollment, validFrom, validUntil };
    });
    if (new Set(parsedEnrollments.map((item) => item.taxType)).size !== parsedEnrollments.length) {
      throw new BadRequestException('Indique apenas um enquadramento inicial por imposto.');
    }
    const trialStartedAt = new Date();
    const result = await this.prisma.$transaction(async (transaction) => {
      const pending = await transaction.pendingRegistration.findUnique({ where: { id: payload.sub } });
      if (!pending?.emailVerifiedAt || pending.onboardingCompletedAt) {
        throw new BadRequestException('Este onboarding já não está disponível.');
      }
      if (await transaction.user.findFirst({ where: { email: pending.email } })) {
        throw new BadRequestException('Esta identidade já possui uma conta.');
      }
      const tenant = await transaction.tenant.create({
        data: {
          name: dto.companyName.trim(), nif: dto.nif.trim().toUpperCase(), email: pending.email,
          phone: dto.phone?.trim() || pending.phone || null, address: dto.address?.trim() || null,
          sector: dto.sector?.trim() || null, companyType: dto.companyType?.trim() || null,
          employeeCount: dto.employees ?? 0, createdAt: trialStartedAt,
          trialEndsAt: calculateTrialEnd(trialStartedAt),
        },
      });
      const user = await transaction.user.create({
        data: {
          tenantId: tenant.id, name: pending.name, email: pending.email, password: pending.passwordHash,
          phone: pending.phone, role: UserRole.OWNER, emailVerifiedAt: pending.emailVerifiedAt,
          emailVerificationRequired: true, onboardingCompletedAt: new Date(),
        },
      });
      await transaction.companySettings.create({ data: { tenantId: tenant.id } });
      if (parsedEnrollments.length) {
        await transaction.taxRegimeAssignment.createMany({
          data: parsedEnrollments.map((enrollment) => ({
            tenantId: tenant.id, taxType: enrollment.taxType, regime: enrollment.regime,
            validFrom: enrollment.validFrom, validUntil: enrollment.validUntil,
            legalReference: enrollment.legalReference,
            status: TaxRegimeAssignmentStatus.ACTIVE,
            reviewStatus: TaxRegimeAssignmentStatus.REVIEW_REQUIRED,
            decisionDate: new Date(), decisionType: 'MANUAL_REVIEW_REQUIRED',
          })),
        });
      }
      await transaction.pendingRegistration.update({
        where: { id: pending.id }, data: { onboardingCompletedAt: new Date() },
      });
      return { pending, tenant, user };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await this.mailService.sendMail(result.pending.email, 'Bem-vindo à Fiscalidade Digital', `Olá ${result.pending.name},\n\nA empresa ${result.tenant.name} foi configurada. Pode iniciar sessão.`);
    return { message: 'Onboarding concluído.', userId: result.user.id, tenantId: result.tenant.id };
  }

  async createInvitation(requester: { userId: string; tenantId: string; role: UserRole }, dto: { email: string; role: UserRole }) {
    const email = this.normalizeEmail(dto.email);
    if (dto.role === UserRole.OWNER && requester.role !== UserRole.OWNER) {
      throw new UnauthorizedException('Apenas um proprietário pode convidar outro proprietário.');
    }
    const [existingUser, pendingRegistration] = await Promise.all([
      this.prisma.user.findFirst({ where: { email } }),
      this.prisma.pendingRegistration.findUnique({ where: { email } }),
    ]);
    if (existingUser || pendingRegistration) throw new BadRequestException('Não foi possível criar este convite.');
    const inviter = await this.prisma.user.findFirst({
      where: { id: requester.userId, tenantId: requester.tenantId, isActive: true }, select: { name: true },
    });
    if (!inviter) throw new UnauthorizedException();
    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.userInvitation.updateMany({
        where: { tenantId: requester.tenantId, email, acceptedAt: null }, data: { acceptedAt: now },
      }),
      this.prisma.userInvitation.create({ data: {
        tenantId: requester.tenantId, email, role: dto.role, tokenHash: this.hashSecret(token),
        expiresAt: new Date(now.getTime() + 48 * 60 * 60_000), createdById: requester.userId,
      } }),
    ]);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: requester.tenantId }, select: { name: true } });
    await this.mailService.sendUserInvitation(email, inviter.name, token, tenant?.name || 'a sua empresa', dto.role);
    return { message: 'Convite enviado.' };
  }

  async acceptInvitation(dto: { token: string; name: string; password: string; confirmPassword: string; acceptTerms: boolean; acceptPrivacyPolicy: boolean }) {
    if (dto.password !== dto.confirmPassword) throw new BadRequestException('As palavras-passe não coincidem.');
    if (!dto.acceptTerms || !dto.acceptPrivacyPolicy) throw new BadRequestException('É necessário aceitar os documentos jurídicos aplicáveis.');
    const tokenHash = this.hashSecret(dto.token);
    const password = await bcrypt.hash(dto.password, 12);
    const now = new Date();
    const user = await this.prisma.$transaction(async (transaction) => {
      const invitation = await transaction.userInvitation.findUnique({ where: { tokenHash } });
      if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now) {
        throw new BadRequestException('O convite é inválido ou expirou.');
      }
      if (await transaction.user.findFirst({ where: { email: invitation.email } })) {
        throw new BadRequestException('O convite já não está disponível.');
      }
      const created = await transaction.user.create({ data: {
        tenantId: invitation.tenantId, email: invitation.email, name: dto.name.trim(), password,
        role: invitation.role, emailVerifiedAt: now, emailVerificationRequired: true,
        onboardingCompletedAt: now,
      } });
      await transaction.legalAcceptance.createMany({ data: [
        { documentType: LegalDocumentType.TERMS_OF_USE, version: AuthService.TERMS_VERSION, acceptedAt: now, userId: created.id },
        { documentType: LegalDocumentType.PRIVACY_POLICY, version: AuthService.PRIVACY_VERSION, acceptedAt: now, userId: created.id },
      ] });
      await transaction.userInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: now } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { message: 'Acesso criado. Já pode iniciar sessão.', userId: user.id };
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

    if (user.emailVerificationRequired && !user.emailVerifiedAt) {
      throw new UnauthorizedException('Confirme o seu email antes de iniciar sessão.');
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
