import { SocialSecurityCategory } from '@prisma/client';

import {
  calculateIrtGroupA2026,
  calculatePayrollItem,
} from './payroll-calculator';

describe('payroll calculator', () => {
  it.each([
    ['0', '0.00'],
    ['150000', '0.00'],
    ['200000', '20500.00'],
    ['300000', '49250.00'],
    ['500000', '87250.00'],
    ['1000000', '187250.00'],
    ['2500000', '517250.00'],
    ['10000000', '2342250.00'],
    ['11000000', '2592250.00'],
  ])('applies the official 2026 Group A bracket at %s', (input, expected) => {
    expect(calculateIrtGroupA2026(input).toFixed(2)).toBe(expected);
  });

  it('calculates standard employee and employer social security with Decimal', () => {
    const result = calculatePayrollItem({
      year: 2026,
      socialSecurityCategory: SocialSecurityCategory.STANDARD,
      baseSalary: '200000.10',
      foodAllowance: '30000.10',
      transportAllowance: '30000.10',
      otherAllowances: '0.10',
    });

    expect(result.grossAmount.toFixed(2)).toBe('260000.40');
    expect(result.socialSecurityAmount.toFixed(2)).toBe('7800.01');
    expect(result.employerSocialSecurityAmount.toFixed(2)).toBe('20800.03');
    expect(result.irtTaxableAmount.toFixed(2)).toBe('192200.39');
    expect(result.irtAmount.toFixed(2)).toBe('19252.06');
    expect(result.netAmount.toFixed(2)).toBe('232948.33');
  });

  it('uses the 8% worker rate for a retired worker', () => {
    const result = calculatePayrollItem({
      year: 2026,
      socialSecurityCategory: SocialSecurityCategory.RETIRED,
      baseSalary: '100000',
    });

    expect(result.socialSecurityAmount.toFixed(2)).toBe('8000.00');
    expect(result.employerSocialSecurityAmount.toFixed(2)).toBe('8000.00');
  });

  it('fails closed for an unconfigured special social security regime', () => {
    expect(() =>
      calculatePayrollItem({
        year: 2026,
        socialSecurityCategory: SocialSecurityCategory.SPECIAL,
        baseSalary: '100000',
      }),
    ).toThrow('regime especial');
  });

  it('continues a rule without a validTo into 2027', () => {
    const result = calculatePayrollItem({
      year: 2027,
      socialSecurityCategory: SocialSecurityCategory.STANDARD,
      baseSalary: '100000',
    });

    expect(result.taxRuleVersion).toContain('2026');
  });

  it('excludes holiday allowance from the INSS contribution base', () => {
    const result = calculatePayrollItem({
      year: 2026,
      socialSecurityCategory: SocialSecurityCategory.STANDARD,
      baseSalary: '100000',
      holidayAllowance: '50000',
    });

    expect(result.grossAmount.toFixed(2)).toBe('150000.00');
    expect(result.socialSecurityBase.toFixed(2)).toBe('100000.00');
    expect(result.socialSecurityAmount.toFixed(2)).toBe('3000.00');
  });
});
