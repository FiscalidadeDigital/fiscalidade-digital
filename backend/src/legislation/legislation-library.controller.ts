import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { LegislationLibraryService } from './legislation-library.service';

@Controller('legislation/library')
export class LegislationLibraryController {
  constructor(
    private readonly legislationLibraryService: LegislationLibraryService,
  ) {}

  // =====================================================
  // BIBLIOTECA COMPLETA
  // GET /legislation/library
  // =====================================================

  @Get()
  getLibrary() {
    return this.legislationLibraryService.getLibrary();
  }

  // =====================================================
  // LISTAR DIPLOMAS
  // GET /legislation/library/documents
  // =====================================================

  @Get('documents')
  getDocuments() {
    return this.legislationLibraryService.getDocuments();
  }

  // =====================================================
  // PESQUISAR NA BIBLIOTECA
  // GET /legislation/library/search?q=IVA
  // =====================================================

  @Get('search')
  search(
    @Query('q') query?: string,
  ) {
    return this.legislationLibraryService.search(query || '');
  }

  // =====================================================
  // ABRIR DIPLOMA
  // GET /legislation/library/document/:sourceFile
  // =====================================================

  @Get('document/:sourceFile')
  getDocument(
    @Param('sourceFile') sourceFile: string,
  ) {
    return this.legislationLibraryService.getDocument(sourceFile);
  }
}