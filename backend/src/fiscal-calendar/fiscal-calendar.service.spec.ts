import { FiscalCalendarService } from './fiscal-calendar.service';

describe('FiscalCalendarService tenant enrollment resolution', () => {
  it('preserves the legal calendar date and exposes a narrowly scoped official extension', async () => {
    const legalDueDate = new Date('2026-04-15T23:59:59.000Z');
    const operationalDueDate = new Date('2026-04-30T23:59:59.000Z');
    const fiscalCalendar = {
      findMany: jest.fn().mockResolvedValue([{
        id: 'iva-general-april-2026', taxType: 'IVA', period: 'ABRIL', referenceYear: 2026,
        dueDate: legalDueDate, regimes: [{ regime: 'GERAL' }],
        deadlineOverride: {
          active: true,
          originalDueDate: legalDueDate,
          operationalDueDate,
          reason: 'Fortes chuvas',
          officialReference: 'Comunicado AGT',
          sourceUrl: 'https://portaldocontribuinte.minfin.gov.ao/noticia?id=985577',
          publishedAt: new Date('2026-04-17T00:00:00.000Z'),
        },
      }]),
    };
    const service = new FiscalCalendarService({ fiscalCalendar } as any);

    const [calendar] = await service.findAll(2026);

    expect(calendar).toEqual(expect.objectContaining({
      dueDate: legalDueDate,
      legalDueDate,
      operationalDueDate,
      deadlineOverride: expect.objectContaining({
        reason: 'Fortes chuvas',
        sourceUrl: 'https://portaldocontribuinte.minfin.gov.ao/noticia?id=985577',
      }),
    }));
    expect(fiscalCalendar.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { active: true, referenceYear: 2026 },
      include: expect.objectContaining({ deadlineOverride: true }),
    }));
  });

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
