import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FiscalEnrollmentService } from './fiscal-enrollment.service';

describe('FiscalEnrollmentService multi-tax foundation', () => {
  function setup() {
    const prisma = { taxRegimeAssignment: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'e-1', ...data })), update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)) } };
    return { prisma, service: new FiscalEnrollmentService(prisma as any) };
  }

  it('supports independent IVA and Industrial enrollments for one tenant', async () => {
    const { service, prisma } = setup();
    await service.create('tenant-a', { taxType: 'IVA', regime: 'GERAL', validFrom: '2026-01-01' });
    await service.create('tenant-a', { taxType: 'INDUSTRIAL', regime: 'SIMPLIFICADO', validFrom: '2026-01-01' });
    expect(prisma.taxRegimeAssignment.create).toHaveBeenCalledTimes(2);
    expect(prisma.taxRegimeAssignment.create.mock.calls.map((call: any) => call[0].data.taxType)).toEqual(['IVA', 'INDUSTRIAL']);
  });

  it('resolves by tax type and inclusive validity boundaries', async () => {
    const { service, prisma } = setup();
    await service.resolve('tenant-a', 'IVA' as any, new Date('2026-06-30T00:00:00.000Z'));
    expect(prisma.taxRegimeAssignment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a', taxType: 'IVA', validFrom: { lte: new Date('2026-06-30T00:00:00.000Z') }, OR: [{ validUntil: null }, { validUntil: { gte: new Date('2026-06-30T00:00:00.000Z') } }] }) }));
  });

  it('returns no enrollment rather than inferring one from legacy Tenant.regime', async () => {
    const { service } = setup();
    await expect(service.resolve('legacy-tenant', 'IVA' as any, new Date('2026-03-01'))).resolves.toBeNull();
  });

  it('rejects overlapping enrollment periods', async () => {
    const { service, prisma } = setup();
    prisma.taxRegimeAssignment.findFirst.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.create('tenant-a', { taxType: 'IVA', regime: 'GERAL', validFrom: '2026-07-01' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.taxRegimeAssignment.create).not.toHaveBeenCalled();
  });

  it('marks manual assignment for review and never changes Tenant.regime', async () => {
    const { service } = setup();
    const created = await service.create('tenant-a', { taxType: 'IVA', regime: 'GERAL', validFrom: '2026-01-01' });
    expect(created).toEqual(expect.objectContaining({ status: 'ACTIVE', reviewStatus: 'REVIEW_REQUIRED', decisionType: 'MANUAL_REVIEW_REQUIRED' }));
    expect(created).not.toHaveProperty('tenant.regime');
  });

  it('does not allow another tenant to end an enrollment by id', async () => {
    const { service, prisma } = setup();
    prisma.taxRegimeAssignment.findFirst.mockResolvedValueOnce(null);
    await expect(service.end('tenant-b', 'enrollment-a', '2026-12-31')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.taxRegimeAssignment.findFirst).toHaveBeenCalledWith({ where: { id: 'enrollment-a', tenantId: 'tenant-b' } });
    expect(prisma.taxRegimeAssignment.update).not.toHaveBeenCalled();
  });

  it('treats validUntil as inclusive and returns no enrollment on the following day', async () => {
    const { service, prisma } = setup();
    const enrollment = { id: 'iva-a', validFrom: new Date('2026-01-01'), validUntil: new Date('2026-06-30') };
    prisma.taxRegimeAssignment.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.validFrom.lte <= enrollment.validUntil && where.OR[1].validUntil.gte <= enrollment.validUntil ? enrollment : null));
    await expect(service.resolve('tenant-a', 'IVA' as any, new Date('2026-06-30'))).resolves.toEqual(enrollment);
    await expect(service.resolve('tenant-a', 'IVA' as any, new Date('2026-07-01'))).resolves.toBeNull();
  });

  it('resolves historical IVA enrollments without legacy fallback', async () => {
    const { service, prisma } = setup();
    const a = { id: 'a', regime: 'GERAL', validFrom: new Date('2026-01-01'), validUntil: new Date('2026-06-30') };
    const b = { id: 'b', regime: 'SIMPLIFICADO', validFrom: new Date('2026-07-01'), validUntil: null };
    prisma.taxRegimeAssignment.findFirst.mockImplementation(({ where }: any) => { const p = where.validFrom.lte; return Promise.resolve(p < a.validFrom ? null : p <= a.validUntil ? a : b); });
    await expect(service.resolve('tenant-a', 'IVA' as any, new Date('2026-03-15'))).resolves.toEqual(a);
    await expect(service.resolve('tenant-a', 'IVA' as any, new Date('2026-06-30'))).resolves.toEqual(a);
    await expect(service.resolve('tenant-a', 'IVA' as any, new Date('2026-07-01'))).resolves.toEqual(b);
    await expect(service.resolve('tenant-a', 'IVA' as any, new Date('2026-08-15'))).resolves.toEqual(b);
  });

  it('rejects inclusive overlaps but permits the next-day enrollment and another tax', async () => {
    const { service, prisma } = setup();
    const existing = { id: 'iva-a' };
    prisma.taxRegimeAssignment.findFirst.mockResolvedValueOnce(existing).mockResolvedValueOnce(existing).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    await expect(service.create('tenant-a', { taxType: 'IVA', regime: 'GERAL', validFrom: '2026-06-01' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('tenant-a', { taxType: 'IVA', regime: 'GERAL', validFrom: '2026-06-30' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('tenant-a', { taxType: 'IVA', regime: 'GERAL', validFrom: '2026-07-01' })).resolves.toEqual(expect.objectContaining({ taxType: 'IVA' }));
    await expect(service.create('tenant-a', { taxType: 'INDUSTRIAL', regime: 'SIMPLIFICADO', validFrom: '2026-06-01' })).resolves.toEqual(expect.objectContaining({ taxType: 'INDUSTRIAL' }));
  });

  it('preserves legacy Tenant.regime and performs no implicit enrollment backfill', async () => {
    const { service, prisma } = setup();
    const tenant = { regime: 'SIMPLIFICADO', update: jest.fn() };
    const created = await service.create('tenant-a', { taxType: 'IVA', regime: 'GERAL', validFrom: '2026-01-01' });
    await service.resolve('tenant-a', 'IVA' as any, new Date('2026-03-01'));
    prisma.taxRegimeAssignment.findFirst.mockResolvedValueOnce({ id: 'e-1', tenantId: 'tenant-a', validFrom: new Date('2026-01-01') });
    await service.end('tenant-a', 'e-1', '2026-12-31');
    expect(tenant.regime).toBe('SIMPLIFICADO');
    expect(tenant.update).not.toHaveBeenCalled();
    const createsBeforeLegacyResolve = prisma.taxRegimeAssignment.create.mock.calls.length;
    const updatesBeforeLegacyResolve = prisma.taxRegimeAssignment.update.mock.calls.length;
    prisma.taxRegimeAssignment.findFirst.mockResolvedValueOnce(null);
    await expect(service.resolve('legacy-tenant', 'IVA' as any, new Date('2026-03-01'))).resolves.toBeNull();
    expect(prisma.taxRegimeAssignment.create).toHaveBeenCalledTimes(createsBeforeLegacyResolve);
    expect(prisma.taxRegimeAssignment.update).toHaveBeenCalledTimes(updatesBeforeLegacyResolve);
    expect(created).toEqual(expect.objectContaining({ taxType: 'IVA' }));
  });

  it('scopes list, resolve and end operations to the authenticated tenant', async () => {
    const { service, prisma } = setup();
    await service.list('tenant-b');
    expect(prisma.taxRegimeAssignment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 'tenant-b' } }));
    await service.resolve('tenant-b', 'IVA' as any, new Date('2026-03-01'));
    expect(prisma.taxRegimeAssignment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-b', taxType: 'IVA' }) }));
    prisma.taxRegimeAssignment.findFirst.mockResolvedValueOnce(null);
    await expect(service.end('tenant-b', 'assignment-a', '2026-12-31')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.taxRegimeAssignment.findFirst).toHaveBeenLastCalledWith({ where: { id: 'assignment-a', tenantId: 'tenant-b' } });
    expect(prisma.taxRegimeAssignment.update).not.toHaveBeenCalled();
  });
});
