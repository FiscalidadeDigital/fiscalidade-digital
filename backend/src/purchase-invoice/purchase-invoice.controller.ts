import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { PurchaseInvoiceService } from './purchase-invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';

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
  async findAll(@CurrentUser() user: { tenantId: string }) {
    return this.purchaseInvoiceService.findAll(
      user.tenantId,
    );
  }

  // ============================================================
  // ESTATÍSTICAS
  // GET /purchase-invoice/stats
  // ============================================================

  @Get('stats')
  async getStats(@CurrentUser() user: { tenantId: string }) {
    return this.purchaseInvoiceService.getStats(
      user.tenantId,
    );
  }

  // ============================================================
  // CONSULTAR UMA FACTURA
  // GET /purchase-invoice/:id
  // ============================================================

  @Get(':id')
  async findOne(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.purchaseInvoiceService.findOne(
      user.tenantId,
      id,
    );
  }

  // ============================================================
  // CRIAR FACTURA DE COMPRA
  // POST /purchase-invoice
  // ============================================================

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  async create(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: CreatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoiceService.create(
      user.tenantId,
      dto,
    );
  }

  // ============================================================
  // ACTUALIZAR FACTURA
  // PATCH /purchase-invoice/:id
  // ============================================================

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  async update(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoiceService.update(
      user.tenantId,
      id,
      dto,
    );
  }

  // ============================================================
  // MARCAR COMO PAGA
  // POST /purchase-invoice/:id/pay
  // ============================================================

  @Post(':id/pay')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async markAsPaid(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.purchaseInvoiceService.markAsPaid(
      user.tenantId,
      id,
    );
  }

  // ============================================================
  // CANCELAR
  // POST /purchase-invoice/:id/cancel
  // ============================================================

  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async cancel(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.purchaseInvoiceService.cancel(
      user.tenantId,
      id,
    );
  }

  // ============================================================
  // REMOVER
  // DELETE /purchase-invoice/:id
  // ============================================================

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async remove(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.purchaseInvoiceService.remove(
      user.tenantId,
      id,
    );
  }
}
