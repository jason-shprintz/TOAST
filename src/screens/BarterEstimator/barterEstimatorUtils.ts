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
  category?: string; // source category (populated for inventory items)
  source: 'pantry' | 'inventory';
  rawScore: number;
  status: StockStatus;
  itemCount: number;
  totalQuantity: number;
}

export interface BarterSummary {
  categories: CategoryScore[];
  offerItems: CategoryScore[]; // surplus — good to trade away
  wantItems: CategoryScore[]; // scarce — seek in trade
  totalScore: number;
  overallReadiness: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface BarterItem {
  name?: string; // item name; used for per-item inventory scoring
  category: string;
  quantity: number;
}

export function computeBarter(
  pantryItems: BarterItem[],
  pantryCategories: string[],
  inventoryItems: BarterItem[],
  _inventoryCategories: string[],
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

  // Inventory items — scored individually by item name so that "Home Base" and
  // "Main Vehicle" (which are storage categories, not tradeable goods) don't
  // appear as barter entries. Each distinct (name, category) pair gets its own
  // score entry so that the same item stored across multiple categories is not
  // incorrectly merged (e.g., "Water" in "Home Base" and "Main Vehicle" stay
  // separate and each uses the correct category weight).
  // inventoryCategories is kept in the signature for API compatibility but is
  // not used here; weights come from each item's category field.
  const invGroups = new Map<
    string,
    { items: BarterItem[]; name: string; cat: string }
  >();
  for (const item of inventoryItems) {
    const itemName = item.name ?? item.category;
    const key = `${itemName}::${item.category}`;
    const existing = invGroups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      invGroups.set(key, { items: [item], name: itemName, cat: item.category });
    }
  }
  for (const { items: group, name: itemName, cat } of invGroups.values()) {
    const totalQty = group.reduce((sum, i) => sum + i.quantity, 0);
    const weight = INVENTORY_BARTER_WEIGHT[cat] ?? DEFAULT_INVENTORY_BARTER_WEIGHT;
    scores.push({
      name: itemName,
      category: cat,
      source: 'inventory',
      rawScore: totalQty * weight,
      status: 'balanced',
      itemCount: group.length,
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

  return {
    categories: scores,
    offerItems,
    wantItems,
    totalScore,
    overallReadiness,
  };
}
