/**
 * Category-level estimates for how many person-days a single unit provides.
 * These are intentionally rough — the feature is for entertainment.
 */
export const PANTRY_DAYS_PER_UNIT: Record<string, number> = {
  'Canned Goods': 1.5,
  'Dry Goods': 3,
  Frozen: 2,
  Fresh: 0.5,
};
export const DEFAULT_PANTRY_DAYS_PER_UNIT = 1;

/** Non-food inventory contributes to a generic "supply readiness" score (days). */
export const INVENTORY_DAYS_PER_UNIT: Record<string, number> = {
  'Home Base': 0.5,
  'Main Vehicle': 0.25,
};
export const DEFAULT_INVENTORY_DAYS_PER_UNIT = 0.3;

export interface ResultBreakdown {
  pantryDays: number;
  inventoryBonus: number;
  totalDays: number;
  itemCount: number;
}

export interface StoreItem {
  category: string;
  quantity: number;
}

export function calculate(
  pantryItems: StoreItem[],
  inventoryItems: StoreItem[],
  people: number,
): ResultBreakdown {
  const safePeople = Math.max(1, people);

  // Food supply estimate
  let rawFoodPersonDays = 0;
  for (const item of pantryItems) {
    const rate =
      PANTRY_DAYS_PER_UNIT[item.category] ?? DEFAULT_PANTRY_DAYS_PER_UNIT;
    rawFoodPersonDays += item.quantity * rate;
  }
  const pantryDays = rawFoodPersonDays / safePeople;

  // Inventory "bonus" days (water, gear, medical adds resilience)
  let rawInventoryPersonDays = 0;
  for (const item of inventoryItems) {
    const rate =
      INVENTORY_DAYS_PER_UNIT[item.category] ?? DEFAULT_INVENTORY_DAYS_PER_UNIT;
    rawInventoryPersonDays += item.quantity * rate;
  }
  const inventoryBonus = rawInventoryPersonDays / safePeople;

  return {
    pantryDays,
    inventoryBonus,
    totalDays: pantryDays + inventoryBonus,
    itemCount: pantryItems.length + inventoryItems.length,
  };
}

export function readinessLabel(days: number): { label: string; icon: string } {
  if (days < 3) return { label: 'Critical — less than 72 hours', icon: 'warning-outline' };
  if (days < 7) return { label: 'Low — under a week', icon: 'alert-circle-outline' };
  if (days < 30) return { label: 'Moderate — a few weeks', icon: 'checkmark-circle-outline' };
  if (days < 90) return { label: 'Good — over a month', icon: 'shield-checkmark-outline' };
  return { label: 'Excellent — 3+ months', icon: 'star-outline' };
}
