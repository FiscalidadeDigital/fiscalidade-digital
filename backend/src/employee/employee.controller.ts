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
  import { CreateRemunerationComponentDto } from './dto/create-remuneration-component.dto';
import { EndRemunerationComponentDto } from './dto/end-remuneration-component.dto';

const EMPLOYEE_WRITE_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
];

const EMPLOYEE_READ_ROLES = [...EMPLOYEE_WRITE_ROLES, UserRole.VIEWER];

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
  @Roles(...EMPLOYEE_WRITE_ROLES)
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
  @Roles(...EMPLOYEE_READ_ROLES)
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.employeeService.findAll(
      user.tenantId,
    );
  }

  @Get(':id')
  @Roles(...EMPLOYEE_READ_ROLES)
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
  @Roles(...EMPLOYEE_WRITE_ROLES)
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
  @Roles(...EMPLOYEE_WRITE_ROLES)
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
  @Roles(...EMPLOYEE_READ_ROLES)
  getSalaries(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.employeeService.getSalaries(
      user.tenantId,
      id,
    );
  }

  @Post(':id/remuneration-components')
  @Roles(...EMPLOYEE_WRITE_ROLES)
  addRemunerationComponent(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string, @Body() dto: CreateRemunerationComponentDto) {
    return this.employeeService.addRemunerationComponent(user.tenantId, id, dto);
  }

  @Get(':id/remuneration-components')
  @Roles(...EMPLOYEE_READ_ROLES)
  getRemunerationComponents(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.employeeService.getRemunerationComponents(user.tenantId, id);
  }

  @Patch(':id/remuneration-components/:componentId/end')
  @Roles(...EMPLOYEE_WRITE_ROLES)
  endRemunerationComponent(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string, @Param('componentId') componentId: string, @Body() dto: EndRemunerationComponentDto) {
    return this.employeeService.endRemunerationComponent(user.tenantId, id, componentId, dto.effectiveTo);
  }

  // =========================================================
  // DEPENDENTES
  // =========================================================

  @Post(':id/dependents')
  @Roles(...EMPLOYEE_WRITE_ROLES)
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
  @Roles(...EMPLOYEE_READ_ROLES)
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
