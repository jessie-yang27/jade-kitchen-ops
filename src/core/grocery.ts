// Grocery math — pure functions, no side effects, no AI.
// ratios × per-box order counts → merged → deduped → grouped by store
// section → diffed against inventory. The Stage 2 prompt consumes these
// pre-computed quantities; the model never calculates them.

import type { Order, StoreSection, Unit, WeeklyDrop } from "../domain/types";
import type { Dish } from "../domain/types";

export type BoxCounts = { A: number; B: number };

export type GroceryLine = {
  name: string;
  qty: number;
  unit: Unit;
  storeSection: StoreSection;
  /** Which dishes this quantity serves (for traceability in the UI). */
  dishes: string[];
};

/** Pantry item (qtyPerServing = null): not scaled, just "check inventory". */
export type PantryCheckLine = {
  name: string;
  storeSection: StoreSection;
  dishes: string[];
};

export type GroceryList = {
  lines: GroceryLine[];
  pantryChecks: PantryCheckLine[];
};

export type GroceryDiffLine = GroceryLine & {
  onHand: number;
  toBuy: number;
};

/** Round away float noise (0.33 × 13 kinds of numbers) to 2 decimals. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Servings needed per box = sum of order quantities for that box. */
export function countBoxServings(orders: Order[]): BoxCounts {
  const counts: BoxCounts = { A: 0, B: 0 };
  for (const order of orders) {
    counts[order.box] += order.qty;
  }
  return counts;
}

function dishIdsForDrop(drop: WeeklyDrop): { A: string[]; B: string[] } {
  const { boxA, boxB } = drop;
  return {
    A: [boxA.meat1, boxA.meat2, boxA.veggie, boxA.rice],
    B: [boxB.meat1, boxB.meat2, boxB.veggie, boxB.rice],
  };
}

/**
 * Scale every ingredient of every dish in the drop by that box's servings,
 * then merge duplicates across dishes and boxes (same name + unit).
 */
export function buildGroceryList(
  drop: WeeklyDrop,
  boxCounts: BoxCounts,
  dishById: Map<string, Dish>,
): GroceryList {
  const merged = new Map<string, GroceryLine>();
  const pantry = new Map<string, PantryCheckLine>();

  const boxes = dishIdsForDrop(drop);
  for (const box of ["A", "B"] as const) {
    const servings = boxCounts[box];
    for (const dishId of boxes[box]) {
      const dish = dishById.get(dishId);
      if (!dish) {
        throw new Error(`Unknown dish id in drop config: ${dishId}`);
      }
      for (const ingredient of dish.ingredients) {
        if (ingredient.qtyPerServing === null) {
          const existing = pantry.get(ingredient.name);
          if (existing) {
            if (!existing.dishes.includes(dish.id)) existing.dishes.push(dish.id);
          } else {
            pantry.set(ingredient.name, {
              name: ingredient.name,
              storeSection: ingredient.storeSection,
              dishes: [dish.id],
            });
          }
          continue;
        }
        const key = `${ingredient.name}|${ingredient.unit}`;
        const existing = merged.get(key);
        const qty = ingredient.qtyPerServing * servings;
        if (existing) {
          existing.qty = round2(existing.qty + qty);
          if (!existing.dishes.includes(dish.id)) existing.dishes.push(dish.id);
        } else {
          merged.set(key, {
            name: ingredient.name,
            qty: round2(qty),
            unit: ingredient.unit,
            storeSection: ingredient.storeSection,
            dishes: [dish.id],
          });
        }
      }
    }
  }

  return {
    lines: [...merged.values()],
    pantryChecks: [...pantry.values()],
  };
}

const SECTION_ORDER: StoreSection[] = ["meat", "produce", "dairy", "pantry"];

/** Group lines by store section, in a stable shopping-friendly order. */
export function groupBySection<T extends { storeSection: StoreSection }>(
  lines: T[],
): { section: StoreSection; lines: T[] }[] {
  return SECTION_ORDER.map((section) => ({
    section,
    lines: lines.filter((line) => line.storeSection === section),
  })).filter((group) => group.lines.length > 0);
}

export type InventoryEntry = { name: string; qty: number; unit: string };

/**
 * Diff the scaled list against current inventory (matched on name + unit).
 * `toBuy` never goes negative — surplus just means nothing to buy.
 */
export function diffAgainstInventory(
  lines: GroceryLine[],
  inventory: InventoryEntry[],
): GroceryDiffLine[] {
  const onHandByKey = new Map(
    inventory.map((item) => [`${item.name}|${item.unit}`, item.qty]),
  );
  return lines.map((line) => {
    const onHand = onHandByKey.get(`${line.name}|${line.unit}`) ?? 0;
    return {
      ...line,
      onHand,
      toBuy: round2(Math.max(0, line.qty - onHand)),
    };
  });
}
