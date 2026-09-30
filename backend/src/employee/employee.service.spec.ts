import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  EmployeeStatus,
  SocialSecurityCategory,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeService } from './employee.service';

describe('EmployeeService partial updates', () => {
  const prisma = {
    employee: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  const service = new EmployeeService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('scopes the lookup by tenant and keeps omitted fields out of the update', async () => {
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
      id: 'employee-1',
    });
    (prisma.employee.update as jest.Mock).mockResolvedValue({
      id: 'employee-1',
      jobTitle: 'Auditor Sénior',
    });

    await service.update('tenant-a', 'employee-1', {
      jobTitle: ' Auditor Sénior ',
    });

    expect(prisma.employee.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'employee-1',
        tenantId: 'tenant-a',
      },
    });
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'employee-1' },
      data: { jobTitle: 'Auditor Sénior' },
    });
  });

  it('applies explicit clearing and supplied status without changing other fields', async () => {
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
      id: 'employee-1',
    });
    (prisma.employee.update as jest.Mock).mockResolvedValue({
      id: 'employee-1',
    });

    await service.update('tenant-a', 'employee-1', {
      email: null,
      status: EmployeeStatus.SUSPENDED,
    });

    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'employee-1' },
      data: {
        email: null,
        status: EmployeeStatus.SUSPENDED,
      },
    });
  });

  it('updates a supplied social security category without writing omitted fields', async () => {
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
      id: 'employee-1',
    });
    (prisma.employee.update as jest.Mock).mockResolvedValue({
      id: 'employee-1',
      socialSecurityCategory: SocialSecurityCategory.RETIRED,
    });

    await service.update('tenant-a', 'employee-1', {
      socialSecurityCategory: SocialSecurityCategory.RETIRED,
    });

    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'employee-1' },
      data: {
        socialSecurityCategory: SocialSecurityCategory.RETIRED,
      },
    });
  });

  it('does not update an employee outside the authenticated tenant', async () => {
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.update('tenant-a', 'employee-from-tenant-b', {
        jobTitle: 'Auditor',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.employee.update).not.toHaveBeenCalled();
  });
});

describe('EmployeeService salary periods', () => {
  const transaction = {
    employeeSalary: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };
  const prisma = {
    employee: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
    ),
  } as unknown as PrismaService;
  const service = new EmployeeService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
      id: 'employee-1',
    });
    transaction.employeeSalary.updateMany.mockResolvedValue({ count: 1 });
    transaction.employeeSalary.create.mockResolvedValue({ id: 'salary-2' });
  });

  it('closes the active salary at the new effective date', async () => {
    transaction.employeeSalary.findFirst.mockResolvedValue({
      id: 'salary-1',
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    });

    await service.addSalary('tenant-a', 'employee-1', {
      baseSalary: 300000,
      effectiveFrom: '2026-10-01T00:00:00.000Z',
    });

    expect(transaction.employeeSalary.updateMany).toHaveBeenCalledWith({
      where: {
        employeeId: 'employee-1',
        active: true,
      },
      data: {
        active: false,
        effectiveTo: new Date('2026-10-01T00:00:00.000Z'),
      },
    });
  });

  it('rejects an overlapping or backdated active salary', async () => {
    transaction.employeeSalary.findFirst.mockResolvedValue({
      id: 'salary-1',
      effectiveFrom: new Date('2026-10-01T00:00:00.000Z'),
    });

    await expect(
      service.addSalary('tenant-a', 'employee-1', {
        baseSalary: 300000,
        effectiveFrom: '2026-09-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.employeeSalary.updateMany).not.toHaveBeenCalled();
    expect(transaction.employeeSalary.create).not.toHaveBeenCalled();
  });
});
