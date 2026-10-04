import { EmployeeService } from './employee.service';

describe('employee archive history preservation', () => {
  it('archives the employee without deleting salary, dependent, component or payroll history', async () => {
    const prisma = {
      employee: {
        findFirst: jest.fn().mockResolvedValue({ id: 'employee-1', tenantId: 'tenant-1', status: 'ACTIVE' }),
        update: jest.fn().mockResolvedValue({ id: 'employee-1', status: 'ARCHIVED' }),
        delete: jest.fn(),
      },
      employeeSalary: { deleteMany: jest.fn() },
      employeeDependent: { deleteMany: jest.fn() },
      employeeRemunerationComponent: { deleteMany: jest.fn() },
      payroll: { deleteMany: jest.fn() },
      payrollItem: { deleteMany: jest.fn() },
    };
    const service = new EmployeeService(prisma as any);

    await expect(service.remove('tenant-1', 'employee-1')).resolves.toEqual(expect.objectContaining({ status: 'ARCHIVED' }));
    expect(prisma.employee.update).toHaveBeenCalledWith({ where: { id: 'employee-1' }, data: { status: 'ARCHIVED' } });
    expect(prisma.employee.delete).not.toHaveBeenCalled();
    expect(prisma.employeeSalary.deleteMany).not.toHaveBeenCalled();
    expect(prisma.employeeDependent.deleteMany).not.toHaveBeenCalled();
    expect(prisma.employeeRemunerationComponent.deleteMany).not.toHaveBeenCalled();
    expect(prisma.payroll.deleteMany).not.toHaveBeenCalled();
    expect(prisma.payrollItem.deleteMany).not.toHaveBeenCalled();
  });
});
