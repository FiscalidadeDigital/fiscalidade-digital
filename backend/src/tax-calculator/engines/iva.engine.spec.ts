import { FiscalRegime } from '@prisma/client';
import { IvaEngine } from './iva.engine';
import { IvaOperation } from '../dto/calculate-iva.dto';

describe('IvaEngine enrollment resolution', () => {
  const tenant = { id: 'tenant-a', name: 'A', nif: '500' };
  const setup = (enrollment: any) => {
    const prisma = { tenant: { findUnique: jest.fn().mockResolvedValue(tenant) } };
    const enrollments = { resolve: jest.fn().mockResolvedValue(enrollment) };
    return { engine: new IvaEngine(prisma as any, enrollments as any), enrollments };
  };
  const dto = { amount: 1000, operation: IvaOperation.SALE, productType: 'SERVICO' };

  it('uses the current IVA GENERAL enrollment instead of Tenant.regime', async () => {
    const { engine, enrollments } = setup({ regime: FiscalRegime.GERAL });
    const result = await engine.calculate('tenant-a', dto);
    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-a', 'IVA', expect.any(Date));
    expect(result).toEqual(expect.objectContaining({ regime: 'GERAL', calculationStatus: 'PREVIEW_ONLY', ratePercent: 14 }));
  });

  it('resolves the IVA enrollment using the requested fiscal date instead of today', async () => {
    const { engine, enrollments } = setup({ regime: FiscalRegime.GERAL });

    const result = await engine.calculate('tenant-a', {
      ...dto,
      referenceDate: '2026-04-01',
    });

    expect(enrollments.resolve).toHaveBeenCalledWith(
      'tenant-a',
      'IVA',
      new Date('2026-04-01T00:00:00.000Z'),
    );
    expect(result).toEqual(expect.objectContaining({ referenceDate: '2026-04-01' }));
  });

  it('does not infer IVA from legacy Tenant.regime when enrollment is absent', async () => {
    const { engine } = setup(null);
    const result = await engine.calculate('tenant-a', dto);
    expect(result).toEqual(expect.objectContaining({ regime: null, calculationStatus: 'NEEDS_CONFIGURATION', iva: 0 }));
  });

  it('recognizes IVA SIMPLIFICADO but never invents a settlement formula', async () => {
    const { engine } = setup({ regime: FiscalRegime.SIMPLIFICADO, legalReference: 'source', officialSourceUrl: 'https://example.test' });
    const result = await engine.calculate('tenant-a', dto);
    expect(result).toEqual(expect.objectContaining({ regime: 'SIMPLIFICADO', calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION', iva: 0, ratePercent: 0 }));
  });
});
