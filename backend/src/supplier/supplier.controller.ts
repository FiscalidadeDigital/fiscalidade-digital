import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { SupplierService } from './supplier.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SearchSuppliersDto } from './dto/search-suppliers.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

const SUPPLIER_READ_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
  UserRole.VIEWER,
];

const SUPPLIER_WRITE_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
];

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(
    private readonly service: SupplierService,
  ) {}

  // =====================================================
  // CRIAR FORNECEDOR
  // POST /suppliers
  // =====================================================

  @Post()
  @Roles(...SUPPLIER_WRITE_ROLES)
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.service.create(
      user.tenantId,
      dto,
    );
  }

  // =====================================================
  // LISTAR FORNECEDORES
  // GET /suppliers
  //
  // Também suporta:
  //
  // GET /suppliers?search=empresa
  // =====================================================

  @Get()
  @Roles(...SUPPLIER_READ_ROLES)
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: SearchSuppliersDto,
  ) {
    if (query.page !== undefined) {
      return this.service.findPage(user.tenantId, query);
    }

    const search = query.search;
    if (search?.trim()) {
      return this.service.search(
        user.tenantId,
        search,
      );
    }

    return this.service.findAll(
      user.tenantId,
    );
  }

  // =====================================================
  // CONTAR FORNECEDORES
  // GET /suppliers/count
  // =====================================================

  @Get('count')
  @Roles(...SUPPLIER_READ_ROLES)
  count(
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.count(
      user.tenantId,
    );
  }

  // =====================================================
  // BUSCAR FORNECEDOR
  // GET /suppliers/:id
  // =====================================================

  @Get(':id')
  @Roles(...SUPPLIER_READ_ROLES)
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.service.findOne(
      user.tenantId,
      id,
    );
  }

  // =====================================================
  // ATUALIZAR FORNECEDOR
  // PATCH /suppliers/:id
  // =====================================================

  @Patch(':id')
  @Roles(...SUPPLIER_WRITE_ROLES)
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.service.update(
      user.tenantId,
      id,
      dto,
    );
  }

  // =====================================================
  // ELIMINAR FORNECEDOR
  // DELETE /suppliers/:id
  // =====================================================

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.service.remove(
      user.tenantId,
      id,
    );
  }
}
