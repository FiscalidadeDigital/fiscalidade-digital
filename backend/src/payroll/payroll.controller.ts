import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
  ) {}

  @Post()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  )
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreatePayrollDto,
  ) {
    return this.payrollService.create(
      user.tenantId,
      body.month,
      body.year,
      user.userId,
    );
  }

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  )
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.payrollService.findAll(
      user.tenantId,
    );
  }

  @Get(':year/:month')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  )
  findByPeriod(
    @CurrentUser() user: CurrentUserPayload,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.payrollService.findByPeriod(
      user.tenantId,
      Number(year),
      Number(month),
    );
  }

  @Post(':id/calculate')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  )
  calculate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.calculate(
      user.tenantId,
      id,
      user.userId,
    );
  }

  @Post(':id/approve')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  approve(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.approve(
      user.tenantId,
      id,
      user.userId,
    );
  }

  @Post(':id/pay')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  pay(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.pay(
      user.tenantId,
      id,
      user.userId,
    );
  }

  @Post(':id/close')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  close(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.close(
      user.tenantId,
      id,
      user.userId,
    );
  }
}
