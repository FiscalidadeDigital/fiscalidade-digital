import { IndustrialEngine } from './industrial.engine';

describe('IndustrialEngine enrollment resolution', () => {
  it('uses only the Industrial enrollment and does not invent a calculation without one', async () => {
    const enrollments = { resolve: jest.fn().mockResolvedValue(null) };
    const engine = new IndustrialEngine(enrollments as any);
    const result = await engine.calculate('tenant-b', { receitas: 1000, custos: 100 } as any);

    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-b', 'INDUSTRIAL', expect.any(Date));
    expect(result).toEqual(expect.objectContaining({ regime: null, calculationStatus: 'NEEDS_CONFIGURATION', industrialTax: null }));
  });

  it('resolves Industrial enrollment using the requested fiscal date', async () => {
    const enrollments = { resolve: jest.fn().mockResolvedValue(null) };
    const engine = new IndustrialEngine(enrollments as any);

    const result = await engine.calculate('tenant-b', {
      receitas: 1000,
      custos: 100,
      referenceDate: '2026-08-01',
    } as any);

    expect(enrollments.resolve).toHaveBeenCalledWith(
      'tenant-b',
      'INDUSTRIAL',
      new Date('2026-08-01T00:00:00.000Z'),
    );
    expect(result).toEqual(expect.objectContaining({ referenceDate: '2026-08-01' }));
  });
});
