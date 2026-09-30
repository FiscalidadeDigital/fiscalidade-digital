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

import { ProductService } from './product.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_READ_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
  UserRole.VIEWER,
];

const PRODUCT_WRITE_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
];

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
  @Roles(...PRODUCT_WRITE_ROLES)
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateProductDto,
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
  @Roles(...PRODUCT_READ_ROLES)
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: SearchProductsDto,
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
  // CONTAR PRODUTOS
  // GET /products/count
  // =====================================================

  @Get('count')
  @Roles(...PRODUCT_READ_ROLES)
  async count(
    @CurrentUser() user: CurrentUserPayload,
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
  @Roles(...PRODUCT_READ_ROLES)
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
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
  @Roles(...PRODUCT_WRITE_ROLES)
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
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
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.service.remove(
      user.tenantId,
      id,
    );
  }
}
