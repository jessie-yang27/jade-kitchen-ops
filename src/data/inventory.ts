// Current-inventory fixture: what's already on the shelf at Foundation
// Kitchen. The grocery diff subtracts this from the scaled shopping list;
// pantry items (qtyPerServing = null) become "check inventory" lines.

export type InventoryItem = {
  name: string; // must match Ingredient.name to be diffed
  qty: number;
  unit: string;
};

export const inventory: InventoryItem[] = [
  { name: "White rice", qty: 10, unit: "cup" },
  { name: "Brown rice", qty: 6, unit: "cup" },
  { name: "Ground pork", qty: 2, unit: "lb" },
  { name: "Eggs (lu dan)", qty: 24, unit: "ct" },
  { name: "Garlic", qty: 20, unit: "ct" },
  { name: "Ginger", qty: 6, unit: "ct" },
];
