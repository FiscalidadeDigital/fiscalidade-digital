import { Prisma } from '@prisma/client';

export type VatInputStatus =
  | 'PENDING_REVIEW'
  | 'POTENTIALLY_ELIGIBLE'
  | 'DEDUCTIBLE_CONFIRMED'
  | 'NON_DEDUCTIBLE';

export type VatInput = {
  amount: Prisma.Decimal.Value;
  status: VatInputStatus;
};

export type VatAssessment = {
  outputVat: string;
  inputVatIndicated: string;
  inputVatPendingReview: string;
  inputVatPotentiallyEligible: string;
  inputVatDeductibleConfirmed: string;
  inputVatNonDeductible: string;
  priorCredit: string;
  creditGenerated: string;
  payable: string;
  calculationStatus: 'CALCULATED' | 'REVIEW_REQUIRED' | 'CREDIT' | 'ZERO';
};

const money = (value: Prisma.Decimal.Value) =>
  new Prisma.Decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

const serialise = (value: Prisma.Decimal) => value.toFixed(2);

/**
 * Calculates an IVA position without turning indicated input VAT into a tax
 * deduction. The caller is responsible for preserving the source documents
 * and for recording the human review which changes an item to confirmed.
 */
export function calculateVatAssessment(
  outputVat: Prisma.Decimal.Value,
  inputs: VatInput[],
  priorCredit: Prisma.Decimal.Value = 0,
): VatAssessment {
  const buckets = inputs.reduce(
    (current, input) => {
      const amount = money(input.amount);
      current.indicated = current.indicated.plus(amount);

      switch (input.status) {
        case 'DEDUCTIBLE_CONFIRMED':
          current.confirmed = current.confirmed.plus(amount);
          break;
        case 'POTENTIALLY_ELIGIBLE':
          current.potential = current.potential.plus(amount);
          break;
        case 'NON_DEDUCTIBLE':
          current.nonDeductible = current.nonDeductible.plus(amount);
          break;
        default:
          current.pending = current.pending.plus(amount);
      }

      return current;
    },
    {
      indicated: new Prisma.Decimal(0),
      pending: new Prisma.Decimal(0),
      potential: new Prisma.Decimal(0),
      confirmed: new Prisma.Decimal(0),
      nonDeductible: new Prisma.Decimal(0),
    },
  );

  const output = money(outputVat);
  const carriedCredit = money(priorCredit);
  const position = output.minus(buckets.confirmed).minus(carriedCredit);
  const creditGenerated = position.isNegative() ? position.negated() : new Prisma.Decimal(0);
  const payable = position.isNegative() ? new Prisma.Decimal(0) : position;
  const hasReviewItems = buckets.pending.gt(0) || buckets.potential.gt(0);

  return {
    outputVat: serialise(output),
    inputVatIndicated: serialise(buckets.indicated),
    inputVatPendingReview: serialise(buckets.pending),
    inputVatPotentiallyEligible: serialise(buckets.potential),
    inputVatDeductibleConfirmed: serialise(buckets.confirmed),
    inputVatNonDeductible: serialise(buckets.nonDeductible),
    priorCredit: serialise(carriedCredit),
    creditGenerated: serialise(creditGenerated),
    payable: serialise(payable),
    calculationStatus: creditGenerated.gt(0)
      ? 'CREDIT'
      : hasReviewItems
        ? 'REVIEW_REQUIRED'
        : payable.isZero()
          ? 'ZERO'
          : 'CALCULATED',
  };
}

export type PayrollContributions = {
  employee: Prisma.Decimal.Value;
  employer: Prisma.Decimal.Value;
};

export function calculateSocialSecurityTotal(
  contributions: PayrollContributions[],
) {
  const totals = contributions.reduce<{
    employee: Prisma.Decimal;
    employer: Prisma.Decimal;
  }>(
    (current, contribution) => ({
      employee: current.employee.plus(money(contribution.employee)),
      employer: current.employer.plus(money(contribution.employer)),
    }),
    { employee: new Prisma.Decimal(0), employer: new Prisma.Decimal(0) },
  );

  return {
    employee: serialise(totals.employee),
    employer: serialise(totals.employer),
    total: serialise(totals.employee.plus(totals.employer)),
  };
}

/** A revenue/cost input alone is insufficient for a definitive Industrial tax assessment. */
export function industrialAssessmentRequiresReview() {
  return {
    calculationStatus: 'REVIEW_REQUIRED' as const,
    finalAmount: '0.00',
    message:
      'A matéria colectável e os ajustamentos fiscais não estão completos. Nenhum Imposto Industrial definitivo foi calculado.',
  };
}
