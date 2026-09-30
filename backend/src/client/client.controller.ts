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

import {
  ClientService,
} from './client.service';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { SearchClientsDto } from './dto/search-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const CLIENT_READ_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
  UserRole.VIEWER,
];

const CLIENT_WRITE_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
];

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
  @Roles(...CLIENT_WRITE_ROLES)
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateClientDto,
  ) {
    return this.service.create(
      user.tenantId,
      dto,
    );
  }

  // =====================================================
  // LISTAR CLIENTES
  // GET /clients
  // =====================================================

  @Get()
  @Roles(...CLIENT_READ_ROLES)
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: SearchClientsDto,
  ) {
    if (query.page !== undefined) {
      return this.service.findPage(user.tenantId, query);
    }

    const search = query.search;
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
  @Roles(...CLIENT_READ_ROLES)
  count(
    @CurrentUser() user: CurrentUserPayload,
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
  @Roles(...CLIENT_READ_ROLES)
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
  // ATUALIZAR CLIENTE
  // PATCH /clients/:id
  // =====================================================

  @Patch(':id')
  @Roles(...CLIENT_WRITE_ROLES)
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.service.update(
      user.tenantId,
      id,
      dto,
    );
  }

  // =====================================================
  // ELIMINAR CLIENTE
  // DELETE /clients/:id
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
