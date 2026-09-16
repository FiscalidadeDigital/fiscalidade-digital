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

import { SupplierService } from './supplier.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { CreateSupplierDto } from './dto/create-supplier.dto';

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
  async create(
    @CurrentUser() user: any,
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
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
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
  async count(
    @CurrentUser() user: any,
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
  async findOne(
    @CurrentUser() user: any,
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
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreateSupplierDto,
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
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.remove(
      user.tenantId,
      id,
    );
  }
}