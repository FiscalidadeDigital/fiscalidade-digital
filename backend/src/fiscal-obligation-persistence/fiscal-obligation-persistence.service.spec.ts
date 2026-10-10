import { BadRequestException } from '@nestjs/common';
import { FiscalObligationPersistenceService } from './fiscal-obligation-persistence.service';

const calendarInput = (overrides: Record<string, unknown> = {}) => ({
  tenantId: 'tenant-a',
  fiscalCalendarId: 'calendar-2026-iva',
  period: '2026-07',
  type: 'IVA',
  title: 'IVA Julho 2026',
  dueDate: new Date('2026-08-15T00:00:00.000Z'),
  ...overrides,
});

const nonCalendarInput = (overrides: Record<string, unknown> = {}) => ({
  tenantId: 'tenant-a',
  origin: 'MANUAL',
  idempotencyKey: 'manual-2026-07-iva',
  type: 'IVA',
  title: 'IVA manual Julho 2026',
  dueDate: new Date('2026-08-15T00:00:00.000Z'),
  ...overrides,
});

const calendarConflict = {
  code: 'P2002',
  meta: { target: 'FiscalObligation_tenant_calendar_period_unique' },
};
const nonCalendarConflict = {
  code: 'P2002',
  meta: { target: 'FiscalObligation_tenant_origin_idempotency_key_unique' },
};

describe('FiscalObligationPersistenceService', () => {
  function setup() {
    const prisma = {
      fiscalObligation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
    };
    return {
      prisma,
      service: new FiscalObligationPersistenceService(prisma as any),
    };
  }

  it('creates a calendar-derived obligation on the first call', async () => {
    const { service, prisma } = setup();
    const created = { id: 'calendar-created' };
    prisma.fiscalObligation.create.mockResolvedValue(created);

    await expect(service.persistCalendarDerived(calendarInput() as any)).resolves.toEqual({ outcome: 'CREATED', obligation: created });
    expect(prisma.fiscalObligation.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-a', fiscalCalendarId: 'calendar-2026-iva', period: '2026-07' }) }));
  });

  it('uses a source-backed operational deadline without altering the calendar identity', async () => {
    const { service, prisma } = setup();
    const operationalDueDate = new Date('2026-04-30T23:59:59.000Z');
    const fiscalDeadlineOverride = {
      findUnique: jest.fn().mockResolvedValue({ active: true, operationalDueDate }),
    };
    (prisma as any).fiscalDeadlineOverride = fiscalDeadlineOverride;
    prisma.fiscalObligation.create.mockResolvedValue({ id: 'extended-deadline' });

    await service.persistCalendarDerived(calendarInput({
      fiscalCalendarId: 'calendar-2026-iva-april',
      dueDate: new Date('2026-04-15T23:59:59.000Z'),
    }) as any);

    expect(fiscalDeadlineOverride.findUnique).toHaveBeenCalledWith({
      where: { fiscalCalendarId: 'calendar-2026-iva-april' },
      select: { active: true, operationalDueDate: true },
    });
    expect(prisma.fiscalObligation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        fiscalCalendarId: 'calendar-2026-iva-april',
        dueDate: operationalDueDate,
      }),
    }));
  });

  it('returns the calendar-derived row after its expected unique conflict', async () => {
    const { service, prisma } = setup();
    const existing = { id: 'calendar-existing', status: 'PAID' };
    prisma.fiscalObligation.create.mockRejectedValue(calendarConflict);
    prisma.fiscalObligation.findFirst.mockResolvedValue(existing);

    await expect(service.persistCalendarDerived(calendarInput() as any)).resolves.toEqual({ outcome: 'EXISTING', obligation: existing });
    expect(prisma.fiscalObligation.findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a', fiscalCalendarId: 'calendar-2026-iva', period: '2026-07' } });
  });

  it('does not split a calendar identity when its origin differs', async () => {
    const { service, prisma } = setup();
    const existing = { id: 'single-calendar-row' };
    prisma.fiscalObligation.create.mockResolvedValueOnce(existing).mockRejectedValueOnce(calendarConflict);
    prisma.fiscalObligation.findFirst.mockResolvedValue(existing);

    expect((await service.persistCalendarDerived(calendarInput({ origin: 'PAYROLL' }) as any)).outcome).toBe('CREATED');
    await expect(service.persistCalendarDerived(calendarInput({ origin: 'FISCAL_ENGINE' }) as any)).resolves.toEqual({ outcome: 'EXISTING', obligation: existing });
  });

  it.each([
    ['CALENDAR', 'PAYROLL'],
    ['PAYROLL', 'FISCAL_ENGINE'],
    ['FISCAL_ENGINE', 'CALENDAR'],
  ])('keeps one calendar obligation when %s is followed by %s', async (firstOrigin, secondOrigin) => {
    const { service, prisma } = setup();
    const created = { id: `created-by-${firstOrigin}`, origin: firstOrigin };
    prisma.fiscalObligation.create.mockResolvedValueOnce(created).mockRejectedValueOnce(calendarConflict);
    prisma.fiscalObligation.findFirst.mockResolvedValue(created);

    await expect(service.persistCalendarDerived(calendarInput({ origin: firstOrigin }) as any)).resolves.toEqual({ outcome: 'CREATED', obligation: created });
    await expect(service.persistCalendarDerived(calendarInput({ origin: secondOrigin }) as any)).resolves.toEqual({ outcome: 'EXISTING', obligation: created });
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
    expect(created.origin).toBe(firstOrigin);
  });

  it('creates a non-calendar obligation with a producer identity', async () => {
    const { service, prisma } = setup();
    const created = { id: 'manual-created' };
    prisma.fiscalObligation.create.mockResolvedValue(created);

    await expect(service.persistNonCalendar(nonCalendarInput() as any)).resolves.toEqual({ outcome: 'CREATED', obligation: created });
    expect(prisma.fiscalObligation.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ fiscalCalendarId: null, origin: 'MANUAL', idempotencyKey: 'manual-2026-07-iva' }) }));
  });

  it('returns the non-calendar row after its expected unique conflict', async () => {
    const { service, prisma } = setup();
    const existing = { id: 'manual-existing' };
    prisma.fiscalObligation.create.mockRejectedValue(nonCalendarConflict);
    prisma.fiscalObligation.findFirst.mockResolvedValue(existing);

    await expect(service.persistNonCalendar(nonCalendarInput() as any)).resolves.toEqual({ outcome: 'EXISTING', obligation: existing });
    expect(prisma.fiscalObligation.findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a', fiscalCalendarId: null, origin: 'MANUAL', idempotencyKey: 'manual-2026-07-iva' } });
  });

  it('allows the same non-calendar key for different origins', async () => {
    const { service, prisma } = setup();
    prisma.fiscalObligation.create.mockResolvedValueOnce({ id: 'manual' }).mockResolvedValueOnce({ id: 'payroll' });

    expect((await service.persistNonCalendar(nonCalendarInput({ origin: 'MANUAL' }) as any)).outcome).toBe('CREATED');
    expect((await service.persistNonCalendar(nonCalendarInput({ origin: 'PAYROLL' }) as any)).outcome).toBe('CREATED');
  });

  it('keeps tenant scope in creates and conflict recovery', async () => {
    const { service, prisma } = setup();
    prisma.fiscalObligation.create.mockResolvedValueOnce({ id: 'tenant-a' }).mockRejectedValueOnce(nonCalendarConflict).mockResolvedValueOnce({ id: 'tenant-b' });
    prisma.fiscalObligation.findFirst.mockResolvedValue({ id: 'tenant-a' });

    await service.persistNonCalendar(nonCalendarInput({ tenantId: 'tenant-a' }) as any);
    await service.persistNonCalendar(nonCalendarInput({ tenantId: 'tenant-a' }) as any);
    await service.persistNonCalendar(nonCalendarInput({ tenantId: 'tenant-b' }) as any);
    expect(prisma.fiscalObligation.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }));
    expect(prisma.fiscalObligation.create).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-b' }) }));
  });

  it('preserves PAID and CANCELLED existing obligations without updating them', async () => {
    const { service, prisma } = setup();
    const paid = { id: 'paid-history', status: 'PAID', amount: 12, title: 'Historic' };
    const cancelled = { id: 'cancelled-history', status: 'CANCELLED', amount: 7, title: 'Cancelled' };
    prisma.fiscalObligation.create.mockRejectedValue(calendarConflict);
    prisma.fiscalObligation.findFirst.mockResolvedValueOnce(paid).mockResolvedValueOnce(cancelled);

    await expect(service.persistCalendarDerived(calendarInput({ title: 'New title' }) as any)).resolves.toEqual({ outcome: 'EXISTING', obligation: paid });
    await expect(service.persistCalendarDerived(calendarInput({ title: 'Another title' }) as any)).resolves.toEqual({ outcome: 'EXISTING', obligation: cancelled });
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.upsert).not.toHaveBeenCalled();
  });

  it('rejects incomplete calendar-derived input', async () => {
    const { service, prisma } = setup();
    await expect(service.persistCalendarDerived(calendarInput({ fiscalCalendarId: ' ', period: '' }) as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.fiscalObligation.create).not.toHaveBeenCalled();
  });

  it('rejects invalid non-calendar input and new LEGACY origin', async () => {
    const { service, prisma } = setup();
    await expect(service.persistNonCalendar(nonCalendarInput({ idempotencyKey: ' ', fiscalCalendarId: 'calendar' }) as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.persistNonCalendar(nonCalendarInput({ fiscalCalendarId: 'calendar' }) as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.persistNonCalendar(nonCalendarInput({ origin: 'LEGACY' }) as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.fiscalObligation.create).not.toHaveBeenCalled();
  });

  it('propagates an unexpected database error', async () => {
    const { service, prisma } = setup();
    const databaseError = Object.assign(new Error('database unavailable'), { code: 'P1001' });
    prisma.fiscalObligation.create.mockRejectedValue(databaseError);

    await expect(service.persistCalendarDerived(calendarInput() as any)).rejects.toBe(databaseError);
    expect(prisma.fiscalObligation.findFirst).not.toHaveBeenCalled();
  });

  it('has no calculation side effects', async () => {
    const { service, prisma } = setup();
    prisma.fiscalObligation.create.mockResolvedValue({ id: 'created' });

    await service.persistCalendarDerived(calendarInput() as any);
    expect(Object.keys(prisma)).toEqual(['fiscalObligation']);
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.upsert).not.toHaveBeenCalled();
  });
});
