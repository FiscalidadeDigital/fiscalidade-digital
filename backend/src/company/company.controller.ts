import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CompanyService } from './company.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
  ) {}

  @Get()
  async getCompany(
    @CurrentUser() user: any,
  ) {
    return this.companyService.getCompany(
      user.tenantId,
    );
  }

  @Patch()
  async updateCompany(
    @CurrentUser() user: any,

    @Body() body: any,
  ) {
    return this.companyService.updateCompany(
      user.tenantId,
      body,
    );
  }
}