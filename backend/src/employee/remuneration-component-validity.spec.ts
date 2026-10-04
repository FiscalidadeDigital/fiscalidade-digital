import { Prisma } from '@prisma/client';

/** Matches the inclusive-start/exclusive-end period predicate used by PayrollService. */
function appliesToPeriod(effectiveFrom: Date, effectiveTo: Date | null, periodStart: Date): boolean {
  return effectiveFrom <= periodStart && (effectiveTo === null || effectiveTo > periodStart);
}

describe('remuneration component validity', () => {
  const component = {
    amount: new Prisma.Decimal('50000'),
    effectiveFrom: new Date('2026-10-01T00:00:00.000Z'),
    effectiveTo: new Date('2027-01-01T00:00:00.000Z'),
  };

  it.each([
    ['October 2026', '2026-10-01T00:00:00.000Z', true],
    ['November 2026', '2026-11-01T00:00:00.000Z', true],
    ['January 2027', '2027-01-01T00:00:00.000Z', false],
  ])('includes the component in %s only when its validity covers the period', (_label, period, expected) => {
    expect(appliesToPeriod(component.effectiveFrom, component.effectiveTo, new Date(period))).toBe(expected);
  });
});
