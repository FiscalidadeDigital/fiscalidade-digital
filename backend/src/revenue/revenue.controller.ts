import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { RevenueService } from './revenue.service';

@Controller('revenue')
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      tenantId: string;
      month: number;
      year: number;
      amount: number;
      notes?: string;
    },
  ) {
    return this.revenueService.create(body);
  }

  @Get()
  findAll() {
    return this.revenueService.findAll();
  }

  @Get('dashboard')
  dashboard() {
    return this.revenueService.dashboardRevenue();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.revenueService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.revenueService.update(
      id,
      body,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.revenueService.remove(id);
  }
}