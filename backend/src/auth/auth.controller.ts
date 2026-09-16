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

import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // =========================================================
  // REGISTO DE EMPRESA
  // =========================================================

  @Post('register')
  register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  // =========================================================
  // LOGIN
  // =========================================================

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