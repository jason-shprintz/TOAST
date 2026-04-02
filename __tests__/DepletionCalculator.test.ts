/**
 * @format
 * Tests for DepletionCalculator utility functions.
 */

import {
  calculate,
  DEFAULT_INVENTORY_DAYS_PER_UNIT,
  DEFAULT_PANTRY_DAYS_PER_UNIT,
  readinessLabel,
} from '../src/screens/DepletionCalculator/depletionCalculatorUtils';

describe('DepletionCalculator utilities', () => {
  describe('calculate()', () => {
    describe('pantry category multipliers', () => {
      test('Canned Goods: 1.5 days per unit', () => {
        const result = calculate(
          [{ category: 'Canned Goods', quantity: 2 }],
          [],
          1,
        );
        expect(result.pantryDays).toBeCloseTo(3.0);
        expect(result.inventoryBonus).toBe(0);
        expect(result.totalDays).toBeCloseTo(3.0);
      });

      test('Dry Goods: 3.0 days per unit', () => {
        const result = calculate(
          [{ category: 'Dry Goods', quantity: 4 }],
          [],
          1,
        );
        expect(result.pantryDays).toBeCloseTo(12.0);
      });

      test('Frozen: 2.0 days per unit', () => {
        const result = calculate(
          [{ category: 'Frozen', quantity: 3 }],
          [],
          1,
        );
        expect(result.pantryDays).toBeCloseTo(6.0);
      });

      test('Fresh: 0.5 days per unit', () => {
        const result = calculate(
          [{ category: 'Fresh', quantity: 6 }],
          [],
          1,
        );
        expect(result.pantryDays).toBeCloseTo(3.0);
      });

      test('unknown pantry category uses default multiplier', () => {
        const result = calculate(
          [{ category: 'Beverages', quantity: 5 }],
          [],
          1,
        );
        expect(result.pantryDays).toBeCloseTo(5 * DEFAULT_PANTRY_DAYS_PER_UNIT);
      });
    });

    describe('inventory category multipliers', () => {
      test('Home Base: 0.5 days per unit', () => {
        const result = calculate(
          [],
          [{ category: 'Home Base', quantity: 4 }],
          1,
        );
        expect(result.inventoryBonus).toBeCloseTo(2.0);
        expect(result.pantryDays).toBe(0);
      });

      test('Main Vehicle: 0.25 days per unit', () => {
        const result = calculate(
          [],
          [{ category: 'Main Vehicle', quantity: 8 }],
          1,
        );
        expect(result.inventoryBonus).toBeCloseTo(2.0);
      });

      test('unknown inventory category uses default multiplier', () => {
        const result = calculate(
          [],
          [{ category: 'Backpack', quantity: 10 }],
          1,
        );
        expect(result.inventoryBonus).toBeCloseTo(10 * DEFAULT_INVENTORY_DAYS_PER_UNIT);
      });
    });

    describe('household size division', () => {
      test('doubles household size halves the days', () => {
        const items = [{ category: 'Canned Goods', quantity: 10 }];
        const one = calculate(items, [], 1);
        const two = calculate(items, [], 2);
        expect(two.totalDays).toBeCloseTo(one.totalDays / 2);
      });

      test('safeguards against zero or negative people (treats as 1)', () => {
        const items = [{ category: 'Canned Goods', quantity: 2 }];
        const zero = calculate(items, [], 0);
        const negative = calculate(items, [], -5);
        const one = calculate(items, [], 1);
        expect(zero.totalDays).toBeCloseTo(one.totalDays);
        expect(negative.totalDays).toBeCloseTo(one.totalDays);
      });
    });

    describe('totals and item count', () => {
      test('totalDays = pantryDays + inventoryBonus', () => {
        const result = calculate(
          [{ category: 'Canned Goods', quantity: 2 }],
          [{ category: 'Home Base', quantity: 4 }],
          1,
        );
        expect(result.totalDays).toBeCloseTo(result.pantryDays + result.inventoryBonus);
      });

      test('itemCount is sum of pantry and inventory items', () => {
        const result = calculate(
          [{ category: 'Canned Goods', quantity: 1 }, { category: 'Frozen', quantity: 3 }],
          [{ category: 'Home Base', quantity: 2 }],
          1,
        );
        expect(result.itemCount).toBe(3);
      });

      test('empty stores produce zero days', () => {
        const result = calculate([], [], 1);
        expect(result.totalDays).toBe(0);
        expect(result.itemCount).toBe(0);
      });
    });
  });

  describe('readinessLabel()', () => {
    test('Critical — below 3 days', () => {
      expect(readinessLabel(0).label).toMatch(/Critical/);
      expect(readinessLabel(2.9).label).toMatch(/Critical/);
      expect(readinessLabel(0).icon).toBe('warning-outline');
    });

    test('Low — 3 to below 7 days', () => {
      expect(readinessLabel(3).label).toMatch(/Low/);
      expect(readinessLabel(6.9).label).toMatch(/Low/);
      expect(readinessLabel(3).icon).toBe('alert-circle-outline');
    });

    test('Moderate — 7 to below 30 days', () => {
      expect(readinessLabel(7).label).toMatch(/Moderate/);
      expect(readinessLabel(29.9).label).toMatch(/Moderate/);
      expect(readinessLabel(7).icon).toBe('checkmark-circle-outline');
    });

    test('Good — 30 to below 90 days', () => {
      expect(readinessLabel(30).label).toMatch(/Good/);
      expect(readinessLabel(89.9).label).toMatch(/Good/);
      expect(readinessLabel(30).icon).toBe('shield-checkmark-outline');
    });

    test('Excellent — 90+ days', () => {
      expect(readinessLabel(90).label).toMatch(/Excellent/);
      expect(readinessLabel(365).label).toMatch(/Excellent/);
      expect(readinessLabel(90).icon).toBe('star-outline');
    });

    test('exact boundary at 3 returns Low (not Critical)', () => {
      expect(readinessLabel(3).label).toMatch(/Low/);
    });

    test('exact boundary at 7 returns Moderate (not Low)', () => {
      expect(readinessLabel(7).label).toMatch(/Moderate/);
    });

    test('exact boundary at 30 returns Good (not Moderate)', () => {
      expect(readinessLabel(30).label).toMatch(/Good/);
    });

    test('exact boundary at 90 returns Excellent (not Good)', () => {
      expect(readinessLabel(90).label).toMatch(/Excellent/);
    });
  });
});
