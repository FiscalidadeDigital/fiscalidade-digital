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

import { PurchaseInvoiceService } from './purchase-invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('purchase-invoice')
@UseGuards(JwtAuthGuard)
export class PurchaseInvoiceController {
  constructor(
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  // ============================================================
  // LISTAR FACTURAS DE COMPRA
  // GET /purchase-invoice
  // ============================================================

  @Get()
  async findAll(@Req() req: any) {
    return this.purchaseInvoiceService.findAll(
      req.user.tenantId,
    );
  }

  // ============================================================
  // ESTATÍSTICAS
  // GET /purchase-invoice/stats
  // ============================================================

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.purchaseInvoiceService.getStats(
      req.user.tenantId,
    );
  }

  // ============================================================
  // CONSULTAR UMA FACTURA
  // GET /purchase-invoice/:id
  // ============================================================

  @Get(':id')
  async findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.purchaseInvoiceService.findOne(
      req.user.tenantId,
      id,
    );
  }

  // ============================================================
  // CRIAR FACTURA DE COMPRA
  // POST /purchase-invoice
  // ============================================================

  @Post()
  async create(
    @Req() req: any,
    @Body() dto: any,
  ) {
    return this.purchaseInvoiceService.create(
      req.user.tenantId,
      dto,
    );
  }

  // ============================================================
  // ACTUALIZAR FACTURA
  // PATCH /purchase-invoice/:id
  // ============================================================

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.purchaseInvoiceService.update(
      req.user.tenantId,
      id,
      dto,
    );
  }

  // ============================================================
  // MARCAR COMO PAGA
  // POST /purchase-invoice/:id/pay
  // ============================================================

  @Post(':id/pay')
  async markAsPaid(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.purchaseInvoiceService.markAsPaid(
      req.user.tenantId,
      id,
    );
  }

  // ============================================================
  // CANCELAR
  // POST /purchase-invoice/:id/cancel
  // ============================================================

  @Post(':id/cancel')
  async cancel(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.purchaseInvoiceService.cancel(
      req.user.tenantId,
      id,
    );
  }

  // ============================================================
  // REMOVER
  // DELETE /purchase-invoice/:id
  // ============================================================

  @Delete(':id')
  async remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.purchaseInvoiceService.remove(
      req.user.tenantId,
      id,
    );
  }
}