import {
  calculateTrialEnd,
  DEFAULT_TRIAL_DURATION_DAYS,
} from './trial-policy';

describe('trial policy', () => {
  const startedAt = new Date('2026-09-29T00:00:00.000Z');

  it('defaults new trials to seven days', () => {
    expect(DEFAULT_TRIAL_DURATION_DAYS).toBe(7);
    expect(calculateTrialEnd(startedAt, '').toISOString()).toBe(
      '2026-10-06T00:00:00.000Z',
    );
  });

  it('accepts an explicitly configured whole-number duration', () => {
    expect(calculateTrialEnd(startedAt, '14').toISOString()).toBe(
      '2026-10-13T00:00:00.000Z',
    );
  });

  it.each(['0', '-1', '1.5', '300000000', 'invalid'])(
    'rejects invalid duration %s',
    (configuredDays) => {
      expect(() => calculateTrialEnd(startedAt, configuredDays)).toThrow(
        'TRIAL_DURATION_DAYS must be a positive whole number that produces a valid date.',
      );
    },
  );

  it('rejects an invalid start timestamp', () => {
    expect(() => calculateTrialEnd(new Date(Number.NaN), '7')).toThrow();
  });
});
