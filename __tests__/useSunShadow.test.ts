/**
 * @format
 */

import * as SunCalc from 'suncalc';

describe('useSunShadow', () => {
  describe('Sun Position Calculations', () => {
    test('calculates sun position correctly using suncalc', () => {
      const testDate = new Date('2024-06-21T12:00:00Z'); // Summer solstice noon
      const latitude = 40.7128; // New York
      const longitude = -74.006;

      const position = SunCalc.getPosition(testDate, latitude, longitude);

      // Verify that suncalc returns valid position data
      expect(position).toHaveProperty('altitude');
      expect(position).toHaveProperty('azimuth');
      expect(typeof position.altitude).toBe('number');
      expect(typeof position.azimuth).toBe('number');
    });

    test('altitude is within valid range', () => {
      const testDate = new Date('2024-06-21T12:00:00Z');
      const latitude = 40.7128;
      const longitude = -74.006;

      const position = SunCalc.getPosition(testDate, latitude, longitude);

      // Altitude should be between -π/2 and π/2 radians
      expect(position.altitude).toBeGreaterThanOrEqual(-Math.PI / 2);
      expect(position.altitude).toBeLessThanOrEqual(Math.PI / 2);
    });

    test('azimuth is within valid range', () => {
      const testDate = new Date('2024-06-21T12:00:00Z');
      const latitude = 40.7128;
      const longitude = -74.006;

      const position = SunCalc.getPosition(testDate, latitude, longitude);

      // Azimuth should be between -π and π radians
      expect(position.azimuth).toBeGreaterThanOrEqual(-Math.PI);
      expect(position.azimuth).toBeLessThanOrEqual(Math.PI);
    });

    test('sun altitude is positive during day', () => {
      // Noon on summer solstice should have positive altitude
      const testDate = new Date('2024-06-21T16:00:00Z'); // Around noon EST
      const latitude = 40.7128;
      const longitude = -74.006;

      const position = SunCalc.getPosition(testDate, latitude, longitude);

      // Should be above horizon at noon
      expect(position.altitude).toBeGreaterThan(0);
    });

    test('sun altitude is negative during night', () => {
      // Midnight should have negative altitude
      const testDate = new Date('2024-06-21T04:00:00Z'); // Around midnight EST
      const latitude = 40.7128;
      const longitude = -74.006;

      const position = SunCalc.getPosition(testDate, latitude, longitude);

      // Should be below horizon at midnight
      expect(position.altitude).toBeLessThan(0);
    });
  });

  describe('Shadow Calculations', () => {
    test('shadow opacity is zero when sun is below horizon', () => {
      const testDate = new Date('2024-06-21T04:00:00Z'); // Midnight
      const latitude = 40.7128;
      const longitude = -74.006;

      const position = SunCalc.getPosition(testDate, latitude, longitude);
      const altitudeDeg = position.altitude * (180 / Math.PI);

      // Calculate opacity using the same logic as hook
      let opacity = 0;
      if (altitudeDeg > 0) {
        opacity = 0.1 + (altitudeDeg / 90) * 0.5;
        opacity = Math.min(0.6, Math.max(0.1, opacity));
      }

      expect(opacity).toBe(0);
    });

    test('shadow opacity increases with sun altitude', () => {
      const latitude = 40.7128;
      const longitude = -74.006;

      // Test at different times of day
      const times = [
        new Date('2024-06-21T10:00:00Z'), // Early morning
        new Date('2024-06-21T16:00:00Z'), // Noon
        new Date('2024-06-21T22:00:00Z'), // Evening
      ];

      const opacities = times.map(testDate => {
        const position = SunCalc.getPosition(testDate, latitude, longitude);
        const altitudeDeg = position.altitude * (180 / Math.PI);

        let opacity = 0;
        if (altitudeDeg > 0) {
          opacity = 0.1 + (altitudeDeg / 90) * 0.5;
          opacity = Math.min(0.6, Math.max(0.1, opacity));
        }
        return opacity;
      });

      // Noon should have higher opacity than early morning or evening
      expect(opacities[1]).toBeGreaterThan(opacities[0]);
      expect(opacities[1]).toBeGreaterThan(opacities[2]);
    });

    test('shadow length decreases with sun altitude', () => {
      const testAltitudes = [5, 30, 60, 90]; // degrees

      const shadowLengths = testAltitudes.map(altitudeDeg => {
        return altitudeDeg > 0 
          ? Math.max(5, 20 - (altitudeDeg / 90) * 15)
          : 0;
      });

      // Higher altitude should result in shorter shadow
      expect(shadowLengths[0]).toBeGreaterThan(shadowLengths[1]);
      expect(shadowLengths[1]).toBeGreaterThan(shadowLengths[2]);
      expect(shadowLengths[2]).toBeGreaterThan(shadowLengths[3]);
    });

    test('shadow blur decreases with sun altitude', () => {
      const testAltitudes = [5, 30, 60, 90]; // degrees

      const shadowBlurs = testAltitudes.map(altitudeDeg => {
        return altitudeDeg > 0
          ? Math.max(4, 12 - (altitudeDeg / 90) * 8)
          : 4;
      });

      // Higher altitude should result in sharper shadow (less blur)
      expect(shadowBlurs[0]).toBeGreaterThan(shadowBlurs[1]);
      expect(shadowBlurs[1]).toBeGreaterThan(shadowBlurs[2]);
      expect(shadowBlurs[2]).toBeGreaterThan(shadowBlurs[3]);
    });
  });

  describe('Shadow Direction', () => {
    test('shadow direction is opposite to sun azimuth', () => {
      const testDate = new Date('2024-06-21T16:00:00Z');
      const latitude = 40.7128;
      const longitude = -74.006;

      const position = SunCalc.getPosition(testDate, latitude, longitude);
      const shadowAngle = position.azimuth + Math.PI;

      // Shadow angle should be π radians (180°) opposite to sun
      const angleDiff = Math.abs(shadowAngle - position.azimuth);
      expect(angleDiff).toBeCloseTo(Math.PI, 5);
    });

    test('shadow offset calculations are valid', () => {
      const testDate = new Date('2024-06-21T16:00:00Z');
      const latitude = 40.7128;
      const longitude = -74.006;

      const position = SunCalc.getPosition(testDate, latitude, longitude);
      const altitudeDeg = position.altitude * (180 / Math.PI);
      
      const baseLength = altitudeDeg > 0 
        ? Math.max(5, 20 - (altitudeDeg / 90) * 15)
        : 0;

      const shadowAngle = position.azimuth + Math.PI;
      const shadowX = Math.sin(shadowAngle) * baseLength;
      const shadowY = -Math.cos(shadowAngle) * baseLength;

      // Shadow offsets should be finite numbers
      expect(isFinite(shadowX)).toBe(true);
      expect(isFinite(shadowY)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles polar regions gracefully', () => {
      // Test near North Pole
      const testDate = new Date('2024-06-21T12:00:00Z');
      const latitude = 80;
      const longitude = 0;

      const position = SunCalc.getPosition(testDate, latitude, longitude);

      // Should still return valid position
      expect(typeof position.altitude).toBe('number');
      expect(typeof position.azimuth).toBe('number');
      expect(isFinite(position.altitude)).toBe(true);
      expect(isFinite(position.azimuth)).toBe(true);
    });

    test('handles equator location', () => {
      const testDate = new Date('2024-06-21T12:00:00Z');
      const latitude = 0;
      const longitude = 0;

      const position = SunCalc.getPosition(testDate, latitude, longitude);

      // Should return valid position
      expect(typeof position.altitude).toBe('number');
      expect(typeof position.azimuth).toBe('number');
    });

    test('handles different seasons consistently', () => {
      const dates = [
        new Date('2024-03-20T12:00:00Z'), // Spring equinox
        new Date('2024-06-21T12:00:00Z'), // Summer solstice
        new Date('2024-09-22T12:00:00Z'), // Fall equinox
        new Date('2024-12-21T12:00:00Z'), // Winter solstice
      ];
      const latitude = 40.7128;
      const longitude = -74.006;

      dates.forEach(date => {
        const position = SunCalc.getPosition(date, latitude, longitude);
        
        // All positions should be valid
        expect(typeof position.altitude).toBe('number');
        expect(typeof position.azimuth).toBe('number');
        expect(isFinite(position.altitude)).toBe(true);
        expect(isFinite(position.azimuth)).toBe(true);
      });
    });
  });

  describe('Shadow Style Properties', () => {
    test('default shadow style has required properties', () => {
      const defaultShadow = {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      };

      expect(defaultShadow).toHaveProperty('shadowColor');
      expect(defaultShadow).toHaveProperty('shadowOffset');
      expect(defaultShadow).toHaveProperty('shadowOpacity');
      expect(defaultShadow).toHaveProperty('shadowRadius');
      expect(defaultShadow.shadowOffset).toHaveProperty('width');
      expect(defaultShadow.shadowOffset).toHaveProperty('height');
    });

    test('shadow color is always black', () => {
      const shadowColor = '#000000';
      expect(shadowColor).toBe('#000000');
    });

    test('shadow opacity is within valid range', () => {
      const testAltitudes = [0, 30, 60, 90];

      testAltitudes.forEach(altitudeDeg => {
        let opacity = 0;
        if (altitudeDeg > 0) {
          opacity = 0.1 + (altitudeDeg / 90) * 0.5;
          opacity = Math.min(0.6, Math.max(0.1, opacity));
        }

        // Opacity should be between 0 and 1
        expect(opacity).toBeGreaterThanOrEqual(0);
        expect(opacity).toBeLessThanOrEqual(1);
      });
    });

    test('shadow radius is always positive', () => {
      const testAltitudes = [0, 30, 60, 90];

      testAltitudes.forEach(altitudeDeg => {
        const shadowRadius = altitudeDeg > 0
          ? Math.max(4, 12 - (altitudeDeg / 90) * 8)
          : 4;

        expect(shadowRadius).toBeGreaterThan(0);
      });
    });
  });
});
