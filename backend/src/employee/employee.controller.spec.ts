import {
  EmployeeStatus,
  SocialSecurityCategory,
  UserRole,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

describe('EmployeeController authorization and DTOs', () => {
  const employeeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addSalary: jest.fn(),
    getSalaries: jest.fn(),
    addDependent: jest.fn(),
    getDependents: jest.fn(),
  } as unknown as EmployeeService;
  const controller = new EmployeeController(employeeService);
  const user: CurrentUserPayload = {
    userId: 'user-a',
    tenantId: 'tenant-a',
    email: 'owner@example.test',
    role: UserRole.OWNER,
  };

  beforeEach(() => jest.clearAllMocks());

  it.each([
    'create',
    'findAll',
    'findOne',
    'update',
    'addSalary',
    'getSalaries',
    'addDependent',
    'getDependents',
  ] as const)('restricts %s to employee access roles', (method) => {
    expect(
      Reflect.getMetadata(
        REQUIRED_ROLES_KEY,
        EmployeeController.prototype[method],
      ),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
  });

  it('reserves employee deletion for owners and administrators', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_ROLES_KEY,
        EmployeeController.prototype.remove,
      ),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN]);
  });

  it('uses the tenant from the authenticated principal', () => {
    controller.findOne(user, 'employee-1');
    controller.update(user, 'employee-1', { jobTitle: 'Auditor' });
    controller.getSalaries(user, 'employee-1');
    controller.getDependents(user, 'employee-1');

    expect(employeeService.findOne).toHaveBeenCalledWith(
      'tenant-a',
      'employee-1',
    );
    expect(employeeService.update).toHaveBeenCalledWith(
      'tenant-a',
      'employee-1',
      { jobTitle: 'Auditor' },
    );
    expect(employeeService.getSalaries).toHaveBeenCalledWith(
      'tenant-a',
      'employee-1',
    );
    expect(employeeService.getDependents).toHaveBeenCalledWith(
      'tenant-a',
      'employee-1',
    );
  });

  it('accepts frontend employee fields and rejects an empty name', async () => {
    const valid = plainToInstance(CreateEmployeeDto, {
      name: 'Ana Manuel',
      gender: 'Feminino',
      socialSecurityCategory: SocialSecurityCategory.STANDARD,
      initialSalary: {
        baseSalary: 250000,
        effectiveFrom: '2026-10-01',
      },
      status: EmployeeStatus.ACTIVE,
      dependentCount: 1,
    });
    const invalid = plainToInstance(CreateEmployeeDto, {
      name: '   ',
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('validates a nested initial salary when it is supplied', async () => {
    const invalid = plainToInstance(CreateEmployeeDto, {
      name: 'Ana Manuel',
      initialSalary: {
        baseSalary: -1,
        effectiveFrom: 'invalid-date',
      },
    });

    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('accepts a partial update and validates supplied fields', async () => {
    const partial = plainToInstance(UpdateEmployeeDto, {
      jobTitle: 'Contabilista',
    });
    const invalidStatus = plainToInstance(UpdateEmployeeDto, {
      status: 'UNKNOWN',
    });
    const invalidName = plainToInstance(UpdateEmployeeDto, {
      name: '',
    });

    expect(await validate(partial)).toHaveLength(0);
    expect(await validate(invalidStatus)).not.toHaveLength(0);
    expect(await validate(invalidName)).not.toHaveLength(0);
  });

  it('validates the social security category on create and update', async () => {
    const validCreate = plainToInstance(CreateEmployeeDto, {
      name: 'Ana Manuel',
      socialSecurityCategory: SocialSecurityCategory.RETIRED,
    });
    const validUpdate = plainToInstance(UpdateEmployeeDto, {
      socialSecurityCategory: SocialSecurityCategory.STANDARD,
    });
    const invalidCreate = plainToInstance(CreateEmployeeDto, {
      name: 'Ana Manuel',
      socialSecurityCategory: 'UNKNOWN',
    });
    const invalidUpdate = plainToInstance(UpdateEmployeeDto, {
      socialSecurityCategory: 'UNKNOWN',
    });

    expect(await validate(validCreate)).toHaveLength(0);
    expect(await validate(validUpdate)).toHaveLength(0);
    expect(await validate(invalidCreate)).not.toHaveLength(0);
    expect(await validate(invalidUpdate)).not.toHaveLength(0);
  });

  it('rejects salary values with more than two decimal places', async () => {
    const valid = plainToInstance(CreateEmployeeSalaryDto, {
      baseSalary: 250000.5,
      effectiveFrom: '2026-09-01',
    });
    const invalid = plainToInstance(CreateEmployeeSalaryDto, {
      baseSalary: 250000.555,
      effectiveFrom: '2026-09-01',
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });
});
