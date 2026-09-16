import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
  ) {}

  @Post()
  create(
    @Req() req: any,
    @Body()
    body: {
      month: number;
      year: number;
    },
  ) {
    return this.payrollService.create(
      req.user.tenantId,
      Number(body.month),
      Number(body.year),
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.payrollService.findAll(
      req.user.tenantId,
    );
  }

  @Get(':year/:month')
  findByPeriod(
    @Req() req: any,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.payrollService.findByPeriod(
      req.user.tenantId,
      Number(year),
      Number(month),
    );
  }

  @Post(':id/calculate')
  calculate(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.payrollService.calculate(
      req.user.tenantId,
      id,
    );
  }

  @Post(':id/approve')
  approve(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.payrollService.approve(
      req.user.tenantId,
      id,
    );
  }

  @Post(':id/pay')
  pay(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.payrollService.pay(
      req.user.tenantId,
      id,
    );
  }
}