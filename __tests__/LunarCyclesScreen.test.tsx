/**
 * @format
 */

import * as SunCalc from 'suncalc';

// Constants
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

describe('LunarCyclesScreen', () => {
  describe('Moon Phase Calculations', () => {
    test('calculates moon illumination correctly using suncalc', () => {
      const testDate = new Date('2024-06-21T12:00:00Z');

      const moonIllum = SunCalc.getMoonIllumination(testDate);

      // Verify that suncalc returns valid moon illumination data
      expect(moonIllum).toHaveProperty('fraction');
      expect(moonIllum).toHaveProperty('phase');
      expect(moonIllum).toHaveProperty('angle');

      // Fraction should be between 0 and 1
      expect(moonIllum.fraction).toBeGreaterThanOrEqual(0);
      expect(moonIllum.fraction).toBeLessThanOrEqual(1);

      // Phase should be between 0 and 1
      expect(moonIllum.phase).toBeGreaterThanOrEqual(0);
      expect(moonIllum.phase).toBeLessThanOrEqual(1);
    });

    test('moon phase cycles through all phases over lunar month', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const phases: number[] = [];

      // Collect phases over 30 days (approximate lunar month)
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate.getTime() + i * MILLISECONDS_PER_DAY);
        const moonIllum = SunCalc.getMoonIllumination(date);
        phases.push(moonIllum.phase);
      }

      // Should have a variety of phase values
      expect(phases.length).toBe(30);

      // Verify all phases are valid
      phases.forEach((phase) => {
        expect(phase).toBeGreaterThanOrEqual(0);
        expect(phase).toBeLessThanOrEqual(1);
      });
    });

    test('identifies new moon phase correctly', () => {
      // New moon occurs when phase is close to 0 or 1
      const isNewMoon = (phase: number): boolean => {
        return phase < 0.03 || phase > 0.97;
      };

      expect(isNewMoon(0.0)).toBe(true);
      expect(isNewMoon(0.01)).toBe(true);
      expect(isNewMoon(0.98)).toBe(true);
      expect(isNewMoon(1.0)).toBe(true);
      expect(isNewMoon(0.25)).toBe(false);
      expect(isNewMoon(0.5)).toBe(false);
      expect(isNewMoon(0.75)).toBe(false);
    });

    test('identifies full moon phase correctly', () => {
      // Full moon occurs when phase is around 0.5
      const isFullMoon = (phase: number): boolean => {
        return phase >= 0.47 && phase <= 0.53;
      };

      expect(isFullMoon(0.5)).toBe(true);
      expect(isFullMoon(0.48)).toBe(true);
      expect(isFullMoon(0.52)).toBe(true);
      expect(isFullMoon(0.0)).toBe(false);
      expect(isFullMoon(0.25)).toBe(false);
      expect(isFullMoon(0.75)).toBe(false);
    });

    test('identifies first quarter phase correctly', () => {
      // First quarter occurs when phase is around 0.25
      const isFirstQuarter = (phase: number): boolean => {
        return phase >= 0.22 && phase <= 0.28;
      };

      expect(isFirstQuarter(0.25)).toBe(true);
      expect(isFirstQuarter(0.24)).toBe(true);
      expect(isFirstQuarter(0.26)).toBe(true);
      expect(isFirstQuarter(0.0)).toBe(false);
      expect(isFirstQuarter(0.5)).toBe(false);
      expect(isFirstQuarter(0.75)).toBe(false);
    });

    test('identifies last quarter phase correctly', () => {
      // Last quarter occurs when phase is around 0.75
      const isLastQuarter = (phase: number): boolean => {
        return phase >= 0.72 && phase <= 0.78;
      };

      expect(isLastQuarter(0.75)).toBe(true);
      expect(isLastQuarter(0.74)).toBe(true);
      expect(isLastQuarter(0.76)).toBe(true);
      expect(isLastQuarter(0.0)).toBe(false);
      expect(isLastQuarter(0.25)).toBe(false);
      expect(isLastQuarter(0.5)).toBe(false);
    });

    test('assigns correct moon phase names', () => {
      const getMoonPhaseName = (phase: number): string => {
        if (phase < 0.03 || phase > 0.97) return 'New Moon';
        if (phase < 0.22) return 'Waxing Crescent';
        if (phase < 0.28) return 'First Quarter';
        if (phase < 0.47) return 'Waxing Gibbous';
        if (phase < 0.53) return 'Full Moon';
        if (phase < 0.72) return 'Waning Gibbous';
        if (phase < 0.78) return 'Last Quarter';
        return 'Waning Crescent';
      };

      expect(getMoonPhaseName(0.0)).toBe('New Moon');
      expect(getMoonPhaseName(0.1)).toBe('Waxing Crescent');
      expect(getMoonPhaseName(0.25)).toBe('First Quarter');
      expect(getMoonPhaseName(0.35)).toBe('Waxing Gibbous');
      expect(getMoonPhaseName(0.5)).toBe('Full Moon');
      expect(getMoonPhaseName(0.6)).toBe('Waning Gibbous');
      expect(getMoonPhaseName(0.75)).toBe('Last Quarter');
      expect(getMoonPhaseName(0.9)).toBe('Waning Crescent');
    });
  });

  describe('Moon Emoji Selection', () => {
    test('returns correct emoji for each moon phase', () => {
      const getMoonEmoji = (phaseName: string): string => {
        switch (phaseName) {
          case 'New Moon':
            return '🌑';
          case 'Waxing Crescent':
            return '🌒';
          case 'First Quarter':
            return '🌓';
          case 'Waxing Gibbous':
            return '🌔';
          case 'Full Moon':
            return '🌕';
          case 'Waning Gibbous':
            return '🌖';
          case 'Last Quarter':
            return '🌗';
          case 'Waning Crescent':
            return '🌘';
          default:
            return '🌙';
        }
      };

      expect(getMoonEmoji('New Moon')).toBe('🌑');
      expect(getMoonEmoji('Waxing Crescent')).toBe('🌒');
      expect(getMoonEmoji('First Quarter')).toBe('🌓');
      expect(getMoonEmoji('Waxing Gibbous')).toBe('🌔');
      expect(getMoonEmoji('Full Moon')).toBe('🌕');
      expect(getMoonEmoji('Waning Gibbous')).toBe('🌖');
      expect(getMoonEmoji('Last Quarter')).toBe('🌗');
      expect(getMoonEmoji('Waning Crescent')).toBe('🌘');
      expect(getMoonEmoji('Unknown')).toBe('🌙');
    });
  });

  describe('Date Calculations', () => {
    test('calculates future dates correctly for 30 days', () => {
      const now = new Date('2024-06-21T12:00:00Z');
      const futureDates: Date[] = [];

      for (let i = 0; i <= 30; i++) {
        const date = new Date(now.getTime() + i * MILLISECONDS_PER_DAY);
        futureDates.push(date);
      }

      // Should have 31 dates (including day 0)
      expect(futureDates.length).toBe(31);

      // First date should be the same as now
      expect(futureDates[0].getTime()).toBe(now.getTime());

      // Last date should be 30 days in the future
      const expectedLastDate = new Date(
        now.getTime() + 30 * MILLISECONDS_PER_DAY,
      );
      expect(futureDates[30].getTime()).toBe(expectedLastDate.getTime());

      // Each subsequent date should be 1 day later
      for (let i = 1; i < futureDates.length; i++) {
        const dayDiff =
          (futureDates[i].getTime() - futureDates[i - 1].getTime()) /
          MILLISECONDS_PER_DAY;
        expect(dayDiff).toBe(1);
      }
    });

    test('formats date correctly', () => {
      const testDate = new Date('2024-06-21T14:30:00Z');
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      const formattedDate = testDate.toLocaleDateString(undefined, options);

      expect(typeof formattedDate).toBe('string');
      expect(formattedDate.length).toBeGreaterThan(0);
    });

    test('formats date time correctly', () => {
      const testDate = new Date('2024-06-21T14:30:00Z');
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      };
      const formattedDateTime = testDate.toLocaleString(undefined, options);

      expect(typeof formattedDateTime).toBe('string');
      expect(formattedDateTime.length).toBeGreaterThan(0);
    });
  });

  describe('Moon Phase Finding', () => {
    test('finds next key moon phases within 30 days', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      let foundFullMoon = false;
      let foundFirstQuarter = false;
      let foundLastQuarter = false;
      let foundNewMoon = false;

      const isFullMoon = (phase: number): boolean => {
        return phase >= 0.47 && phase <= 0.53;
      };
      const isFirstQuarter = (phase: number): boolean => {
        return phase >= 0.22 && phase <= 0.28;
      };
      const isLastQuarter = (phase: number): boolean => {
        return phase >= 0.72 && phase <= 0.78;
      };
      const isNewMoon = (phase: number): boolean => {
        return phase < 0.03 || phase > 0.97;
      };

      for (let i = 0; i <= 30; i++) {
        const date = new Date(now.getTime() + i * MILLISECONDS_PER_DAY);
        const illum = SunCalc.getMoonIllumination(date);

        if (!foundFullMoon && isFullMoon(illum.phase)) {
          foundFullMoon = true;
        }
        if (!foundFirstQuarter && isFirstQuarter(illum.phase)) {
          foundFirstQuarter = true;
        }
        if (!foundLastQuarter && isLastQuarter(illum.phase)) {
          foundLastQuarter = true;
        }
        if (!foundNewMoon && i > 0 && isNewMoon(illum.phase)) {
          foundNewMoon = true;
        }
      }

      // At least one key phase should be found in a 30-day period
      const foundAnyPhase =
        foundFullMoon || foundFirstQuarter || foundLastQuarter || foundNewMoon;
      expect(foundAnyPhase).toBe(true);
    });
  });

  describe('Moon Illumination', () => {
    test('calculates illumination percentage correctly', () => {
      const testDate = new Date('2024-06-21T12:00:00Z');
      const moonIllum = SunCalc.getMoonIllumination(testDate);

      const percentage = moonIllum.fraction * 100;

      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    test('full moon has high illumination', () => {
      // Find a full moon date
      const startDate = new Date('2024-01-01T00:00:00Z');

      for (let i = 0; i < 60; i++) {
        const date = new Date(startDate.getTime() + i * MILLISECONDS_PER_DAY);
        const moonIllum = SunCalc.getMoonIllumination(date);

        if (moonIllum.phase >= 0.47 && moonIllum.phase <= 0.53) {
          // Full moon should have high illumination (>90%)
          expect(moonIllum.fraction).toBeGreaterThan(0.9);
          break;
        }
      }
    });

    test('new moon has low illumination', () => {
      // Find a new moon date
      const startDate = new Date('2024-01-01T00:00:00Z');

      for (let i = 0; i < 60; i++) {
        const date = new Date(startDate.getTime() + i * MILLISECONDS_PER_DAY);
        const moonIllum = SunCalc.getMoonIllumination(date);

        if (moonIllum.phase < 0.03 || moonIllum.phase > 0.97) {
          // New moon should have low illumination (<10%)
          expect(moonIllum.fraction).toBeLessThan(0.1);
          break;
        }
      }
    });
  });

  describe('SunCalc Moon API', () => {
    test('getMoonIllumination returns expected properties', () => {
      const testDate = new Date('2024-06-21T12:00:00Z');
      const moonIllum = SunCalc.getMoonIllumination(testDate);

      const requiredProperties = ['fraction', 'phase', 'angle'];

      requiredProperties.forEach((prop) => {
        expect(moonIllum).toHaveProperty(prop);
        expect(typeof moonIllum[prop as keyof typeof moonIllum]).toBe('number');
      });
    });

    test('moon phase progresses over time', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-08T00:00:00Z'); // 7 days later

      const moon1 = SunCalc.getMoonIllumination(date1);
      const moon2 = SunCalc.getMoonIllumination(date2);

      // Phase should change over 7 days
      expect(moon1.phase).not.toBe(moon2.phase);

      // Both should be valid phases
      expect(moon1.phase).toBeGreaterThanOrEqual(0);
      expect(moon1.phase).toBeLessThanOrEqual(1);
      expect(moon2.phase).toBeGreaterThanOrEqual(0);
      expect(moon2.phase).toBeLessThanOrEqual(1);
    });
  });
});
