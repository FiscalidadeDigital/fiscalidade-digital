import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { TaxType } from '@prisma/client';

import { Request } from 'express';

import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';

import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

interface AuthenticatedRequest
  extends Request {
  user: {
    id: string;
    tenantId: string;
    email?: string;
    role?: string;
  };
}

@Controller('payments')
@UseGuards(
  AuthGuard('jwt'),
)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  /*
   * ==========================================================
   * LISTAR
   * ==========================================================
   *
   * GET /payments
   */

  @Get()
  async findAll(
    @Req()
    req: AuthenticatedRequest,

    @Query('taxType')
    taxType?: TaxType,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    return this.paymentsService.findAll(
      req.user.tenantId,
      {
        taxType,
        startDate,
        endDate,
      },
    );
  }

  /*
   * ==========================================================
   * RESUMO
   * ==========================================================
   *
   * GET /payments/summary
   */

  @Get('summary')
  async summary(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.paymentsService.getSummary(
      req.user.tenantId,
    );
  }

  /*
   * ==========================================================
   * EVOLUÇÃO
   * ==========================================================
   *
   * GET /payments/evolution
   */

  @Get('evolution')
  async evolution(
    @Req()
    req: AuthenticatedRequest,

    @Query('year')
    year?: string,
  ) {
    const parsedYear =
      year
        ? Number(year)
        : undefined;

    return this.paymentsService.getEvolution(
      req.user.tenantId,

      Number.isFinite(
        parsedYear,
      )
        ? parsedYear
        : undefined,
    );
  }

  /*
   * ==========================================================
   * CRIAR
   * ==========================================================
   *
   * POST /payments
   */

  @Post()
  async create(
    @Req()
    req: AuthenticatedRequest,

    @Body()
    dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(
      req.user.tenantId,
      dto,
    );
  }

  /*
   * ==========================================================
   * OBTER POR ID
   * ==========================================================
   *
   * GET /payments/:id
   */

  @Get(':id')
  async findOne(
    @Req()
    req: AuthenticatedRequest,

    @Param('id')
    id: string,
  ) {
    return this.paymentsService.findOne(
      req.user.tenantId,
      id,
    );
  }

  /*
   * ==========================================================
   * ATUALIZAR ESTADO
   * ==========================================================
   *
   * PATCH /payments/:id/status
   */

  @Patch(':id/status')
  async updateStatus(
    @Req()
    req: AuthenticatedRequest,

    @Param('id')
    id: string,

    @Body()
    dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updateStatus(
      req.user.tenantId,
      id,
      dto.status,
    );
  }
}