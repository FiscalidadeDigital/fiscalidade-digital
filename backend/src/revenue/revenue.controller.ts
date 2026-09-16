import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    tenantId: string;
    email?: string;
    role?: string;
  };
}

@Controller('revenue')
@UseGuards(JwtAuthGuard)
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
  ) {}

  // =====================================================
  // CRIAR RECEITA
  // =====================================================

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      month: number;
      year: number;
      amount: number;
      notes?: string;
    },
  ) {
    return this.revenueService.create(
      req.user.tenantId,
      body,
    );
  }

  // =====================================================
  // LISTAR RECEITAS DA EMPRESA AUTENTICADA
  // =====================================================

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.revenueService.findAll(
      req.user.tenantId,
    );
  }

  // =====================================================
  // DASHBOARD DA EMPRESA AUTENTICADA
  // =====================================================

  @Get('dashboard')
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.revenueService.dashboardRevenue(
      req.user.tenantId,
    );
  }

  // =====================================================
  // CONSULTAR UMA RECEITA
  // =====================================================

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.revenueService.findOne(
      id,
      req.user.tenantId,
    );
  }

  // =====================================================
  // ATUALIZAR RECEITA
  // =====================================================

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      month?: number;
      year?: number;
      amount?: number;
      notes?: string;
    },
  ) {
    return this.revenueService.update(
      id,
      req.user.tenantId,
      body,
    );
  }

  // =====================================================
  // ELIMINAR RECEITA
  // =====================================================

  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.revenueService.remove(
      id,
      req.user.tenantId,
    );
  }
}