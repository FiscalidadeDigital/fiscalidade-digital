import { RetentionEngine } from './retention.engine';

describe('RetentionEngine', () => {
  it('preserves the input monetary decimal and never presents 6.5% as a confirmed rule', async () => {
    const result = await new RetentionEngine().calculate('tenant-a', {
      amount: 100000.015,
    });

    expect(result).toMatchObject({
      tenantId: 'tenant-a',
      amount: '100000.02',
      taxableBase: '100000.02',
      rate: null,
      ratePercent: null,
      retention: null,
      netAmount: null,
      calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION',
      ruleVersion: null,
      legalSource: null,
    });
  });

  it('accepts a zero base without fabricating a retention and rejects a negative base', async () => {
    const engine = new RetentionEngine();

    await expect(engine.calculate('tenant-a', { amount: 0 })).resolves.toMatchObject({
      amount: '0.00',
      retention: null,
      calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION',
    });
    await expect(engine.calculate('tenant-a', { amount: -0.01 })).rejects.toThrow(
      'valor do servi',
    );
  });
});
