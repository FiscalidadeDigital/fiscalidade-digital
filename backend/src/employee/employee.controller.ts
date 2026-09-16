import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { EmployeeService } from './employee.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { CreateEmployeeDependentDto } from './dto/create-employee-dependent.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
  ) {}

  // =========================================================
  // FUNCIONÁRIOS
  // =========================================================

  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeeService.create(
      req.user.tenantId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.employeeService.findAll(
      req.user.tenantId,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.employeeService.findOne(
      req.user.tenantId,
      id,
    );
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeeService.update(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.employeeService.remove(
      req.user.tenantId,
      id,
    );
  }

  // =========================================================
  // SALÁRIOS
  // =========================================================

  @Post(':id/salaries')
  addSalary(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateEmployeeSalaryDto,
  ) {
    return this.employeeService.addSalary(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Get(':id/salaries')
  getSalaries(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.employeeService.getSalaries(
      req.user.tenantId,
      id,
    );
  }

  // =========================================================
  // DEPENDENTES
  // =========================================================

  @Post(':id/dependents')
  addDependent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateEmployeeDependentDto,
  ) {
    return this.employeeService.addDependent(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Get(':id/dependents')
  getDependents(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.employeeService.getDependents(
      req.user.tenantId,
      id,
    );
  }
}