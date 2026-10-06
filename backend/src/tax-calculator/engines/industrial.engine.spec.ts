import { IndustrialEngine } from './industrial.engine';

describe('IndustrialEngine enrollment resolution', () => {
  it('uses only the Industrial enrollment and does not invent a calculation without one', async () => {
    const enrollments = { resolve: jest.fn().mockResolvedValue(null) };
    const engine = new IndustrialEngine(enrollments as any);
    const result = await engine.calculate('tenant-b', { receitas: 1000, custos: 100 } as any);

    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-b', 'INDUSTRIAL', expect.any(Date));
    expect(result).toEqual(expect.objectContaining({ regime: null, calculationStatus: 'NEEDS_CONFIGURATION', industrialTax: null }));
  });
});
