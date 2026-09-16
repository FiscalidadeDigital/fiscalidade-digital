import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { HistoryService } from './history.service';

interface AuthenticatedRequest
  extends Request {
  user: {
    tenantId: string;
  };
}

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService,
  ) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.historyService.findAll(
      req.user.tenantId,
    );
  }

  @Get('type/:type')
  async findByType(
    @Req() req: AuthenticatedRequest,
    @Param('type') type: string,
  ) {
    return this.historyService.findByType(
      req.user.tenantId,
      type,
    );
  }
}