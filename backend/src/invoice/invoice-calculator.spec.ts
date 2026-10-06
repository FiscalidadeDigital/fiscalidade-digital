import { calculateInvoiceAmounts } from './invoice-calculator';

describe('calculateInvoiceAmounts', () => {
  it('calculates the confirmed general-rate arithmetic for an eligible base', () => {
    const result = calculateInvoiceAmounts(
      [{ quantity: 1, unitPrice: 100000 }],
      0.14,
      0,
    );

    expect(result.subtotal.toFixed(2)).toBe('100000.00');
    expect(result.iva.toFixed(2)).toBe('14000.00');
    expect(result.total.toFixed(2)).toBe('114000.00');
  });

  it('uses decimal arithmetic and mathematical rounding to two money places', () => {
    const result = calculateInvoiceAmounts(
      [
        { quantity: 3, unitPrice: 0.1 },
        { quantity: 1.5, unitPrice: 100.05 },
      ],
      0.14,
      0,
    );

    expect(result.lines.map((line) => line.total.toFixed(2))).toEqual([
      '0.30',
      '150.08',
    ]);
    expect(result.subtotal.toFixed(2)).toBe('150.38');
    expect(result.iva.toFixed(2)).toBe('21.05');
    expect(result.total.toFixed(2)).toBe('171.43');
  });

  it('applies an explicitly configured retention without binary float drift', () => {
    const result = calculateInvoiceAmounts(
      [{ quantity: 1, unitPrice: 999.99 }],
      0,
      0.065,
    );

    expect(result.withholdingTax.toFixed(2)).toBe('65.00');
    expect(result.total.toFixed(2)).toBe('934.99');
  });
});
