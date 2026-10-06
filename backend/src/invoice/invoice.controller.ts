import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';
import { UserRole } from '@prisma/client';

import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

const INVOICE_READ_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
  UserRole.VIEWER,
];

const INVOICE_WRITE_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
];

@Controller('invoice')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post()
  @Roles(...INVOICE_WRITE_ROLES)
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.create(
      user.tenantId,
      dto,
    );
  }

  @Post('pro-forma')
  @Roles(...INVOICE_WRITE_ROLES)
  createProForma(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.createProForma(user.tenantId, dto);
  }

  @Post(':id/convert')
  @Roles(...INVOICE_WRITE_ROLES)
  convertProForma(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.invoiceService.convertProForma(user.tenantId, id);
  }

  @Get()
  @Roles(...INVOICE_READ_ROLES)
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: InvoiceQueryDto,
  ) {
    if (query.page !== undefined) {
      return this.invoiceService.findPage(user.tenantId, query);
    }

    return this.invoiceService.findAll(
      user.tenantId,
      query.documentType,
    );
  }

  @Get('dashboard/stats')
  @Roles(...INVOICE_READ_ROLES)
  getDashboardStats(
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.invoiceService.getDashboardStats(
      user.tenantId,
    );
  }

  @Get(':id')
  @Roles(...INVOICE_READ_ROLES)
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.invoiceService.findOne(
      user.tenantId,
      id,
    );
  }

  @Patch(':id/pay')
  @Roles(...INVOICE_WRITE_ROLES)
  markAsPaid(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.invoiceService.markAsPaid(
      user.tenantId,
      id,
    );
  }

  @Patch(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.invoiceService.cancel(
      user.tenantId,
      id,
    );
  }

  @Get(':id/pdf')
  @Roles(...INVOICE_READ_ROLES)
  generatePdf(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    return this.invoiceService.generatePdf(
      user.tenantId,
      id,
      res,
    );
  }
}
