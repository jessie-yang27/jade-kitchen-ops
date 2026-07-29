// Shopify product listing composition — pure, deterministic, no AI.
// Everything here is either fixed boilerplate (the disclaimer/allergen/best-by
// language is the same for every listing) or derived directly from dish data
// (core ingredients, allergens). Only `blurb` is freeform marketing copy, and
// it's written by hand in the dish editor, not generated.

import type { Dish } from "../domain/types";

export const SERVINGS_PER_LISTING = 4;

export const COOKING_DISCLAIMER =
  "All dishes are cooked with vegetable oil and include a variety of Chinese seasonings such as soy sauce, Shaoxing wine, oyster sauce, black vinegar, salt, pepper, chili pepper, and peppercorns.";

export const ALLERGEN_FACILITY_NOTICE =
  "Allergen Information: Cooked in a facility that also handles eggs, fish, milk, peanuts, sesame, shellfish, soy, tree nuts, and wheat. Please let us know if you or any member of your party has any food allergies.";

export const BEST_BY_NOTICE = "Best By: 5 days after purchase. Keep refrigerated.";

const MAX_CORE_INGREDIENTS = 6;

export type ProductListing = {
  dishId: string;
  title: string;
  blurb: string;
  imageUrl: string | null;
  coreIngredients: string[];
  disclaimer: string;
  contains: string;
  allergenInfo: string;
  bestBy: string;
};

/** First few named ingredients (skipping pantry/seasoning items) for the "Core Ingredients:" line. */
export function coreIngredientsFor(dish: Dish): string[] {
  return dish.ingredients
    .filter((ing) => ing.qtyPerServing !== null)
    .slice(0, MAX_CORE_INGREDIENTS)
    .map((ing) => ing.name.toLowerCase());
}

export function buildProductListing(dish: Dish): ProductListing {
  return {
    dishId: dish.id,
    title: `${dish.name} (${SERVINGS_PER_LISTING} servings)`,
    blurb: dish.blurb?.trim() || "",
    imageUrl: dish.imageUrl?.trim() || null,
    coreIngredients: coreIngredientsFor(dish),
    disclaimer: COOKING_DISCLAIMER,
    contains: dish.allergens.length > 0 ? `Contains: ${dish.allergens.join(", ")}.` : "",
    allergenInfo: ALLERGEN_FACILITY_NOTICE,
    bestBy: BEST_BY_NOTICE,
  };
}

/** Unique dishes (by id) referenced by a box's meat1/meat2/veggie slots — rice isn't listed as its own product. */
export function listingDishIds(box: { meat1: string; meat2: string; veggie: string }): string[] {
  return [...new Set([box.meat1, box.meat2, box.veggie].filter(Boolean))];
}
