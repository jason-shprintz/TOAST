/**
 * @format
 * Tests for BarterEstimator utility functions.
 */

import {
  DEFAULT_INVENTORY_BARTER_WEIGHT,
  DEFAULT_PANTRY_BARTER_WEIGHT,
  computeBarter,
} from '../src/screens/BarterEstimator/barterEstimatorUtils';

describe('computeBarter()', () => {
  describe('empty inputs', () => {
    test('all-empty stores produce zero totalScore and poor readiness', () => {
      const result = computeBarter([], [], [], []);
      expect(result.totalScore).toBe(0);
      expect(result.overallReadiness).toBe('poor');
      expect(result.categories).toHaveLength(0);
      expect(result.offerItems).toHaveLength(0);
      expect(result.wantItems).toHaveLength(0);
    });

    test('pantry categories with no items produce zero scores; empty inventory categories produce no entries', () => {
      const result = computeBarter(
        [],
        ['Canned Goods', 'Dry Goods'],
        [],
        ['Home Base'],
      );
      expect(result.totalScore).toBe(0);
      expect(result.overallReadiness).toBe('poor');
      // Only pantry categories create zero-score entries; inventory entries are
      // created only when items exist (keyed by name::category composite).
      expect(result.categories).toHaveLength(2);
      result.categories.forEach((cat) => {
        expect(cat.rawScore).toBe(0);
        expect(cat.itemCount).toBe(0);
        expect(cat.totalQuantity).toBe(0);
      });
    });
  });

  describe('pantry barter weights', () => {
    test('Dry Goods: weight 4', () => {
      const result = computeBarter(
        [{ category: 'Dry Goods', quantity: 5 }],
        ['Dry Goods'],
        [],
        [],
      );
      const cat = result.categories.find((c) => c.name === 'Dry Goods')!;
      expect(cat.rawScore).toBe(20); // 5 * 4
    });

    test('Canned Goods: weight 3', () => {
      const result = computeBarter(
        [{ category: 'Canned Goods', quantity: 4 }],
        ['Canned Goods'],
        [],
        [],
      );
      const cat = result.categories.find((c) => c.name === 'Canned Goods')!;
      expect(cat.rawScore).toBe(12); // 4 * 3
    });

    test('Fresh: weight 2', () => {
      const result = computeBarter(
        [{ category: 'Fresh', quantity: 3 }],
        ['Fresh'],
        [],
        [],
      );
      const cat = result.categories.find((c) => c.name === 'Fresh')!;
      expect(cat.rawScore).toBe(6); // 3 * 2
    });

    test('Frozen: weight 1', () => {
      const result = computeBarter(
        [{ category: 'Frozen', quantity: 6 }],
        ['Frozen'],
        [],
        [],
      );
      const cat = result.categories.find((c) => c.name === 'Frozen')!;
      expect(cat.rawScore).toBe(6); // 6 * 1
    });

    test('unknown pantry category uses default weight', () => {
      const result = computeBarter(
        [{ category: 'Beverages', quantity: 3 }],
        ['Beverages'],
        [],
        [],
      );
      const cat = result.categories.find((c) => c.name === 'Beverages')!;
      expect(cat.rawScore).toBe(3 * DEFAULT_PANTRY_BARTER_WEIGHT);
    });
  });

  describe('inventory barter weights', () => {
    test('Home Base: weight 3', () => {
      const result = computeBarter(
        [],
        [],
        [{ category: 'Home Base', quantity: 4 }],
        ['Home Base'],
      );
      const cat = result.categories.find((c) => c.name === 'Home Base')!;
      expect(cat.rawScore).toBe(12); // 4 * 3
      expect(cat.source).toBe('inventory');
    });

    test('Main Vehicle: weight 2', () => {
      const result = computeBarter(
        [],
        [],
        [{ category: 'Main Vehicle', quantity: 5 }],
        ['Main Vehicle'],
      );
      const cat = result.categories.find((c) => c.name === 'Main Vehicle')!;
      expect(cat.rawScore).toBe(10); // 5 * 2
    });

    test('unknown inventory category uses default weight', () => {
      const result = computeBarter(
        [],
        [],
        [{ category: 'Backpack', quantity: 2 }],
        ['Backpack'],
      );
      const cat = result.categories.find((c) => c.name === 'Backpack')!;
      expect(cat.rawScore).toBe(2 * DEFAULT_INVENTORY_BARTER_WEIGHT);
    });
  });

  describe('surplus/scarce classification', () => {
    test('single category owning all score is surplus (100% > 35%)', () => {
      const result = computeBarter(
        [{ category: 'Dry Goods', quantity: 10 }],
        ['Dry Goods'],
        [],
        [],
      );
      expect(result.categories[0].status).toBe('surplus');
      expect(result.offerItems).toHaveLength(1);
    });

    test('category with 0 score is scarce when total > 0 (0% ≤ 15%)', () => {
      const result = computeBarter(
        [
          { category: 'Dry Goods', quantity: 10 },
          { category: 'Frozen', quantity: 0 },
        ],
        ['Dry Goods', 'Frozen'],
        [],
        [],
      );
      const frozen = result.categories.find((c) => c.name === 'Frozen')!;
      expect(frozen.status).toBe('scarce');
      expect(result.wantItems.some((w) => w.name === 'Frozen')).toBe(true);
    });

    test('balanced category sits between 15% and 35%', () => {
      // Dry Goods (weight 4) qty 2 = 8, Frozen (weight 1) qty 20 = 20
      // total = 28; Dry Goods fraction = 8/28 ≈ 0.286 (between 0.15 and 0.35)
      const result = computeBarter(
        [
          { category: 'Dry Goods', quantity: 2 },
          { category: 'Frozen', quantity: 20 },
        ],
        ['Dry Goods', 'Frozen'],
        [],
        [],
      );
      const dryGoods = result.categories.find((c) => c.name === 'Dry Goods')!;
      expect(dryGoods.status).toBe('balanced');
    });

    test('all-zero scores produce all-scarce status', () => {
      const result = computeBarter([], ['Canned Goods', 'Dry Goods'], [], []);
      // totalScore is 0, so fraction is 0 for all → all scarce
      result.categories.forEach((cat) => {
        expect(cat.status).toBe('scarce');
      });
    });
  });

  describe('offerItems and wantItems ordering', () => {
    test('offerItems sorted descending by rawScore', () => {
      const result = computeBarter(
        [
          { category: 'Dry Goods', quantity: 10 }, // score 40
          { category: 'Canned Goods', quantity: 10 }, // score 30
        ],
        ['Dry Goods', 'Canned Goods'],
        [],
        [],
      );
      if (result.offerItems.length >= 2) {
        expect(result.offerItems[0].rawScore).toBeGreaterThanOrEqual(
          result.offerItems[1].rawScore,
        );
      }
    });

    test('wantItems sorted ascending by rawScore', () => {
      // Create scenario with multiple scarce items
      const result = computeBarter(
        [
          { category: 'Dry Goods', quantity: 50 }, // dominates
          { category: 'Frozen', quantity: 1 }, // scarce
          { category: 'Fresh', quantity: 1 }, // potentially scarce
        ],
        ['Dry Goods', 'Frozen', 'Fresh'],
        [],
        [],
      );
      if (result.wantItems.length >= 2) {
        expect(result.wantItems[0].rawScore).toBeLessThanOrEqual(
          result.wantItems[1].rawScore,
        );
      }
    });
  });

  describe('overallReadiness', () => {
    test('zero totalScore → poor', () => {
      const result = computeBarter([], [], [], []);
      expect(result.overallReadiness).toBe('poor');
    });

    test('2+ surplus categories → excellent', () => {
      // Three categories each owning 33% of score — all surplus (>35% not met with 3 equal ones)
      // Actually need 2 categories each > 35%; with exactly 2 equal categories each is 50%
      const result = computeBarter(
        [
          { category: 'Dry Goods', quantity: 5 }, // 20 pts
          { category: 'Canned Goods', quantity: 5 }, // 15 pts — these two dominate
        ],
        ['Dry Goods', 'Canned Goods'],
        [],
        [],
      );
      // total = 35; Dry Goods = 20/35 ≈ 57% (surplus), Canned Goods = 15/35 ≈ 43% (surplus)
      expect(result.overallReadiness).toBe('excellent');
      expect(result.offerItems).toHaveLength(2);
    });

    test('1 surplus category → good', () => {
      // One category at 100% → surplus; rest empty/non-existent
      const result = computeBarter(
        [{ category: 'Dry Goods', quantity: 5 }],
        ['Dry Goods'],
        [],
        [],
      );
      expect(result.overallReadiness).toBe('good');
      expect(result.offerItems).toHaveLength(1);
    });

    test('majority scarce → fair', () => {
      // 3 categories: one has all the score, two have none → 2/3 are scarce
      const result = computeBarter(
        [
          { category: 'Dry Goods', quantity: 10 },
          { category: 'Frozen', quantity: 0 },
          { category: 'Fresh', quantity: 0 },
        ],
        ['Dry Goods', 'Frozen', 'Fresh'],
        [],
        [],
      );
      // wantItems (2) >= scores.length (3) / 2 = 1.5 → fair
      expect(result.overallReadiness).toBe('fair');
    });

    test('no surplus but not majority scarce → fair', () => {
      // Four even categories each at 25% — all balanced (between 15% and 35%)
      // totalScore = (5*4) + (5*3) + (5*2) + (5*1) = 20+15+10+5 = 50
      // Dry Goods 20/50=40% (surplus), Canned 15/50=30% (balanced), Fresh 10/50=20% (balanced), Frozen 5/50=10% (scarce)
      // offerItems.length = 1 → good, not fair
      // Let's try a scenario with 0 offer and < half scarce:
      // Two items each at 25% (balanced range 15%-35%)
      // Frozen qty 5 = score 5, Fresh qty 5 = score 10; total 15
      // Frozen: 5/15 = 33% balanced, Fresh: 10/15 = 67% surplus
      // Actually hard to construct "no surplus and not majority scarce"
      // Use 4 categories where 3 are balanced and 1 is scarce
      // Dry 4pts, Canned 3pts, Fresh 2pts each qty=5 → 20+15+10=45, total 45
      // 20/45=44% surplus, 15/45=33% balanced, 10/45=22% balanced
      // Still has surplus. Let's try all balanced with no surplus.
      // 3 cats each at 33% (between 15% and 35%) → all balanced, no surplus, no scarce
      // Need weights/quantities that give ~33% each.
      // Cat A: 10pts, Cat B: 10pts, Cat C: 10pts → each 33% balanced
      // Use 3 unknown pantry cats with default weight 2, qty 5 each
      const result = computeBarter(
        [
          { category: 'A', quantity: 5 },
          { category: 'B', quantity: 5 },
          { category: 'C', quantity: 5 },
        ],
        ['A', 'B', 'C'],
        [],
        [],
      );
      // Each gets 5 * 2 = 10, total = 30, fraction = 33% each → all balanced
      expect(result.offerItems).toHaveLength(0);
      expect(result.wantItems).toHaveLength(0);
      expect(result.overallReadiness).toBe('fair');
    });
  });

  describe('itemCount and totalQuantity', () => {
    test('itemCount reflects number of items per category', () => {
      const result = computeBarter(
        [
          { category: 'Canned Goods', quantity: 3 },
          { category: 'Canned Goods', quantity: 7 },
          { category: 'Dry Goods', quantity: 5 },
        ],
        ['Canned Goods', 'Dry Goods'],
        [],
        [],
      );
      const canned = result.categories.find((c) => c.name === 'Canned Goods')!;
      expect(canned.itemCount).toBe(2);
      expect(canned.totalQuantity).toBe(10);
    });

    test('totalQuantity sums all quantities in a category', () => {
      const result = computeBarter(
        [
          { category: 'Dry Goods', quantity: 4 },
          { category: 'Dry Goods', quantity: 6 },
        ],
        ['Dry Goods'],
        [],
        [],
      );
      const dry = result.categories.find((c) => c.name === 'Dry Goods')!;
      expect(dry.totalQuantity).toBe(10);
      expect(dry.rawScore).toBe(40); // 10 * 4
    });
  });

  describe('source tagging', () => {
    test('pantry categories tagged as pantry', () => {
      const result = computeBarter(
        [{ category: 'Dry Goods', quantity: 1 }],
        ['Dry Goods'],
        [],
        [],
      );
      expect(result.categories[0].source).toBe('pantry');
    });

    test('inventory categories tagged as inventory', () => {
      const result = computeBarter(
        [],
        [],
        [{ category: 'Home Base', quantity: 1 }],
        ['Home Base'],
      );
      expect(result.categories[0].source).toBe('inventory');
    });
  });

  describe('composite key grouping for inventory', () => {
    test('same-named items in different inventory categories score separately', () => {
      // "Water" in Home Base (weight 3) and "Water" in Main Vehicle (weight 2)
      // must NOT be merged — each should keep its own score and category weight.
      const result = computeBarter(
        [],
        [],
        [
          { name: 'Water', category: 'Home Base', quantity: 2 },
          { name: 'Water', category: 'Main Vehicle', quantity: 3 },
        ],
        ['Home Base', 'Main Vehicle'],
      );
      expect(result.categories).toHaveLength(2);

      const homeEntry = result.categories.find(
        (c) => c.name === 'Water' && c.category === 'Home Base',
      );
      const vehicleEntry = result.categories.find(
        (c) => c.name === 'Water' && c.category === 'Main Vehicle',
      );

      expect(homeEntry).toBeDefined();
      expect(homeEntry!.rawScore).toBe(6); // 2 * 3 (Home Base weight)
      expect(homeEntry!.totalQuantity).toBe(2);

      expect(vehicleEntry).toBeDefined();
      expect(vehicleEntry!.rawScore).toBe(6); // 3 * 2 (Main Vehicle weight)
      expect(vehicleEntry!.totalQuantity).toBe(3);
    });

    test('same-named items in the same category are aggregated', () => {
      // Multiple "Water" entries in the same category should still be combined.
      const result = computeBarter(
        [],
        [],
        [
          { name: 'Water', category: 'Home Base', quantity: 2 },
          { name: 'Water', category: 'Home Base', quantity: 3 },
        ],
        ['Home Base'],
      );
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].totalQuantity).toBe(5);
      expect(result.categories[0].itemCount).toBe(2);
      expect(result.categories[0].rawScore).toBe(15); // 5 * 3
    });

    test('unnamed items fall back to category as display name', () => {
      const result = computeBarter(
        [],
        [],
        [{ category: 'Home Base', quantity: 4 }],
        ['Home Base'],
      );
      expect(result.categories[0].name).toBe('Home Base');
    });
  });
});
