import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';

import { Response } from 'express';

import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoice')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.create(dto);
  }

  @Get()
  findAll() {
    return this.invoiceService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.invoiceService.findOne(id);
  }

  @Patch(':id/pay')
  markAsPaid(
    @Param('id')
    id: string,
  ) {
    return this.invoiceService.markAsPaid(id);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id')
    id: string,
  ) {
    return this.invoiceService.cancel(id);
  }

  @Get(':id/pdf')
  generatePdf(
    @Param('id')
    id: string,
    @Res() res: Response,
  ) {
    return this.invoiceService.generatePdf(
      id,
      res,
    );
  }
}