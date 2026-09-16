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

import {
  ClientService,
} from './client.service';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientController {

  constructor(
    private readonly service: ClientService,
  ) {}

  // =====================================================
  // CRIAR CLIENTE
  // POST /clients
  // =====================================================

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.service.create(
      user.tenantId,
      body,
    );
  }

  // =====================================================
  // LISTAR CLIENTES
  // GET /clients
  // =====================================================

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    if (
      search !== undefined &&
      search.trim() !== ''
    ) {
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
  // CONTAR CLIENTES
  // GET /clients/count
  // =====================================================

  @Get('count')
  count(
    @CurrentUser() user: any,
  ) {
    return this.service.count(
      user.tenantId,
    );
  }

  // =====================================================
  // BUSCAR CLIENTE
  // GET /clients/:id
  // =====================================================

  @Get(':id')
  findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.findOne(
      user.tenantId,
      id,
    );
  }

  // =====================================================
  // ATUALIZAR CLIENTE
  // PATCH /clients/:id
  // =====================================================

  @Patch(':id')
  update(
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
  // ELIMINAR CLIENTE
  // DELETE /clients/:id
  // =====================================================

  @Delete(':id')
  remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.remove(
      user.tenantId,
      id,
    );
  }
}