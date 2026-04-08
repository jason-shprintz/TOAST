/**
 * @format
 */

import {
  getPressureTrend,
  getTrendInterpretation,
  hasSufficientDataForTrend,
  hpaToInhg,
} from '../src/utils/barometricPressure';

describe('barometricPressure utils', () => {
  describe('hpaToInhg', () => {
    test('converts standard sea-level pressure correctly', () => {
      // 1013.25 hPa = 29.9212 inHg
      const result = hpaToInhg(1013.25);
      expect(result).toBeCloseTo(29.92, 1);
    });

    test('returns 0 for 0 hPa', () => {
      expect(hpaToInhg(0)).toBe(0);
    });

    test('scales linearly', () => {
      const double = hpaToInhg(2000);
      const single = hpaToInhg(1000);
      expect(double).toBeCloseTo(single * 2, 5);
    });
  });

  describe('getPressureTrend', () => {
    test('returns Steady for an empty array', () => {
      expect(getPressureTrend([])).toBe('Steady');
    });

    test('returns Steady for a single reading', () => {
      expect(getPressureTrend([1013])).toBe('Steady');
    });

    test('returns Rising when pressure increased by ≥1 hPa', () => {
      expect(getPressureTrend([1010, 1011, 1012])).toBe('Rising');
    });

    test('returns Falling when pressure decreased by ≥1 hPa', () => {
      expect(getPressureTrend([1015, 1014, 1013])).toBe('Falling');
    });

    test('returns Steady when delta is within ±1 hPa', () => {
      expect(getPressureTrend([1013, 1013.4, 1013.8])).toBe('Steady');
    });

    test('returns Steady for identical readings', () => {
      expect(getPressureTrend([1013, 1013, 1013])).toBe('Steady');
    });

    test('uses first and last readings only for delta calculation', () => {
      // Spike in the middle — what matters is first vs last
      expect(getPressureTrend([1010, 1020, 1010])).toBe('Steady');
    });

    test('returns Rising at exactly the rising threshold', () => {
      expect(getPressureTrend([1010, 1011])).toBe('Rising');
    });

    test('returns Falling at exactly the falling threshold', () => {
      expect(getPressureTrend([1011, 1010])).toBe('Falling');
    });
  });

  describe('getTrendInterpretation', () => {
    test('returns rising interpretation for Rising trend', () => {
      const result = getTrendInterpretation('Rising');
      expect(result).toMatch(/clearing/i);
    });

    test('returns falling interpretation for Falling trend', () => {
      const result = getTrendInterpretation('Falling');
      expect(result).toMatch(/incoming weather/i);
    });

    test('returns steady interpretation for Steady trend', () => {
      const result = getTrendInterpretation('Steady');
      expect(result).toMatch(/stable/i);
    });

    test('returns a non-empty string for every trend value', () => {
      const trends = ['Rising', 'Steady', 'Falling'] as const;
      trends.forEach((t) => {
        expect(getTrendInterpretation(t).length).toBeGreaterThan(0);
      });
    });
  });

  describe('hasSufficientDataForTrend', () => {
    const ONE_HOUR_MS = 60 * 60 * 1000;

    test('returns false for an empty array', () => {
      expect(hasSufficientDataForTrend([], ONE_HOUR_MS)).toBe(false);
    });

    test('returns false for a single sample', () => {
      expect(
        hasSufficientDataForTrend([{ timestamp: Date.now() }], ONE_HOUR_MS),
      ).toBe(false);
    });

    test('returns false when span is less than 50% of the window', () => {
      const now = Date.now();
      // Two samples only 20 min apart; 3 h window requires 1.5 h coverage
      const samples = [{ timestamp: now - 20 * 60 * 1000 }, { timestamp: now }];
      expect(hasSufficientDataForTrend(samples, 3 * ONE_HOUR_MS)).toBe(false);
    });

    test('returns true when span exactly equals 50% of the window', () => {
      const now = Date.now();
      // 3 h window → needs 1.5 h span → exactly 90 min
      const samples = [{ timestamp: now - 90 * 60 * 1000 }, { timestamp: now }];
      expect(hasSufficientDataForTrend(samples, 3 * ONE_HOUR_MS)).toBe(true);
    });

    test('returns true when span exceeds 50% of the window', () => {
      const now = Date.now();
      // 1 h window → needs 30 min span → 45 min is more than enough
      const samples = [{ timestamp: now - 45 * 60 * 1000 }, { timestamp: now }];
      expect(hasSufficientDataForTrend(samples, ONE_HOUR_MS)).toBe(true);
    });

    test('returns true when span covers the full window', () => {
      const now = Date.now();
      // 24 h window; spread samples across the full 24 h
      const samples = [
        { timestamp: now - 24 * ONE_HOUR_MS },
        { timestamp: now - 12 * ONE_HOUR_MS },
        { timestamp: now },
      ];
      expect(hasSufficientDataForTrend(samples, 24 * ONE_HOUR_MS)).toBe(true);
    });

    test('evaluates span based on first and last sample only', () => {
      const now = Date.now();
      // Middle sample is irrelevant; first–last span is 2 h on a 3 h window
      const samples = [
        { timestamp: now - 2 * ONE_HOUR_MS },
        { timestamp: now - 30 * 60 * 1000 }, // middle
        { timestamp: now },
      ];
      // 2 h span ≥ 1.5 h required → sufficient
      expect(hasSufficientDataForTrend(samples, 3 * ONE_HOUR_MS)).toBe(true);
    });
  });
});
