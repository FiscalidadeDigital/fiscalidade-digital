import { FiscalSituationService } from './fiscal-situation.service';
import { FiscalSituationController } from './fiscal-situation.controller';

const domain = (taxType: string, overrides: any = {}) => ({ taxType, applicabilityStatus: 'APPLICABLE', calculationReady: true, calendarStatus: 'AVAILABLE', reason: 'CURRENT_ENROLLMENT', regime: 'GERAL', validFrom: new Date('2026-01-01'), reviewStatus: 'ACTIVE', ...overrides });

describe('FiscalSituationService', () => {
  function setup(domains: any[], obligation: any = null) {
    const applicability = { assess: jest.fn().mockResolvedValue({ period: '2026-10', domains }) };
    const prisma = { fiscalObligation: { findFirst: jest.fn().mockResolvedValue(obligation), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), delete: jest.fn() } };
    return { service: new FiscalSituationService(applicability as any, prisma as any), applicability, prisma };
  }

  it('uses only the authenticated tenant supplied to the service', async () => {
    const { service, applicability, prisma } = setup([domain('IVA')]);
    await service.get('tenant-b', new Date('2026-10-01'));
    expect(applicability.assess).toHaveBeenCalledWith('tenant-b', expect.any(Date));
    expect(prisma.fiscalObligation.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-b' }) }));
  });

  it('shows IVA and Industrial enrollment independently', async () => {
    const { service } = setup([domain('IVA', { regime: 'GERAL' }), domain('INDUSTRIAL', { regime: 'SIMPLIFICADO' })]);
    const result = await service.get('tenant-a', new Date('2026-10-01'));
    expect(result.taxes).toEqual(expect.arrayContaining([expect.objectContaining({ taxType: 'IVA', enrollment: expect.objectContaining({ regime: 'GERAL' }) }), expect.objectContaining({ taxType: 'INDUSTRIAL', enrollment: expect.objectContaining({ regime: 'SIMPLIFICADO' }) })]));
  });

  it('keeps simplified IVA review visible and disables automation', async () => {
    const { service } = setup([domain('IVA', { regime: 'SIMPLIFICADO', calculationReady: false, reason: 'NEEDS_OFFICIAL_CONFIRMATION' })]);
    const result = await service.get('tenant-a', new Date('2026-10-01'));
    expect(result.taxes[0]).toEqual(expect.objectContaining({ automationReady: false, attentionRequired: true, applicability: expect.objectContaining({ reasonCode: 'NEEDS_OFFICIAL_CONFIRMATION' }) }));
  });

  it.each(['IRT', 'SS', 'SAFT'])('shows %s applicability without inventing an enrollment', async (taxType) => {
    const { service } = setup([domain(taxType, { regime: undefined, reason: taxType === 'SAFT' ? 'IVA_ENROLLMENT_REQUIRES_SAFT_REVIEW' : 'ACTIVE_EMPLOYEES_IN_PERIOD' })]);
    const result = await service.get('tenant-a', new Date('2026-10-01'));
    expect(result.taxes[0]).toEqual(expect.objectContaining({ taxType, enrollment: null }));
  });

  it('selects only pending or late tenant obligations, never paid or cancelled history', async () => {
    const pending = { id: 'pending', type: 'IVA', period: '2026-10', dueDate: new Date('2026-11-15'), status: 'PENDING' };
    const { service, prisma } = setup([domain('IVA')], pending);
    const result = await service.get('tenant-a', new Date('2026-10-01'));
    expect(result.taxes[0].nextObligation).toEqual(pending);
    expect(prisma.fiscalObligation.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: { in: ['PENDING', 'LATE'] } }) }));
  });

  it('shows calendar pending in 2027 without an obligation or copied deadline', async () => {
    const { service, prisma } = setup([domain('IVA', { calendarStatus: 'OFFICIAL_CALENDAR_PENDING' })], { id: '2026-obligation' });
    const result = await service.get('tenant-a', new Date('2027-01-01'));
    expect(result.taxes[0]).toEqual(expect.objectContaining({ calendar: { status: 'OFFICIAL_CALENDAR_PENDING', referenceYear: 2027 }, nextObligation: null, attentionRequired: true }));
    expect(prisma.fiscalObligation.findFirst).toHaveBeenCalled();
  });

  it('is read-only and has no generation or Tenant.regime fallback dependency', async () => {
    const { service, prisma } = setup([domain('IVA')]);
    await service.get('tenant-a', new Date('2026-10-01'));
    expect(prisma.fiscalObligation.create).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.upsert).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.delete).not.toHaveBeenCalled();
    expect(Object.keys(prisma)).toEqual(['fiscalObligation']);
  });
});

describe('FiscalSituationController', () => {
  it('takes tenant identity from the authenticated request, never a query tenantId', async () => {
    const service = { get: jest.fn().mockResolvedValue({}) };
    const controller = new FiscalSituationController(service as any);
    await controller.get({ user: { tenantId: 'tenant-auth' } } as any, '2026-10');
    expect(service.get).toHaveBeenCalledWith('tenant-auth', new Date('2026-10-01T00:00:00.000Z'));
  });
});
