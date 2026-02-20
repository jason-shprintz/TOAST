/**
 * @format
 */

import {
  getPressureTrend,
  getTrendInterpretation,
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
});
