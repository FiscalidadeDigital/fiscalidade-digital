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
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

import { EmployeeService } from './employee.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { CreateEmployeeDependentDto } from './dto/create-employee-dependent.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const EMPLOYEE_ACCESS_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
];

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
  @Roles(...EMPLOYEE_ACCESS_ROLES)
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeeService.create(
      user.tenantId,
      dto,
    );
  }

  @Get()
  @Roles(...EMPLOYEE_ACCESS_ROLES)
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.employeeService.findAll(
      user.tenantId,
    );
  }

  @Get(':id')
  @Roles(...EMPLOYEE_ACCESS_ROLES)
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.employeeService.findOne(
      user.tenantId,
      id,
    );
  }

  @Patch(':id')
  @Roles(...EMPLOYEE_ACCESS_ROLES)
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(
      user.tenantId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.employeeService.remove(
      user.tenantId,
      id,
    );
  }

  // =========================================================
  // SALÁRIOS
  // =========================================================

  @Post(':id/salaries')
  @Roles(...EMPLOYEE_ACCESS_ROLES)
  addSalary(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateEmployeeSalaryDto,
  ) {
    return this.employeeService.addSalary(
      user.tenantId,
      id,
      dto,
    );
  }

  @Get(':id/salaries')
  @Roles(...EMPLOYEE_ACCESS_ROLES)
  getSalaries(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.employeeService.getSalaries(
      user.tenantId,
      id,
    );
  }

  // =========================================================
  // DEPENDENTES
  // =========================================================

  @Post(':id/dependents')
  @Roles(...EMPLOYEE_ACCESS_ROLES)
  addDependent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateEmployeeDependentDto,
  ) {
    return this.employeeService.addDependent(
      user.tenantId,
      id,
      dto,
    );
  }

  @Get(':id/dependents')
  @Roles(...EMPLOYEE_ACCESS_ROLES)
  getDependents(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.employeeService.getDependents(
      user.tenantId,
      id,
    );
  }
}
