import { FiscalApplicabilityService } from './fiscal-applicability.service';

describe('FiscalApplicabilityService', () => {
  function setup(options: { iva?: any; industrial?: any; employees?: number; calendar?: number } = {}) {
    const enrollments = { resolve: jest.fn(async (_tenant: string, tax: string) => tax === 'IVA' ? options.iva ?? null : options.industrial ?? null) };
    const prisma = { employee: { count: jest.fn().mockResolvedValue(options.employees ?? 0) }, fiscalCalendar: { count: jest.fn().mockResolvedValue(options.calendar ?? 0) }, fiscalObligation: { create: jest.fn(), update: jest.fn(), upsert: jest.fn(), delete: jest.fn() } };
    return { service: new FiscalApplicabilityService(prisma as any, enrollments as any), prisma, enrollments };
  }

  it('assesses IVA and Industrial independently without legacy fallback', async () => {
    const { service, enrollments } = setup({ iva: { regime: 'GERAL', validFrom: new Date('2026-01-01'), validUntil: null }, industrial: null, calendar: 1 });
    const result = await service.assess('tenant-a', new Date('2026-03-01'));
    const iva = result.domains.find((x: any) => x.taxType === 'IVA');
    const ii = result.domains.find((x: any) => x.taxType === 'INDUSTRIAL');
    expect(iva).toEqual(expect.objectContaining({ applicabilityStatus: 'APPLICABLE', calculationReady: true }));
    expect(ii).toEqual(expect.objectContaining({ applicabilityStatus: 'REVIEW_REQUIRED', reason: 'NO_CURRENT_TAX_ENROLLMENT' }));
    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-a', 'IVA', expect.any(Date));
    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-a', 'INDUSTRIAL', expect.any(Date));
  });

  it('recognizes simplified IVA but blocks a definitive calculation', async () => {
    const { service } = setup({ iva: { regime: 'SIMPLIFICADO', validFrom: new Date('2026-01-01'), validUntil: null }, calendar: 1 });
    const iva = (await service.assess('tenant-a', new Date('2026-03-01'))).domains.find((x: any) => x.taxType === 'IVA');
    expect(iva).toEqual(expect.objectContaining({ applicabilityStatus: 'APPLICABLE', calculationReady: false, reason: 'NEEDS_OFFICIAL_CONFIRMATION' }));
  });

  it('derives IRT and INSS only from active employee facts', async () => {
    const withEmployees = await setup({ employees: 1 }).service.assess('tenant-a', new Date('2026-03-01'));
    const withoutEmployees = await setup({ employees: 0 }).service.assess('tenant-a', new Date('2026-03-01'));
    for (const taxType of ['IRT', 'SS']) {
      expect(withEmployees.domains.find((x: any) => x.taxType === taxType)).toEqual(expect.objectContaining({ applicabilityStatus: 'APPLICABLE', reason: 'ACTIVE_EMPLOYEES_IN_PERIOD' }));
      expect(withoutEmployees.domains.find((x: any) => x.taxType === taxType)).toEqual(expect.objectContaining({ applicabilityStatus: 'NOT_APPLICABLE', reason: 'NO_EMPLOYMENT_TRIGGER' }));
    }
  });

  it('keeps SAF-T as a requirement and never persists obligations', async () => {
    const { service, prisma } = setup({ iva: { regime: 'GERAL', validFrom: new Date('2026-01-01') } });
    const result = await service.assess('tenant-a', new Date('2027-01-01'));
    expect(result.domains.find((x: any) => x.taxType === 'SAFT')).toEqual(expect.objectContaining({ applicabilityStatus: 'APPLICABLE', calculationReady: false }));
    expect(prisma.fiscalObligation.create).not.toHaveBeenCalled(); expect(prisma.fiscalObligation.update).not.toHaveBeenCalled(); expect(prisma.fiscalObligation.upsert).not.toHaveBeenCalled(); expect(prisma.fiscalObligation.delete).not.toHaveBeenCalled();
  });

  it('marks a year without calendar records pending rather than copying another year', async () => {
    const { service } = setup({ calendar: 0 });
    const result = await service.assess('tenant-a', new Date('2027-01-01'));
    expect(result.domains.find((x: any) => x.taxType === 'IVA')).toEqual(expect.objectContaining({ calendarStatus: 'OFFICIAL_CALENDAR_PENDING' }));
  });

  it('uses actual calendar records for 2026 and keeps an open enrollment valid in 2027', async () => {
    const iva = { regime: 'GERAL', validFrom: new Date('2026-01-01'), validUntil: null };
    const { service, prisma, enrollments } = setup({ iva, calendar: 1 });
    const result2026 = await service.assess('tenant-a', new Date('2026-06-01'));
    expect(result2026.domains.find((x: any) => x.taxType === 'IVA')).toEqual(expect.objectContaining({ calendarStatus: 'AVAILABLE', applicabilityStatus: 'APPLICABLE' }));
    expect(prisma.fiscalCalendar.count).toHaveBeenCalledWith({ where: { referenceYear: 2026, active: true } });
    const result2027 = await service.assess('tenant-a', new Date('2027-01-01'));
    expect(result2027.domains.find((x: any) => x.taxType === 'IVA')).toEqual(expect.objectContaining({ applicabilityStatus: 'APPLICABLE' }));
    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-a', 'IVA', expect.any(Date));
  });

  it('uses only the authenticated tenant in enrollment and employment queries', async () => {
    const { service, prisma, enrollments } = setup({ employees: 0, calendar: 0 });
    await service.assess('tenant-b', new Date('2026-03-01'));
    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-b', 'IVA', expect.any(Date));
    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-b', 'INDUSTRIAL', expect.any(Date));
    expect(prisma.employee.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-b' }) }));
    expect(prisma.fiscalCalendar.count).toHaveBeenCalledWith({ where: { referenceYear: 2026, active: true } });
    expect(prisma.fiscalObligation.create).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.upsert).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.delete).not.toHaveBeenCalled();
  });
});
