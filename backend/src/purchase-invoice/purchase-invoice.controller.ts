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
import { UpdatePurchaseInvoiceVatDeductibilityDto } from './dto/update-purchase-invoice-vat-deductibility.dto';
import { RejectPurchaseInvoiceDto } from './dto/reject-purchase-invoice.dto';
import { CreatePurchaseInvoicePaymentDto } from './dto/create-purchase-invoice-payment.dto';

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
    @CurrentUser() user: { tenantId: string; userId: string },
    @Body() dto: CreatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoiceService.create(
      user.tenantId,
      user.userId,
      dto,
    );
  }

  // ============================================================
  // ACTUALIZAR FACTURA
  // PATCH /purchase-invoice/:id
  // ============================================================

  @Patch(':id/vat-deductibility')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  async updateVatDeductibility(
    @CurrentUser() user: { tenantId: string; userId: string },
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseInvoiceVatDeductibilityDto,
  ) {
    return this.purchaseInvoiceService.updateVatDeductibility(
      user.tenantId,
      user.userId,
      id,
      dto,
    );
  }

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
  // WORKFLOW DOCUMENTAL E PAGAMENTOS
  // ============================================================

  @Post(':id/validate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  validate(@CurrentUser() user: { tenantId: string; userId: string }, @Param('id') id: string) {
    return this.purchaseInvoiceService.validate(user.tenantId, user.userId, id);
  }

  @Post(':id/reject')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  reject(@CurrentUser() user: { tenantId: string; userId: string }, @Param('id') id: string, @Body() dto: RejectPurchaseInvoiceDto) {
    return this.purchaseInvoiceService.reject(user.tenantId, user.userId, id, dto.reason);
  }

  @Post(':id/payments')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  addPayment(@CurrentUser() user: { tenantId: string; userId: string }, @Param('id') id: string, @Body() dto: CreatePurchaseInvoicePaymentDto) {
    return this.purchaseInvoiceService.addPayment(user.tenantId, user.userId, id, dto);
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
