import { EmployeeService } from './employee.service';

describe('employee dependents source of truth', () => {
  it('derives the denormalized count from real tax-dependent records after each addition', async () => {
    const transaction = {
      employeeDependent: { create: jest.fn().mockResolvedValue({ id: 'dependent-1' }), count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2) },
      employee: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      employee: { findFirst: jest.fn().mockResolvedValue({ id: 'employee-1', tenantId: 'tenant-1' }) },
      $transaction: jest.fn((callback: any) => callback(transaction)),
    };
    const service = new EmployeeService(prisma as any);

    await service.addDependent('tenant-1', 'employee-1', { name: 'A', taxDependent: true } as any);
    await service.addDependent('tenant-1', 'employee-1', { name: 'B', taxDependent: true } as any);

    expect(transaction.employeeDependent.count).toHaveBeenNthCalledWith(1, { where: { employeeId: 'employee-1', taxDependent: true } });
    expect(transaction.employee.update).toHaveBeenNthCalledWith(1, { where: { id: 'employee-1' }, data: { dependentCount: 1 } });
    expect(transaction.employee.update).toHaveBeenNthCalledWith(2, { where: { id: 'employee-1' }, data: { dependentCount: 2 } });
  });
});
