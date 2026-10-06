import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailDto } from './dto/email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // =========================================================
  // REGISTO DE EMPRESA
  // =========================================================

  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
  @Post('register')
  register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.registerAccount(dto);
  }

  @Throttle({ default: { limit: 8, ttl: 15 * 60 * 1000 } })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  @Post('resend-verification')
  resendVerification(@Body() dto: EmailDto) {
    return this.authService.resendVerification(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: EmailDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 6, ttl: 15 * 60 * 1000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Throttle({ default: { limit: 6, ttl: 15 * 60 * 1000 } })
  @Post('complete-onboarding')
  completeOnboarding(@Body() dto: CompleteOnboardingDto) {
    return this.authService.completeOnboarding(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  @Post('invitations')
  createInvitation(@CurrentUser() user: any, @Body() dto: CreateInvitationDto) {
    return this.authService.createInvitation(user, dto);
  }

  @Throttle({ default: { limit: 8, ttl: 15 * 60 * 1000 } })
  @Post('invitations/accept')
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto);
  }

  // =========================================================
  // LOGIN
  // =========================================================

  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @Post('login')
  login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  // =========================================================
  // UTILIZADOR AUTENTICADO
  // =========================================================
  //
  // Este endpoint será utilizado pelo frontend para
  // recuperar os dados reais da sessão atual:
  //
  // Utilizador
  // Empresa
  // NIF
  // Regime
  // Tipo de empresa
  //
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(
    @CurrentUser() user: any,
  ) {
    return this.authService.getCurrentUser(
      user.userId,
    );
  }
}
