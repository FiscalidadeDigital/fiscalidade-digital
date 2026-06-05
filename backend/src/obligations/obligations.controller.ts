import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';

import { ObligationsService } from './obligations.service';
import { CreateObligationDto } from './dto/create-obligation.dto';

@Controller('obligations')
export class ObligationsController {
  constructor(
    private readonly obligationsService: ObligationsService,
  ) {}

  @Post()
  create(@Body() dto: CreateObligationDto) {
    const tenantId =
      '5cbc437f-b6c7-4d58-aa98-da215e240bcd';

    return this.obligationsService.create(
      dto,
      tenantId,
    );
  }

  @Get()
  findAll() {
    return this.obligationsService.findAll();
  }

  @Get('dashboard')
  dashboard() {
    return this.obligationsService.getDashboard();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const obligation =
      await this.obligationsService.findOne(id);

    if (!obligation) {
      throw new NotFoundException(
        'Obrigação fiscal não encontrada',
      );
    }

    return obligation;
  }

  @Patch(':id/pay')
  pay(@Param('id') id: string) {
    return this.obligationsService.markAsPaid(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.obligationsService.remove(id);
  }
}