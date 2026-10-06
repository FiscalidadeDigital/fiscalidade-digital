import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollService } from './payroll.service';

describe('PayrollService tenant and state transitions', () => {
  const transaction = {
    payroll: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn(
      (callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
    ),
  } as unknown as PrismaService;
  const service = new PayrollService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('rejects a period for which no versioned tax rule exists before writing', async () => {
    await expect(
      service.create('tenant-a', 9, 2025),
    ).rejects.toThrow('2025');
  });

  it('does not select IRT calendar rules from Tenant.regime', async () => {
    const fiscalCalendar = { findMany: jest.fn().mockResolvedValue([]) };
    const calendarService = new PayrollService({ fiscalCalendar } as unknown as PrismaService);
    const warning = jest.spyOn(console, 'warn').mockImplementation();

    await expect(
      (calendarService as any).findPayrollCalendarRule('tenant-a', 'IRT', 3, 2026),
    ).resolves.toBeNull();

    expect(fiscalCalendar.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ active: true, referenceYear: 2026, taxType: 'IRT' }),
    }));
    expect(fiscalCalendar.findMany.mock.calls[0][0].where.regimes).toBeUndefined();
    warning.mockRestore();
  });

  it('scopes approval by tenant and changes only CALCULATED to APPROVED', async () => {
    transaction.payroll.findFirst
      .mockResolvedValueOnce({
        id: 'payroll-a',
        tenantId: 'tenant-a',
        status: 'CALCULATED',
      })
      .mockResolvedValueOnce({
        id: 'payroll-a',
        tenantId: 'tenant-a',
        status: 'APPROVED',
        items: [],
      });
    transaction.payroll.updateMany.mockResolvedValue({ count: 1 });
    transaction.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    await expect(
      service.approve('tenant-a', 'payroll-a', 'user-a'),
    ).resolves.toEqual(
      expect.objectContaining({ status: 'APPROVED' }),
    );
    expect(transaction.payroll.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'payroll-a',
        tenantId: 'tenant-a',
        status: 'CALCULATED',
      },
      data: {
        status: 'APPROVED',
      },
    });
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-a',
        userId: 'user-a',
        action: 'PAYROLL_STATUS_CHANGED',
      }),
    });
  });

  it('does not reveal a payroll belonging to another tenant', async () => {
    transaction.payroll.findFirst.mockResolvedValue(null);

    await expect(
      service.approve('tenant-a', 'payroll-b'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transaction.payroll.updateMany).not.toHaveBeenCalled();
  });

  it('detects a concurrent status transition', async () => {
    transaction.payroll.findFirst.mockResolvedValue({
      id: 'payroll-a',
      tenantId: 'tenant-a',
      status: 'CALCULATED',
    });
    transaction.payroll.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.approve('tenant-a', 'payroll-a'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('only closes a paid payroll', async () => {
    transaction.payroll.findFirst
      .mockResolvedValueOnce({
        id: 'payroll-a',
        tenantId: 'tenant-a',
        status: 'PAID',
      })
      .mockResolvedValueOnce({
        id: 'payroll-a',
        tenantId: 'tenant-a',
        status: 'CLOSED',
        items: [],
      });
    transaction.payroll.updateMany.mockResolvedValue({ count: 1 });
    transaction.auditLog.create.mockResolvedValue({ id: 'audit-2' });

    await expect(
      service.close('tenant-a', 'payroll-a'),
    ).resolves.toEqual(
      expect.objectContaining({ status: 'CLOSED' }),
    );
  });
});
