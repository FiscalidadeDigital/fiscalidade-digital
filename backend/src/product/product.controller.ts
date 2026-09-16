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

import { ProductService } from './product.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly service: ProductService,
  ) {}

  // =====================================================
  // CRIAR PRODUTO
  // POST /products
  // =====================================================

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.service.create(
      user.tenantId,
      body,
    );
  }

  // =====================================================
  // LISTAR PRODUTOS
  // GET /products
  //
  // GET /products?search=telefone
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
  // CONTAR PRODUTOS
  // GET /products/count
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
  // BUSCAR PRODUTO
  // GET /products/:id
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
  // ATUALIZAR PRODUTO
  // PATCH /products/:id
  // =====================================================

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.update(
      user.tenantId,
      id,
      body,
    );
  }

  // =====================================================
  // ELIMINAR PRODUTO
  // DELETE /products/:id
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