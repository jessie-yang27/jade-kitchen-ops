// Stage 2 injected context — the "computed weekly" layer of the three-layer
// prompt (spec §5). Everything here is pre-computed deterministic code: the
// grocery quantities are already scaled and diffed against inventory before
// the model ever sees them. The model consumes these numbers; it never
// calculates them.

import type { BoxCounts } from "../core/grocery";
import { buildGroceryList, diffAgainstInventory, groupBySection } from "../core/grocery";
import type { Dish, WeeklyDrop } from "../domain/types";
import type { InventoryItem } from "../data/inventory";
import type { RosterMember } from "../data/roster";
import type { ScheduleResource } from "../domain/types";

export type WeeklyContext = {
  weekOf: string;
  boxes: {
    box: "A" | "B";
    servings: number;
    dishes: Pick<
      Dish,
      "id" | "name" | "nameZh" | "category" | "steps" | "prepNotes" | "allergens" | "cookMinutes" | "resources"
    >[];
  }[];
  scaledGroceryList: {
    section: string;
    lines: { name: string; toBuy: number; onHand: number; unit: string; dishes: string[] }[];
  }[];
  pantryChecks: { name: string; dishes: string[] }[];
  roster: RosterMember[];
  availableResources: Exclude<ScheduleResource, "none">[];
};

export function buildWeeklyContext(
  drop: WeeklyDrop,
  boxCounts: BoxCounts,
  dishById: Map<string, Dish>,
  inventory: InventoryItem[],
  roster: RosterMember[],
  availableResources: Exclude<ScheduleResource, "none">[],
): WeeklyContext {
  const dishesFor = (ids: string[]) =>
    ids.map((id) => {
      const dish = dishById.get(id);
      if (!dish) throw new Error(`buildWeeklyContext: unknown dish id "${id}"`);
      return {
        id: dish.id,
        name: dish.name,
        nameZh: dish.nameZh,
        category: dish.category,
        steps: dish.steps,
        prepNotes: dish.prepNotes,
        allergens: dish.allergens,
        cookMinutes: dish.cookMinutes,
        resources: dish.resources,
      };
    });

  const groceryList = buildGroceryList(drop, boxCounts, dishById);
  const diffed = diffAgainstInventory(groceryList.lines, inventory);
  const grouped = groupBySection(diffed);

  return {
    weekOf: drop.weekOf,
    boxes: [
      {
        box: "A",
        servings: boxCounts.A,
        dishes: dishesFor([drop.boxA.meat1, drop.boxA.meat2, drop.boxA.veggie, drop.boxA.rice]),
      },
      {
        box: "B",
        servings: boxCounts.B,
        dishes: dishesFor([drop.boxB.meat1, drop.boxB.meat2, drop.boxB.veggie, drop.boxB.rice]),
      },
    ],
    scaledGroceryList: grouped.map((group) => ({
      section: group.section,
      lines: group.lines.map((line) => ({
        name: line.name,
        toBuy: line.toBuy,
        onHand: line.onHand,
        unit: line.unit,
        dishes: line.dishes,
      })),
    })),
    pantryChecks: groceryList.pantryChecks.map((item) => ({ name: item.name, dishes: item.dishes })),
    roster,
    availableResources,
  };
}
