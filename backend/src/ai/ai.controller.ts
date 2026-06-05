import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(
    @Req() req: any,
    @Body() dto: ChatDto,
  ) {
    return this.aiService.chat(
      req.user.tenantId,
      dto.message,
    );
  }
}