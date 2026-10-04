import { Prisma } from '@prisma/client';
import { ObligationsService } from '../obligations/obligations.service';
import { PayrollService } from '../payroll/payroll.service';
import { FiscalEngineService } from '../fiscal-engine/fiscal-engine.service';

describe('FiscalObligation writer migration', () => {
  it('routes the calendar synchronizer through persistence with CALENDAR origin', async () => {
    const persistence = { persistCalendarDerived: jest.fn().mockResolvedValue({ outcome: 'CREATED', obligation: { id: 'calendar' } }) };
    const prisma = {
      tenant: { findUnique: jest.fn().mockResolvedValue({ id: 'tenant-a', name: 'A', nif: '500', regime: 'GERAL', sector: null, companyType: null, retentionRate: 0, status: 'ACTIVE', createdAt: new Date('2026-01-01') }) },
      fiscalObligation: { count: jest.fn().mockResolvedValue(0), findFirst: jest.fn().mockResolvedValue(null) },
      fiscalCalendar: { findMany: jest.fn().mockResolvedValue([{ id: 'calendar-a', period: '2026-10', referenceYear: 2026, obligationType: 'IVA', taxType: 'IVA', title: 'IVA', description: null, dueDate: new Date('2026-12-01'), regimes: [] }]) },
    };
    const service = new ObligationsService(prisma as any, persistence as any);
    jest.spyOn(service as any, 'isCalendarRuleApplicable').mockReturnValue(true);
    jest.spyOn(service as any, 'calculateObligationAmount').mockResolvedValue(10);
    jest.spyOn(service as any, 'updateStatuses').mockResolvedValue({ updated: 0 });
    jest.spyOn(service as any, 'backfillPaidObligations').mockResolvedValue(0);

    await service.syncCompany('tenant-a');
    expect(persistence.persistCalendarDerived).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-a', fiscalCalendarId: 'calendar-a', period: '2026-10', origin: 'CALENDAR' }));
    expect((prisma.fiscalObligation as any).create).toBeUndefined();
  });

  it('routes the payroll synchronizer through persistence with PAYROLL origin', async () => {
    const persistence = { persistCalendarDerived: jest.fn().mockResolvedValue({ outcome: 'CREATED', obligation: { id: 'payroll' } }) };
    const prisma = { fiscalObligation: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) } };
    const service = new PayrollService(prisma as any, persistence as any);
    jest.spyOn(service as any, 'findPayrollCalendarRule').mockResolvedValue({ id: 'calendar-irt', period: 'OUTUBRO', obligationType: 'IRT', title: 'IRT Grupo A', description: 'Mapa de remuneracoes', dueDate: new Date('2026-10-15') });

    await (service as any).syncPayrollTaxObligation('tenant-a', { month: 9, year: 2026, period: '2026-09' }, 'IRT', new Prisma.Decimal(50));
    expect(persistence.persistCalendarDerived).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-a', fiscalCalendarId: 'calendar-irt', period: 'OUTUBRO', origin: 'PAYROLL' }));
    expect((prisma.fiscalObligation as any).create).toBeUndefined();
  });

  it('routes the assessment synchronizer through persistence with FISCAL_ENGINE origin and transaction client', async () => {
    const persistence = { persistCalendarDerived: jest.fn().mockResolvedValue({ outcome: 'CREATED', obligation: { id: 'assessment' } }) };
    const tx = {
      fiscalCalendar: { findMany: jest.fn().mockResolvedValue([{ id: 'calendar-iva', period: '2026-09', obligationType: 'IVA', title: 'IVA', description: null, dueDate: new Date('2026-10-15'), regimes: [] }]) },
      fiscalObligation: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new FiscalEngineService({} as any, persistence as any);

    await (service as any).syncAssessmentObligation(tx, 'tenant-a', 'IVA', '2026-09', 2026, 'GERAL', 75);
    expect(persistence.persistCalendarDerived).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-a', fiscalCalendarId: 'calendar-iva', period: '2026-09', origin: 'FISCAL_ENGINE' }), tx);
    expect((tx.fiscalObligation as any).create).toBeUndefined();
  });
});
