import { Prisma, SocialSecurityCategory } from '@prisma/client';

import {
  assertSupportedPayrollYear,
  IRT_ALLOWANCE_EXEMPT_LIMITS,
  IRT_GROUP_A_2026_BRACKETS,
  PAYROLL_CALCULATION_STATUS,
  PAYROLL_RULE_VERSION_2026,
  resolveSocialSecurityRates,
} from '../fiscal-rules/payroll-rules';

type DecimalValue = Prisma.Decimal.Value;

export type PayrollCalculationInput = {
  year: number;
  socialSecurityCategory: SocialSecurityCategory;
  baseSalary: DecimalValue;
  foodAllowance?: DecimalValue | null;
  transportAllowance?: DecimalValue | null;
  otherAllowances?: DecimalValue | null;
  bonuses?: DecimalValue | null;
  commissions?: DecimalValue | null;
  otherIncome?: DecimalValue | null;
  otherDeductions?: DecimalValue | null;
};

export type PayrollCalculation = {
  grossAmount: Prisma.Decimal;
  socialSecurityBase: Prisma.Decimal;
  employeeSocialSecurityRate: Prisma.Decimal;
  socialSecurityAmount: Prisma.Decimal;
  employerSocialSecurityRate: Prisma.Decimal;
  employerSocialSecurityAmount: Prisma.Decimal;
  irtTaxableAmount: Prisma.Decimal;
  irtAmount: Prisma.Decimal;
  otherDeductions: Prisma.Decimal;
  netAmount: Prisma.Decimal;
  taxRuleVersion: string;
  calculationStatus: string;
};

const ZERO = new Prisma.Decimal(0);

function decimal(value: DecimalValue | null | undefined): Prisma.Decimal {
  return new Prisma.Decimal(value ?? 0);
}

function money(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

function nonNegative(value: Prisma.Decimal): Prisma.Decimal {
  return value.isNegative() ? ZERO : value;
}

function minimum(
  left: Prisma.Decimal,
  right: Prisma.Decimal,
): Prisma.Decimal {
  return left.lessThan(right) ? left : right;
}

export function calculateIrtGroupA2026(
  taxableAmount: DecimalValue,
): Prisma.Decimal {
  const amount = money(nonNegative(decimal(taxableAmount)));
  const bracket = IRT_GROUP_A_2026_BRACKETS.find(
    (candidate) =>
      candidate.upperBound === null || amount.lessThanOrEqualTo(candidate.upperBound),
  );

  if (!bracket || bracket.rate.isZero()) {
    return ZERO;
  }

  return money(
    bracket.fixedAmount.add(
      amount.sub(bracket.excessOver).mul(bracket.rate),
    ),
  );
}

export function calculatePayrollItem(
  input: PayrollCalculationInput,
): PayrollCalculation {
  assertSupportedPayrollYear(input.year);

  const baseSalary = money(nonNegative(decimal(input.baseSalary)));
  const foodAllowance = money(nonNegative(decimal(input.foodAllowance)));
  const transportAllowance = money(
    nonNegative(decimal(input.transportAllowance)),
  );
  const otherAllowances = money(
    nonNegative(decimal(input.otherAllowances)),
  );
  const bonuses = money(nonNegative(decimal(input.bonuses)));
  const commissions = money(nonNegative(decimal(input.commissions)));
  const otherIncome = money(nonNegative(decimal(input.otherIncome)));
  const otherDeductions = money(
    nonNegative(decimal(input.otherDeductions)),
  );
  const grossAmount = money(
    baseSalary
      .add(foodAllowance)
      .add(transportAllowance)
      .add(otherAllowances)
      .add(bonuses)
      .add(commissions)
      .add(otherIncome),
  );
  const socialSecurityBase = grossAmount;
  const rates = resolveSocialSecurityRates(input.socialSecurityCategory);
  const socialSecurityAmount = money(
    socialSecurityBase.mul(rates.employee),
  );
  const employerSocialSecurityAmount = money(
    socialSecurityBase.mul(rates.employer),
  );
  const exemptFood = minimum(
    foodAllowance,
    IRT_ALLOWANCE_EXEMPT_LIMITS.food,
  );
  const exemptTransport = minimum(
    transportAllowance,
    IRT_ALLOWANCE_EXEMPT_LIMITS.transport,
  );
  const irtTaxableAmount = money(
    nonNegative(
      grossAmount
        .sub(socialSecurityAmount)
        .sub(exemptFood)
        .sub(exemptTransport),
    ),
  );
  const irtAmount = calculateIrtGroupA2026(irtTaxableAmount);
  const netAmount = money(
    grossAmount
      .sub(socialSecurityAmount)
      .sub(irtAmount)
      .sub(otherDeductions),
  );

  return {
    grossAmount,
    socialSecurityBase,
    employeeSocialSecurityRate: rates.employee,
    socialSecurityAmount,
    employerSocialSecurityRate: rates.employer,
    employerSocialSecurityAmount,
    irtTaxableAmount,
    irtAmount,
    otherDeductions,
    netAmount,
    taxRuleVersion: PAYROLL_RULE_VERSION_2026,
    calculationStatus: PAYROLL_CALCULATION_STATUS,
  };
}
