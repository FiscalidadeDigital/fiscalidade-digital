import { IndustrialEngine } from './industrial.engine';

describe('IndustrialEngine enrollment resolution', () => {
  it('uses only the Industrial enrollment and does not invent a calculation without one', async () => {
    const enrollments = { resolve: jest.fn().mockResolvedValue(null) };
    const engine = new IndustrialEngine(enrollments as any);
    const result = await engine.calculate('tenant-b', { receitas: 1000, custos: 100 } as any);

    expect(enrollments.resolve).toHaveBeenCalledWith('tenant-b', 'INDUSTRIAL', expect.any(Date));
    expect(result).toEqual(expect.objectContaining({ regime: null, calculationStatus: 'NEEDS_CONFIGURATION', industrialTax: null }));
  });

  it('keeps Industrial provisional and definitive tax undetermined when the input lacks the legally required facts', async () => {
    const enrollments = { resolve: jest.fn().mockResolvedValue({ regime: 'GERAL' }) };
    const engine = new IndustrialEngine(enrollments as any);

    const result = await engine.calculate('tenant-b', {
      receitas: 1000000,
      custos: 300000,
      referenceDate: '2026-08-01',
    } as any);

    expect(result).toEqual(
      expect.objectContaining({
        regime: 'GERAL',
        calculationStatus: 'REVIEW_REQUIRED',
        industrialTax: null,
        provisionalTax: null,
        rate: null,
      }),
    );
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

  it('rejects an impossible Industrial fiscal date before resolving an enrollment', async () => {
    const enrollments = { resolve: jest.fn().mockResolvedValue(null) };
    const engine = new IndustrialEngine(enrollments as any);

    await expect(
      engine.calculate('tenant-b', {
        receitas: 1000,
        custos: 100,
        referenceDate: '2026-02-30',
      } as any),
    ).rejects.toThrow('data fiscal');

    expect(enrollments.resolve).not.toHaveBeenCalled();
  });

  it('rejects negative Industrial amounts instead of inventing a tax base', async () => {
    const enrollments = { resolve: jest.fn() };
    const engine = new IndustrialEngine(enrollments as any);

    await expect(
      engine.calculate('tenant-b', { receitas: -0.01, custos: 0 } as any),
    ).rejects.toThrow('Receitas e custos');

    expect(enrollments.resolve).not.toHaveBeenCalled();
  });
});
