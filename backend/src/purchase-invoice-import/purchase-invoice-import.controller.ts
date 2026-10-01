import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ConfirmPurchaseInvoiceImportDto } from './dto/confirm-purchase-invoice-import.dto';
import { CreatePurchaseInvoiceImportDto } from './dto/create-purchase-invoice-import.dto';
import { PurchaseInvoiceImportService } from './purchase-invoice-import.service';

const WRITE_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT];

@Controller('purchase-invoice-imports')
@UseGuards(JwtAuthGuard)
export class PurchaseInvoiceImportController {
  constructor(private readonly service: PurchaseInvoiceImportService) {}

  @Post()
  @Roles(...WRITE_ROLES)
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreatePurchaseInvoiceImportDto) {
    return this.service.create(user.tenantId, user.userId, dto.documentId);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post(':id/confirm')
  @Roles(...WRITE_ROLES)
  confirm(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ConfirmPurchaseInvoiceImportDto,
  ) {
    return this.service.confirm(user.tenantId, user.userId, id, dto);
  }
}
