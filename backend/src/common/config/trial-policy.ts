const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const MAX_DATE_IN_MILLISECONDS = 8.64e15;

export const DEFAULT_TRIAL_DURATION_DAYS = 7;

export function calculateTrialEnd(
  startedAt: Date,
  configuredDays = process.env.TRIAL_DURATION_DAYS,
): Date {
  const rawValue = configuredDays?.trim();
  const durationDays = rawValue
    ? Number(rawValue)
    : DEFAULT_TRIAL_DURATION_DAYS;
  const startMilliseconds = startedAt.getTime();
  const endMilliseconds =
    startMilliseconds + durationDays * DAY_IN_MILLISECONDS;

  if (
    !Number.isSafeInteger(durationDays) ||
    durationDays < 1 ||
    !Number.isFinite(startMilliseconds) ||
    !Number.isFinite(endMilliseconds) ||
    Math.abs(endMilliseconds) > MAX_DATE_IN_MILLISECONDS
  ) {
    throw new Error(
      'TRIAL_DURATION_DAYS must be a positive whole number that produces a valid date.',
    );
  }

  return new Date(endMilliseconds);
}
