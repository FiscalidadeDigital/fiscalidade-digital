import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { ObligationsService } from './obligations.service';

interface AuthenticatedRequest
  extends Request {
  user: {
    tenantId: string;
  };
}

@Controller('obligations')
@UseGuards(JwtAuthGuard)
export class ObligationsController {
  constructor(
    private readonly obligationsService: ObligationsService,
  ) {}

  // ==========================================================
  // LISTAR
  //
  // GET /obligations
  // ==========================================================

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)
  async findAll(
    @Req()
    req: AuthenticatedRequest,

    @Query('year')
    year?: string,
    @Query('readOnly')
    readOnly?: string,
  ) {
    const tenantId =
      req.user.tenantId;

    const referenceYear =
      this.parseYear(year);

    return readOnly === 'true'
      ? this.obligationsService.findAllReadOnly(tenantId, referenceYear)
      : this.obligationsService.findAll(
      tenantId,
      referenceYear,
    );
  }

  // ==========================================================
  // DASHBOARD
  //
  // GET /obligations/dashboard
  // ==========================================================

  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)
  async dashboard(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.obligationsService.getDashboard(
      req.user.tenantId,
    );
  }

  // ==========================================================
  // SINCRONIZAR
  //
  // POST /obligations/sync
  // ==========================================================

  @Post('sync')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async sync(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.obligationsService.sync(
      req.user.tenantId,
    );
  }

  // ==========================================================
  // ATUALIZAR ESTADOS
  //
  // POST /obligations/update-statuses
  // ==========================================================

  @Post('update-statuses')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async updateStatuses(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.obligationsService.updateStatuses(
      req.user.tenantId,
    );
  }

  // ==========================================================
  // BUSCAR UMA
  //
  // GET /obligations/:id
  // ==========================================================

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)
  async findOne(
    @Req()
    req: AuthenticatedRequest,

    @Param('id')
    id: string,
  ) {
    return this.obligationsService.findOne(
      req.user.tenantId,
      id,
    );
  }

  // ==========================================================
  // PAGAR
  //
  // PATCH /obligations/:id/pay
  // ==========================================================

  @Patch(':id/pay')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async pay(
    @Req()
    req: AuthenticatedRequest,

    @Param('id')
    id: string,
  ) {
    return this.obligationsService.markAsPaid(
      req.user.tenantId,
      id,
    );
  }

  // ==========================================================
  // REMOVER
  //
  // DELETE /obligations/:id
  // ==========================================================

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async remove(
    @Req()
    req: AuthenticatedRequest,

    @Param('id')
    id: string,
  ) {
    return this.obligationsService.remove(
      req.user.tenantId,
      id,
    );
  }

  // ==========================================================
  // ANO
  // ==========================================================

  private parseYear(
    value?: string,
  ): number | undefined {
    if (
      !value ||
      !value.trim()
    ) {
      return undefined;
    }

    const year =
      Number(value);

    if (
      !Number.isInteger(
        year,
      ) ||
      year < 2000 ||
      year > 2100
    ) {
      return undefined;
    }

    return year;
  }
}
