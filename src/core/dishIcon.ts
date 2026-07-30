// Generates a simple flat-color SVG icon per dish as a data URI — the
// fallback "photo" until real food photography exists. Deterministic (same
// dish id always gets the same color) so it's stable across reloads, and it
// automatically covers any dish added later through the library, not just
// today's seed data. Explicitly illustrative, not meant to pass as a real
// product photo — no external fetch, no stock-photo licensing question.

import type { Dish, DishCategory } from "../domain/types";

const PALETTE = [
  "#F4A261", // warm orange
  "#E76F51", // terracotta
  "#8AB17D", // sage green
  "#E9C46A", // golden
  "#7FB3D5", // soft blue
  "#D08C60", // clay
  "#A78BFA", // soft violet
  "#68B0AB", // teal
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function colorForDish(dishId: string): string {
  return PALETTE[hashString(dishId) % PALETTE.length]!;
}

/** Simple white line-art glyph per category, centered in a 100x100 viewBox. */
function glyphFor(category: DishCategory): string {
  switch (category) {
    case "meat": // wok
      return `<path d="M20 55 Q50 85 80 55" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
        <line x1="14" y1="55" x2="86" y2="55" stroke="white" stroke-width="5" stroke-linecap="round"/>
        <line x1="14" y1="55" x2="4" y2="48" stroke="white" stroke-width="5" stroke-linecap="round"/>
        <line x1="86" y1="55" x2="96" y2="48" stroke="white" stroke-width="5" stroke-linecap="round"/>`;
    case "veggie": // leaf
      return `<path d="M50 18 C76 24 80 56 50 84 C20 56 24 24 50 18 Z" fill="white"/>
        <line x1="50" y1="30" x2="50" y2="76" stroke="#8AB17D" stroke-width="3"/>`;
    case "rice": // bowl with steam
      return `<path d="M22 55 Q50 82 78 55 L74 63 Q50 79 26 63 Z" fill="white"/>
        <path d="M20 55 Q50 66 80 55" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M42 42 Q38 32 44 24" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M58 42 Q54 32 60 24" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case "soup": // deep bowl with steam
      return `<path d="M18 48 Q50 84 82 48 L76 60 Q50 82 24 60 Z" fill="white"/>
        <path d="M16 48 Q50 60 84 48" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M50 28 Q46 18 52 10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
}

export function dishIconSvg(dish: Pick<Dish, "id" | "category">): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="14" fill="${colorForDish(
    dish.id,
  )}"/>${glyphFor(dish.category)}</svg>`;
}

export function dishIconDataUri(dish: Pick<Dish, "id" | "category">): string {
  return `data:image/svg+xml,${encodeURIComponent(dishIconSvg(dish))}`;
}
