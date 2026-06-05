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

import { ClientService } from './client.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(
    private readonly service: ClientService,
  ) {}

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

  @Get()
  findAll(
    @CurrentUser() user: any,
  ) {
    return this.service.findAll(
      user.tenantId,
    );
  }

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