/**
 * Barter value weights: how desirable is each unit in a post-grid economy?
 * Higher = more trade value per unit.
 * These are intentionally opinionated and for entertainment only.
 */
export const PANTRY_BARTER_WEIGHT: Record<string, number> = {
  'Canned Goods': 3,
  'Dry Goods': 4,
  Frozen: 1, // freezers don't last in a grid-down situation
  Fresh: 2,
};
export const DEFAULT_PANTRY_BARTER_WEIGHT = 2;

export const INVENTORY_BARTER_WEIGHT: Record<string, number> = {
  'Home Base': 3,
  'Main Vehicle': 2,
};
export const DEFAULT_INVENTORY_BARTER_WEIGHT = 2;

// Threshold: fraction of total score below which a category is "scarce"
export const SCARCITY_THRESHOLD = 0.15; // bottom 15%
export const SURPLUS_THRESHOLD = 0.35; // top 35%

export type StockStatus = 'scarce' | 'balanced' | 'surplus';

export interface CategoryScore {
  name: string;
  source: 'pantry' | 'inventory';
  rawScore: number;
  status: StockStatus;
  itemCount: number;
  totalQuantity: number;
}

export interface BarterSummary {
  categories: CategoryScore[];
  offerItems: CategoryScore[];  // surplus — good to trade away
  wantItems: CategoryScore[];   // scarce — seek in trade
  totalScore: number;
  overallReadiness: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface BarterItem {
  category: string;
  quantity: number;
}

export function computeBarter(
  pantryItems: BarterItem[],
  pantryCategories: string[],
  inventoryItems: BarterItem[],
  inventoryCategories: string[],
): BarterSummary {
  const scores: CategoryScore[] = [];

  // Pantry categories
  for (const cat of pantryCategories) {
    const catItems = pantryItems.filter((i) => i.category === cat);
    const totalQty = catItems.reduce((sum, i) => sum + i.quantity, 0);
    const weight = PANTRY_BARTER_WEIGHT[cat] ?? DEFAULT_PANTRY_BARTER_WEIGHT;
    scores.push({
      name: cat,
      source: 'pantry',
      rawScore: totalQty * weight,
      status: 'balanced', // filled in below
      itemCount: catItems.length,
      totalQuantity: totalQty,
    });
  }

  // Inventory categories
  for (const cat of inventoryCategories) {
    const catItems = inventoryItems.filter((i) => i.category === cat);
    const totalQty = catItems.reduce((sum, i) => sum + i.quantity, 0);
    const weight =
      INVENTORY_BARTER_WEIGHT[cat] ?? DEFAULT_INVENTORY_BARTER_WEIGHT;
    scores.push({
      name: cat,
      source: 'inventory',
      rawScore: totalQty * weight,
      status: 'balanced',
      itemCount: catItems.length,
      totalQuantity: totalQty,
    });
  }

  const totalScore = scores.reduce((s, c) => s + c.rawScore, 0);

  // Assign status relative to total
  for (const cat of scores) {
    const fraction = totalScore > 0 ? cat.rawScore / totalScore : 0;
    if (fraction <= SCARCITY_THRESHOLD) {
      cat.status = 'scarce';
    } else if (fraction >= SURPLUS_THRESHOLD) {
      cat.status = 'surplus';
    } else {
      cat.status = 'balanced';
    }
  }

  const offerItems = scores
    .filter((c) => c.status === 'surplus')
    .sort((a, b) => b.rawScore - a.rawScore);

  const wantItems = scores
    .filter((c) => c.status === 'scarce')
    .sort((a, b) => a.rawScore - b.rawScore);

  let overallReadiness: BarterSummary['overallReadiness'];
  if (totalScore === 0) {
    overallReadiness = 'poor';
  } else if (wantItems.length >= scores.length / 2) {
    overallReadiness = 'fair';
  } else if (offerItems.length >= 2) {
    overallReadiness = 'excellent';
  } else if (offerItems.length >= 1) {
    overallReadiness = 'good';
  } else {
    overallReadiness = 'fair';
  }

  return { categories: scores, offerItems, wantItems, totalScore, overallReadiness };
}
