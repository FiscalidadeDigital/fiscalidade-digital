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
import { UserRole } from '@prisma/client';

import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

const REVENUE_READ_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER];
const REVENUE_WRITE_ROLES = [UserRole.OWNER, UserRole.ADMIN];

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
  @Roles(...REVENUE_WRITE_ROLES)
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
  @Roles(...REVENUE_READ_ROLES)
  findAll(@Req() req: AuthenticatedRequest) {
    return this.revenueService.findAll(
      req.user.tenantId,
    );
  }

  // =====================================================
  // DASHBOARD DA EMPRESA AUTENTICADA
  // =====================================================

  @Get('dashboard')
  @Roles(...REVENUE_READ_ROLES)
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.revenueService.dashboardRevenue(
      req.user.tenantId,
    );
  }

  // =====================================================
  // CONSULTAR UMA RECEITA
  // =====================================================

  @Get(':id')
  @Roles(...REVENUE_READ_ROLES)
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
  @Roles(...REVENUE_WRITE_ROLES)
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
  @Roles(...REVENUE_WRITE_ROLES)
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
