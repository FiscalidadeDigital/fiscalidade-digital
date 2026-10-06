import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)
  @Throttle({ default: { limit: 20, ttl: 60 * 60 * 1000 } })
  @Post('chat')
  async chat(
    @Req() req: any,
    @Body() dto: ChatDto,
  ) {
    return this.aiService.chat(
      req.user.tenantId,
      req.user.userId || req.user.sub,
      dto.message,
    );
  }
}
