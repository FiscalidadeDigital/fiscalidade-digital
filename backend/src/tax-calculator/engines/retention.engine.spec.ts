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
});
