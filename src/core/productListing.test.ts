import { describe, expect, it } from "vitest";
import type { Dish } from "../domain/types";
import { buildProductListing, coreIngredientsFor, listingDishIds } from "./productListing";

const dish: Dish = {
  id: "lu-rou-fan",
  name: "Lu rou with lu dan",
  category: "meat",
  ingredients: [
    { name: "Eggs (lu dan)", qtyPerServing: 1.5, unit: "ct", storeSection: "dairy" },
    { name: "Ground pork", qtyPerServing: 0.125, unit: "lb", storeSection: "meat" },
    { name: "Star anise", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    { name: "Light soy sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
  ],
  steps: [],
  prepNotes: [],
  allergens: ["soy", "egg"],
  cookMinutes: 45,
  resources: [],
  ratioSource: "transcribed",
  blurb: "Our #1 bestseller.",
  imageUrl: "https://example.com/lu-rou.jpg",
};

describe("coreIngredientsFor", () => {
  it("only includes named (non-pantry) ingredients", () => {
    expect(coreIngredientsFor(dish)).toEqual(["eggs (lu dan)", "ground pork"]);
  });
});

describe("buildProductListing", () => {
  it("composes title, blurb, ingredients, and fixed boilerplate", () => {
    const listing = buildProductListing(dish);
    expect(listing.title).toBe("Lu rou with lu dan (4 servings)");
    expect(listing.blurb).toBe("Our #1 bestseller.");
    expect(listing.imageUrl).toBe("https://example.com/lu-rou.jpg");
    expect(listing.contains).toBe("Contains: soy, egg.");
    expect(listing.disclaimer).toMatch(/vegetable oil/);
    expect(listing.allergenInfo).toMatch(/Cooked in a facility/);
    expect(listing.bestBy).toMatch(/5 days/);
  });

  it("falls back to empty blurb/null image when unset", () => {
    const bare: Dish = { ...dish, blurb: undefined, imageUrl: undefined };
    const listing = buildProductListing(bare);
    expect(listing.blurb).toBe("");
    expect(listing.imageUrl).toBeNull();
  });

  it("omits the Contains line when a dish has no allergens", () => {
    const listing = buildProductListing({ ...dish, allergens: [] });
    expect(listing.contains).toBe("");
  });
});

describe("listingDishIds", () => {
  it("dedupes when the same dish fills two slots", () => {
    expect(listingDishIds({ meat1: "a", meat2: "a", veggie: "b" })).toEqual(["a", "b"]);
  });

  it("drops empty slots", () => {
    expect(listingDishIds({ meat1: "a", meat2: "", veggie: "" })).toEqual(["a"]);
  });
});
