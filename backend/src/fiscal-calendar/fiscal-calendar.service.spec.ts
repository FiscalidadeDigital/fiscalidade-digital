import { FiscalCalendarService } from './fiscal-calendar.service';

describe('FiscalCalendarService tenant enrollment resolution', () => {
  it('filters a regime-specific rule by the authenticated tenant and its fiscal period, never Tenant.regime', async () => {
    const fiscalCalendar = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'iva-march', taxType: 'IVA', period: 'MARÇO', referenceYear: 2026,
          dueDate: new Date('2026-04-20T00:00:00.000Z'), regimes: [{ regime: 'GERAL' }],
        },
        {
          id: 'irt-march', taxType: 'IRT', period: 'MARÇO', referenceYear: 2026,
          dueDate: new Date('2026-04-20T00:00:00.000Z'), regimes: [],
        },
      ]),
    };
    const tenant = { findUnique: jest.fn().mockResolvedValue({ id: 'tenant-b' }) };
    const enrollments = {
      resolve: jest.fn().mockResolvedValue(null),
    };
    const service = new FiscalCalendarService({ fiscalCalendar, tenant } as any, enrollments as any);

    const result = await service.findForTenant('tenant-b', 2026);

    expect(result.map((rule: any) => rule.id)).toEqual(['irt-march']);
    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-b', 'IVA', new Date('2026-03-01T00:00:00.000Z'));
    expect(tenant.findUnique).toHaveBeenCalledWith({ where: { id: 'tenant-b' }, select: { id: true, name: true, nif: true } });
  });
});
