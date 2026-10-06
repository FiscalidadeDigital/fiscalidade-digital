import { ObligationGenerationService } from './obligation-generation.service';

const domain = (taxType: string, overrides: any = {}) => ({
  taxType,
  applicabilityStatus: 'NOT_APPLICABLE',
  calculationReady: false,
  calendarStatus: 'NOT_APPLICABLE',
  reason: 'NO_TRIGGER',
  ...overrides,
});
const rule = (overrides: any = {}) => ({
  id: 'calendar-rule', taxType: 'IVA', obligationType: 'IVA', title: 'IVA mensal', description: null,
  period: '2026-10', dueDate: new Date('2026-11-15'), officialReference: 'AGT-2026', source: 'AGT', sourceUrl: null,
  ...overrides,
});

describe('ObligationGenerationService', () => {
  function setup(domains: any[], rules: any[] = [rule()]) {
    const applicability = { assess: jest.fn().mockResolvedValue({ period: '2026-10', domains }) };
    const persistence = { persistCalendarDerived: jest.fn().mockResolvedValue({ outcome: 'CREATED', obligation: { id: 'obligation-1' } }) };
    const prisma = { fiscalCalendar: { findMany: jest.fn().mockResolvedValue(rules) }, fiscalObligation: { create: jest.fn(), update: jest.fn(), upsert: jest.fn() } };
    return { service: new ObligationGenerationService(applicability as any, persistence as any, prisma as any), applicability, persistence, prisma };
  }

  it('creates IVA general only from applicable enrollment and an official calendar rule', async () => {
    const { service, persistence } = setup([domain('IVA', { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', regime: 'GERAL' })]);
    const result = await service.generate('tenant-a', new Date('2026-10-01'));
    expect(result.results[0]).toEqual(expect.objectContaining({ taxType: 'IVA', outcome: 'CREATED' }));
    expect(persistence.persistCalendarDerived).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-a', fiscalCalendarId: 'calendar-rule', origin: 'CALENDAR' }));
  });

  it('skips simplified IVA whose definitive rule is not confirmed', async () => {
    const { service, persistence, prisma } = setup([domain('IVA', { applicabilityStatus: 'APPLICABLE', calculationReady: false, calendarStatus: 'AVAILABLE', regime: 'SIMPLIFICADO', reason: 'NEEDS_OFFICIAL_CONFIRMATION' })]);
    await expect(service.generate('tenant-a', new Date('2026-10-01'))).resolves.toEqual(expect.objectContaining({ results: [expect.objectContaining({ outcome: 'SKIPPED', reasonCode: 'NEEDS_OFFICIAL_CONFIRMATION' })] }));
    expect(prisma.fiscalCalendar.findMany).not.toHaveBeenCalled();
    expect(persistence.persistCalendarDerived).not.toHaveBeenCalled();
  });

  it('skips an enrollment-dependent domain without a valid enrollment', async () => {
    const { service, persistence } = setup([domain('IVA', { applicabilityStatus: 'REVIEW_REQUIRED', calendarStatus: 'AVAILABLE', reason: 'NO_CURRENT_TAX_ENROLLMENT' })]);
    const result = await service.generate('tenant-a', new Date('2026-10-01'));
    expect(result.results[0]).toEqual(expect.objectContaining({ outcome: 'SKIPPED', reasonCode: 'NO_VALID_ENROLLMENT' }));
    expect(persistence.persistCalendarDerived).not.toHaveBeenCalled();
  });

  it('generates Industrial Tax independently from IVA', async () => {
    const { service, persistence, prisma } = setup([
      domain('IVA', { applicabilityStatus: 'REVIEW_REQUIRED', reason: 'NO_CURRENT_TAX_ENROLLMENT' }),
      domain('INDUSTRIAL', { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', regime: 'GERAL' }),
    ], [rule({ id: 'industrial-rule', taxType: 'INDUSTRIAL', obligationType: 'II' })]);
    const result = await service.generate('tenant-a', new Date('2026-10-01'));
    expect(result.results).toEqual(expect.arrayContaining([expect.objectContaining({ taxType: 'INDUSTRIAL', outcome: 'CREATED' })]));
    expect(prisma.fiscalCalendar.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ taxType: 'INDUSTRIAL' }) }));
    expect(persistence.persistCalendarDerived).toHaveBeenCalledWith(expect.objectContaining({ type: 'II' }));
  });

  it('includes legacy II calendar rows in the canonical Industrial domain', async () => {
    const { service, prisma } = setup([
      domain('INDUSTRIAL', { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', regime: 'GERAL' }),
    ], [rule({ taxType: 'II', obligationType: 'II' })]);
    await service.generate('tenant-a', new Date('2026-10-01'));
    expect(prisma.fiscalCalendar.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ taxType: { in: ['INDUSTRIAL', 'II'] } }),
    }));
  });

  it.each(['IRT', 'SS'])('generates %s only when labour applicability is active', async (taxType) => {
    const { service, persistence } = setup([domain(taxType, { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', reason: 'ACTIVE_EMPLOYEES_IN_PERIOD' })], [rule({ taxType, obligationType: taxType })]);
    await expect(service.generate('tenant-a', new Date('2026-10-01'))).resolves.toEqual(expect.objectContaining({ results: [expect.objectContaining({ taxType, outcome: 'CREATED' })] }));
    expect(persistence.persistCalendarDerived).toHaveBeenCalledTimes(1);
  });

  it('skips IRT without an employment trigger', async () => {
    const { service, persistence } = setup([domain('IRT', { applicabilityStatus: 'NOT_APPLICABLE', reason: 'NO_EMPLOYMENT_TRIGGER' })]);
    await service.generate('tenant-a', new Date('2026-10-01'));
    expect(persistence.persistCalendarDerived).not.toHaveBeenCalled();
  });

  it('treats SAF-T as an obligation requirement rather than a regime', async () => {
    const { service, persistence, prisma } = setup([domain('SAFT', { applicabilityStatus: 'APPLICABLE', calculationReady: false, calendarStatus: 'AVAILABLE' })], [rule({ id: 'saft-rule', obligationType: 'SAFT' })]);
    await service.generate('tenant-a', new Date('2026-10-01'));
    expect(prisma.fiscalCalendar.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ obligationType: 'SAFT' }) }));
    expect(persistence.persistCalendarDerived).toHaveBeenCalledWith(expect.objectContaining({ fiscalCalendarId: 'saft-rule', type: 'SAFT' }));
  });

  it('skips 2027 when the official calendar is pending and never copies 2026', async () => {
    const { service, prisma, persistence } = setup([domain('IVA', { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'OFFICIAL_CALENDAR_PENDING', regime: 'GERAL' })]);
    const result = await service.generate('tenant-a', new Date('2027-01-01'));
    expect(result.results[0]).toEqual(expect.objectContaining({ outcome: 'SKIPPED', reasonCode: 'OFFICIAL_CALENDAR_PENDING' }));
    expect(prisma.fiscalCalendar.findMany).not.toHaveBeenCalled();
    expect(persistence.persistCalendarDerived).not.toHaveBeenCalled();
  });

  it('queries only the requested 2027 calendar and does not copy a 2026 deadline', async () => {
    const { service, prisma, persistence } = setup([domain('IVA', { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', regime: 'GERAL' })], []);
    const result = await service.generate('tenant-a', new Date('2027-01-01'));
    expect(prisma.fiscalCalendar.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ referenceYear: 2027 }) }));
    expect(result.results[0]).toEqual(expect.objectContaining({ outcome: 'SKIPPED', reasonCode: 'OFFICIAL_CALENDAR_PENDING' }));
    expect(persistence.persistCalendarDerived).not.toHaveBeenCalled();
  });

  it('returns CREATED then EXISTING for a second generation of the same calendar identity', async () => {
    const { service, persistence } = setup([domain('IVA', { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', regime: 'GERAL' })]);
    persistence.persistCalendarDerived.mockResolvedValueOnce({ outcome: 'CREATED', obligation: { id: 'one' } }).mockResolvedValueOnce({ outcome: 'EXISTING', obligation: { id: 'one' } });
    expect((await service.generate('tenant-a', new Date('2026-10-01'))).results[0]).toEqual(expect.objectContaining({ outcome: 'CREATED', obligation: { id: 'one' } }));
    expect((await service.generate('tenant-a', new Date('2026-10-01'))).results[0]).toEqual(expect.objectContaining({ outcome: 'EXISTING', obligation: { id: 'one' } }));
  });

  it('returns persistence outcomes without overwriting paid or cancelled history', async () => {
    const { service, persistence, prisma } = setup([domain('IVA', { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', regime: 'GERAL' })]);
    persistence.persistCalendarDerived.mockResolvedValueOnce({ outcome: 'EXISTING', obligation: { id: 'paid', status: 'PAID', origin: 'PAYROLL' } }).mockResolvedValueOnce({ outcome: 'EXISTING', obligation: { id: 'cancelled', status: 'CANCELLED', origin: 'FISCAL_ENGINE' } });
    expect((await service.generate('tenant-a', new Date('2026-10-01'))).results[0]).toEqual(expect.objectContaining({ outcome: 'EXISTING', obligation: expect.objectContaining({ status: 'PAID', origin: 'PAYROLL' }) }));
    expect((await service.generate('tenant-a', new Date('2026-10-01'))).results[0]).toEqual(expect.objectContaining({ outcome: 'EXISTING', obligation: expect.objectContaining({ status: 'CANCELLED', origin: 'FISCAL_ENGINE' }) }));
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
  });

  it('uses only the authenticated tenant and has no direct create or calculation side effect', async () => {
    const { service, applicability, persistence, prisma } = setup([domain('IVA', { applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', regime: 'GERAL' })]);
    await service.generate('tenant-b', new Date('2026-10-01'));
    expect(applicability.assess).toHaveBeenCalledWith('tenant-b', expect.any(Date));
    expect(persistence.persistCalendarDerived).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-b' }));
    expect(prisma.fiscalObligation.create).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.upsert).not.toHaveBeenCalled();
  });
});
