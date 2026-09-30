import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import {
  PlatformAdminAuthGuard,
  PlatformAdminRequest,
} from './guards/platform-admin-auth.guard';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('login')
  login(@Body() dto: AdminLoginDto, @Req() request: PlatformAdminRequest) {
    return this.authService.login(dto, this.requestContext(request));
  }

  @UseGuards(PlatformAdminAuthGuard)
  @Get('me')
  me(@Req() request: PlatformAdminRequest) {
    return { admin: request.platformAdmin };
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @UseGuards(PlatformAdminAuthGuard)
  @Post('change-password')
  changePassword(
    @Body() dto: ChangeAdminPasswordDto,
    @Req() request: PlatformAdminRequest,
  ) {
    return this.authService.changePassword(
      request.platformAdmin!.id,
      dto,
      this.requestContext(request),
    );
  }

  private requestContext(request: PlatformAdminRequest) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };
  }
}
