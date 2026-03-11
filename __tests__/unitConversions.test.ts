/**
 * @format
 */

import {
  conversionCategories,
  displayPrecipitation,
  displayPressure,
  displaySpeed,
  displayTemp,
} from '../src/utils/unitConversions';

describe('Unit Conversions', () => {
  describe('Length / Distance', () => {
    const lengthCategory = conversionCategories.find(
      (cat) => cat.id === 'length',
    );

    test('inches to centimeters', () => {
      const unit = lengthCategory?.units.find((u) => u.id === 'inches_cm');
      expect(unit?.convert(1)).toBeCloseTo(2.54, 2);
      expect(unit?.convert(10)).toBeCloseTo(25.4, 2);
    });

    test('centimeters to inches', () => {
      const unit = lengthCategory?.units.find((u) => u.id === 'inches_cm');
      expect(unit?.reverseConvert(2.54)).toBeCloseTo(1, 2);
      expect(unit?.reverseConvert(25.4)).toBeCloseTo(10, 2);
    });

    test('miles to kilometers', () => {
      const unit = lengthCategory?.units.find((u) => u.id === 'miles_km');
      expect(unit?.convert(1)).toBeCloseTo(1.60934, 2);
      expect(unit?.convert(5)).toBeCloseTo(8.0467, 2);
    });
  });

  describe('Weight / Mass', () => {
    const weightCategory = conversionCategories.find(
      (cat) => cat.id === 'weight',
    );

    test('pounds to kilograms', () => {
      const unit = weightCategory?.units.find((u) => u.id === 'pounds_kg');
      expect(unit?.convert(1)).toBeCloseTo(0.453592, 2);
      expect(unit?.convert(10)).toBeCloseTo(4.53592, 2);
    });

    test('kilograms to pounds', () => {
      const unit = weightCategory?.units.find((u) => u.id === 'pounds_kg');
      expect(unit?.reverseConvert(1)).toBeCloseTo(2.20462, 2);
    });
  });

  describe('Temperature', () => {
    const tempCategory = conversionCategories.find(
      (cat) => cat.id === 'temperature',
    );

    test('fahrenheit to celsius', () => {
      const unit = tempCategory?.units.find(
        (u) => u.id === 'fahrenheit_celsius',
      );
      expect(unit?.convert(32)).toBeCloseTo(0, 2);
      expect(unit?.convert(212)).toBeCloseTo(100, 2);
      expect(unit?.convert(-40)).toBeCloseTo(-40, 2);
    });

    test('celsius to fahrenheit', () => {
      const unit = tempCategory?.units.find(
        (u) => u.id === 'fahrenheit_celsius',
      );
      expect(unit?.reverseConvert(0)).toBeCloseTo(32, 2);
      expect(unit?.reverseConvert(100)).toBeCloseTo(212, 2);
    });

    test('celsius to kelvin', () => {
      const unit = tempCategory?.units.find((u) => u.id === 'celsius_kelvin');
      expect(unit?.convert(0)).toBeCloseTo(273.15, 2);
      expect(unit?.convert(100)).toBeCloseTo(373.15, 2);
    });
  });

  describe('Volume (Liquid)', () => {
    const volumeCategory = conversionCategories.find(
      (cat) => cat.id === 'volume',
    );

    test('gallons to liters', () => {
      const unit = volumeCategory?.units.find((u) => u.id === 'gallons_liters');
      expect(unit?.convert(1)).toBeCloseTo(3.78541, 2);
      expect(unit?.convert(5)).toBeCloseTo(18.9271, 2);
    });

    test('liters to gallons', () => {
      const unit = volumeCategory?.units.find((u) => u.id === 'gallons_liters');
      expect(unit?.reverseConvert(3.78541)).toBeCloseTo(1, 2);
    });
  });

  describe('Speed', () => {
    const speedCategory = conversionCategories.find(
      (cat) => cat.id === 'speed',
    );

    test('mph to kmh', () => {
      const unit = speedCategory?.units.find((u) => u.id === 'mph_kmh');
      expect(unit?.convert(60)).toBeCloseTo(96.56, 2);
    });

    test('kmh to mph', () => {
      const unit = speedCategory?.units.find((u) => u.id === 'mph_kmh');
      expect(unit?.reverseConvert(100)).toBeCloseTo(62.14, 2);
    });
  });

  describe('Pressure', () => {
    const pressureCategory = conversionCategories.find(
      (cat) => cat.id === 'pressure',
    );

    test('psi to bar', () => {
      const unit = pressureCategory?.units.find((u) => u.id === 'psi_bar');
      expect(unit?.convert(14.5)).toBeCloseTo(1, 1);
    });

    test('psi to kpa', () => {
      const unit = pressureCategory?.units.find((u) => u.id === 'psi_kpa');
      expect(unit?.convert(1)).toBeCloseTo(6.89476, 2);
    });
  });

  describe('All categories exist', () => {
    test('should have 12 categories', () => {
      expect(conversionCategories).toHaveLength(12);
    });

    test('all categories have required properties', () => {
      conversionCategories.forEach((category) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('units');
        expect(Array.isArray(category.units)).toBe(true);
        expect(category.units.length).toBeGreaterThan(0);
      });
    });

    test('all units have required conversion functions', () => {
      conversionCategories.forEach((category) => {
        category.units.forEach((unit) => {
          expect(unit).toHaveProperty('id');
          expect(unit).toHaveProperty('name');
          expect(unit).toHaveProperty('fromName');
          expect(unit).toHaveProperty('toName');
          expect(typeof unit.convert).toBe('function');
          expect(typeof unit.reverseConvert).toBe('function');
        });
      });
    });
  });

  describe('Bidirectional conversions', () => {
    test('conversions should be reversible', () => {
      conversionCategories.forEach((category) => {
        category.units.forEach((unit) => {
          const testValue = 100;
          const converted = unit.convert(testValue);
          const backToOriginal = unit.reverseConvert(converted);
          expect(backToOriginal).toBeCloseTo(testValue, 5);
        });
      });
    });
  });

  describe('displayTemp', () => {
    test('0°C displays as 32°F when system is imperial', () => {
      expect(displayTemp(0, 'imperial')).toBe('32°F');
    });

    test('100°C displays as 212°F when system is imperial', () => {
      expect(displayTemp(100, 'imperial')).toBe('212°F');
    });

    test('0°C displays as 0°C when system is metric', () => {
      expect(displayTemp(0, 'metric')).toBe('0°C');
    });

    test('37°C displays as 37°C when system is metric', () => {
      expect(displayTemp(37, 'metric')).toBe('37°C');
    });

    test('rounds fractional values', () => {
      // 22.2°C → 71.96°F → rounds to 72°F
      expect(displayTemp(22.2, 'imperial')).toBe('72°F');
      // 22.5°C → rounds to 23°C
      expect(displayTemp(22.5, 'metric')).toBe('23°C');
    });
  });

  describe('displayPressure', () => {
    test('1013.25 hPa displays as inHg when system is imperial', () => {
      expect(displayPressure(1013.25, 'imperial')).toBe('29.92 inHg');
    });

    test('1013 hPa displays as hPa when system is metric', () => {
      expect(displayPressure(1013, 'metric')).toBe('1013 hPa');
    });

    test('rounds to nearest integer in metric', () => {
      expect(displayPressure(1013.7, 'metric')).toBe('1014 hPa');
    });

    test('formats to 2 decimal places in imperial', () => {
      expect(displayPressure(1000, 'imperial')).toBe('29.53 inHg');
    });
  });

  describe('displaySpeed', () => {
    test('100 km/h displays as mph when system is imperial', () => {
      expect(displaySpeed(100, 'imperial')).toBe('62 mph');
    });

    test('100 km/h displays as km/h when system is metric', () => {
      expect(displaySpeed(100, 'metric')).toBe('100 km/h');
    });

    test('rounds fractional values', () => {
      // 50 km/h → 31.068 mph → rounds to 31
      expect(displaySpeed(50, 'imperial')).toBe('31 mph');
      expect(displaySpeed(50.5, 'metric')).toBe('51 km/h');
    });
  });

  describe('displayPrecipitation', () => {
    test('10 mm displays as inches when system is imperial', () => {
      expect(displayPrecipitation(10, 'imperial')).toBe('0.39 in');
    });

    test('10 mm displays as mm when system is metric', () => {
      expect(displayPrecipitation(10, 'metric')).toBe('10 mm');
    });

    test('rounds to nearest integer in metric', () => {
      expect(displayPrecipitation(1.4, 'metric')).toBe('1 mm');
    });

    test('formats to 2 decimal places in imperial', () => {
      expect(displayPrecipitation(0, 'imperial')).toBe('0.00 in');
    });
  });
});
