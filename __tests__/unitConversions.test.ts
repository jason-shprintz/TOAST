/**
 * @format
 */

import { conversionCategories } from '../src/utils/unitConversions';

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
});
