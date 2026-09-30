import { UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

describe('PayrollController authorization', () => {
  const payrollService = {
    create: jest.fn(),
    calculate: jest.fn(),
    approve: jest.fn(),
    pay: jest.fn(),
    close: jest.fn(),
  } as unknown as PayrollService;
  const controller = new PayrollController(payrollService);
  const user: CurrentUserPayload = {
    userId: 'user-a',
    tenantId: 'tenant-a',
    email: 'owner@example.test',
    role: UserRole.OWNER,
  };

  beforeEach(() => jest.clearAllMocks());

  it('allows accountants to create and calculate payroll, but reserves approval and payment for owners/admins', () => {
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, PayrollController.prototype.findAll),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, PayrollController.prototype.findByPeriod),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, PayrollController.prototype.create),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, PayrollController.prototype.calculate),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, PayrollController.prototype.approve),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN]);
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, PayrollController.prototype.pay),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN]);
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, PayrollController.prototype.close),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN]);
  });

  it('uses the tenant from the authenticated principal when creating payroll', () => {
    const dto: CreatePayrollDto = { month: 9, year: 2026 };

    controller.create(user, dto);

    expect(payrollService.create).toHaveBeenCalledWith(
      'tenant-a',
      9,
      2026,
      'user-a',
    );
  });

  it('uses the authenticated tenant for status-changing operations', () => {
    controller.approve(user, 'payroll-1');
    controller.pay(user, 'payroll-2');
    controller.close(user, 'payroll-3');

    expect(payrollService.approve).toHaveBeenCalledWith(
      'tenant-a',
      'payroll-1',
      'user-a',
    );
    expect(payrollService.pay).toHaveBeenCalledWith(
      'tenant-a',
      'payroll-2',
      'user-a',
    );
    expect(payrollService.close).toHaveBeenCalledWith(
      'tenant-a',
      'payroll-3',
      'user-a',
    );
  });

  it('validates month and year at the request boundary', async () => {
    const validDto = plainToInstance(CreatePayrollDto, {
      month: '9',
      year: '2026',
    });
    const invalidDto = plainToInstance(CreatePayrollDto, {
      month: '13',
      year: 'not-a-year',
    });

    expect(await validate(validDto)).toHaveLength(0);
    expect(await validate(invalidDto)).not.toHaveLength(0);
  });
});
