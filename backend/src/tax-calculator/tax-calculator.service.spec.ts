import { TaxCalculatorService } from './tax-calculator.service';

describe('TaxCalculatorService', () => {
  const ivaEngine = { calculate: jest.fn() };
  const retentionEngine = { calculate: jest.fn() };
  const industrialEngine = { calculate: jest.fn() };
  const service = new TaxCalculatorService(
    ivaEngine as any,
    retentionEngine as any,
    industrialEngine as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates IVA, retention and Industrial requests without a second calculation path', async () => {
    const ivaPayload = {
      amount: 1000.05,
      operation: 'SALE',
      referenceDate: '2026-04-01',
    } as any;
    const industrialPayload = {
      receitas: 1000,
      custos: 250,
      referenceDate: '2026-08-01',
    } as any;

    ivaEngine.calculate.mockResolvedValue({ iva: 140.01 });
    retentionEngine.calculate.mockResolvedValue({ retention: null });
    industrialEngine.calculate.mockResolvedValue({ industrialTax: null });

    await expect(service.calculateIVA('tenant-a', ivaPayload)).resolves.toEqual({
      iva: 140.01,
    });
    await expect(service.calculateRetention('tenant-a', { amount: 1000 } as any)).resolves.toEqual({
      retention: null,
    });
    await expect(
      service.calculateIndustrial('tenant-a', industrialPayload),
    ).resolves.toEqual({ industrialTax: null });

    expect(ivaEngine.calculate).toHaveBeenCalledWith('tenant-a', ivaPayload);
    expect(retentionEngine.calculate).toHaveBeenCalledWith('tenant-a', {
      amount: 1000,
    });
    expect(industrialEngine.calculate).toHaveBeenCalledWith(
      'tenant-a',
      industrialPayload,
    );
  });
});
