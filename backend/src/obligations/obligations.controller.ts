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
  async findAll(
    @Req()
    req: AuthenticatedRequest,

    @Query('year')
    year?: string,
  ) {
    const tenantId =
      req.user.tenantId;

    const referenceYear =
      this.parseYear(year);

    return this.obligationsService.findAll(
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