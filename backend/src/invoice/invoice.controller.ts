import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('invoice')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.create(
      user.tenantId,
      dto,
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.invoiceService.findAll(
      user.tenantId,
    );
  }

  @Get('dashboard/stats')
  getDashboardStats(
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.invoiceService.getDashboardStats(
      user.tenantId,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.invoiceService.findOne(
      user.tenantId,
      id,
    );
  }

  @Patch(':id/pay')
  markAsPaid(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.invoiceService.markAsPaid(
      user.tenantId,
      id,
    );
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.invoiceService.cancel(
      user.tenantId,
      id,
    );
  }

  @Get(':id/pdf')
  generatePdf(
    @CurrentUser() user: { tenantId: string },
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
