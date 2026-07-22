// Runtime dish-library persistence. The dish library starts from the seed
// data (src/data/dishes.ts) but is editable at runtime (CRUD in the UI);
// edits persist to localStorage per spec §1 ("no database for v1; localStorage
// optional later" — this is exactly that "later").

import type { Dish } from "../domain/types";
import { dishes as seedDishes } from "./dishes";

const STORAGE_KEY = "jade-kitchen-dishes-v1";

export function loadDishes(): Dish[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDishes;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return seedDishes;
    return parsed as Dish[];
  } catch {
    return seedDishes;
  }
}

export function saveDishes(dishes: Dish[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes));
  } catch {
    // Storage full or unavailable (private browsing) — edits still work for
    // the session, they just won't survive a reload. Not worth surfacing.
  }
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dish"
  );
}

/** A unique id derived from the dish name, avoiding collisions with existing dishes. */
export function generateDishId(name: string, existing: Dish[]): string {
  const base = slugify(name);
  const taken = new Set(existing.map((d) => d.id));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
