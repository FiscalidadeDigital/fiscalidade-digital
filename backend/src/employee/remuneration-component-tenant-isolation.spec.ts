import { NotFoundException } from '@nestjs/common';

import { EmployeeService } from './employee.service';

describe('remuneration component tenant isolation', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';
  const employeeA = 'employee-a';
  const componentA = 'component-a';

  function serviceWith(employeeExistsForTenant: string | null) {
    const prisma = {
      employee: { findFirst: jest.fn().mockResolvedValue(employeeExistsForTenant ? { id: employeeA, tenantId: employeeExistsForTenant } : null) },
      employeeRemunerationComponent: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(), update: jest.fn(),
      },
    };
    return { service: new EmployeeService(prisma as any), prisma };
  }

  it('does not list components of an employee owned by another tenant', async () => {
    const { service, prisma } = serviceWith(null);
    await expect(service.getRemunerationComponents(tenantB, employeeA)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.employeeRemunerationComponent.findMany).not.toHaveBeenCalled();
  });

  it('does not create a component for another tenant employee', async () => {
    const { service, prisma } = serviceWith(null);
    await expect(service.addRemunerationComponent(tenantB, employeeA, { type: 'HOLIDAY_ALLOWANCE', amount: 1, effectiveFrom: '2026-10-01' } as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.employeeRemunerationComponent.create).not.toHaveBeenCalled();
  });

  it('filters end requests through employee tenant ownership', async () => {
    const { service, prisma } = serviceWith(tenantA);
    await expect(service.endRemunerationComponent(tenantB, employeeA, componentA, '2026-12-31')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.employeeRemunerationComponent.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ employee: { tenantId: tenantB } }) }));
    expect(prisma.employeeRemunerationComponent.update).not.toHaveBeenCalled();
  });

  it('never accepts tenant ownership from component input', async () => {
    const { service, prisma } = serviceWith(null);
    await expect(service.addRemunerationComponent(tenantB, employeeA, { type: 'BONUS', amount: 10, effectiveFrom: '2026-10-01', tenantId: tenantA } as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.employee.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: employeeA, tenantId: tenantB } }));
  });
});
