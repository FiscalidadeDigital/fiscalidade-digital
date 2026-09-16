import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { LegislationService } from './legislation.service';

@Controller('legislation')
export class LegislationController {
  constructor(
    private readonly legislationService: LegislationService,
  ) {}

  // =====================================================
  // LISTAR / PESQUISAR / FILTRAR
  // =====================================================

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('taxType') taxType?: string,
    @Query('subject') subject?: string,
  ) {
    return this.legislationService.advancedSearch({
      search,
      category,
      taxType,
      subject,
    });
  }

  // =====================================================
  // BUSCAR UMA LEGISLAÇÃO
  // =====================================================

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.legislationService.findOne(id);
  }
}