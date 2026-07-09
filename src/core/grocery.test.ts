import { describe, expect, it } from "vitest";
import type { Order, WeeklyDrop } from "../domain/types";
import { dishById } from "../data/dishes";
import {
  buildGroceryList,
  countBoxServings,
  diffAgainstInventory,
  groupBySection,
} from "./grocery";

const drop: WeeklyDrop = {
  weekOf: "2026-07-13",
  boxA: { meat1: "lu-rou-fan", meat2: "mapo-tofu", veggie: "bok-choy", rice: "brown-rice" },
  boxB: {
    meat1: "beef-with-peppers",
    meat2: "soy-glazed-chicken",
    veggie: "sichuan-green-beans",
    rice: "white-rice",
  },
  orderCap: 40,
  priceA: 18,
  priceB: 18,
  status: "launched",
};

function order(box: "A" | "B", qty: number): Order {
  return {
    id: `#${box}${qty}`,
    customer: { id: "c", firstName: "T", email: "t@example.com", phone: "1", orderCount: 2 },
    box,
    qty,
    fulfillment: "pickup",
  };
}

describe("countBoxServings", () => {
  it("sums order quantities per box", () => {
    const counts = countBoxServings([order("A", 1), order("A", 3), order("B", 2)]);
    expect(counts).toEqual({ A: 4, B: 2 });
  });

  it("returns zeros for no orders", () => {
    expect(countBoxServings([])).toEqual({ A: 0, B: 0 });
  });
});

describe("buildGroceryList", () => {
  const list = buildGroceryList(drop, { A: 4, B: 2 }, dishById);
  const line = (name: string, unit: string) =>
    list.lines.find((l) => l.name === name && l.unit === unit);

  it("scales a single-dish ingredient by its box's servings", () => {
    // Bok choy only in box A: 0.33 lb/serving × 4 servings
    expect(line("Bok choy", "lb")?.qty).toBe(1.32);
  });

  it("merges the same ingredient across dishes and boxes", () => {
    // Garlic: mapo 1.5×4 + bok choy 0.5×4 + beef 0.75×2 + green beans 0.75×2
    const garlic = line("Garlic", "ct");
    expect(garlic?.qty).toBe(11);
    expect(garlic?.dishes.sort()).toEqual(
      ["beef-with-peppers", "bok-choy", "mapo-tofu", "sichuan-green-beans"].sort(),
    );
  });

  it("keeps same-name ingredients with different units as separate lines", () => {
    // Ground pork: lu rou uses lb, mapo uses oz — must NOT be summed together
    expect(line("Ground pork", "lb")?.qty).toBe(0.5); // 0.125 × 4
    expect(line("Ground pork", "oz")?.qty).toBe(12); // 3 × 4
  });

  it("collects pantry items (null qty) as check-inventory lines, deduped", () => {
    const lightSoy = list.pantryChecks.filter((p) => p.name === "Light soy sauce");
    expect(lightSoy).toHaveLength(1);
    expect(lightSoy[0]!.dishes.sort()).toEqual(["beef-with-peppers", "lu-rou-fan"]);
    // pantry items never appear as scaled lines
    expect(line("Light soy sauce", "pantry")).toBeUndefined();
  });

  it("throws on a dish id that is not in the library", () => {
    const badDrop = { ...drop, boxA: { ...drop.boxA, meat1: "nonexistent" } };
    expect(() => buildGroceryList(badDrop, { A: 1, B: 1 }, dishById)).toThrow(/nonexistent/);
  });
});

describe("groupBySection", () => {
  it("groups lines in shopping order and drops empty sections", () => {
    const list = buildGroceryList(drop, { A: 4, B: 2 }, dishById);
    const groups = groupBySection(list.lines);
    const sections = groups.map((g) => g.section);
    expect(sections).toEqual(["meat", "produce", "dairy", "pantry"]);
    for (const group of groups) {
      expect(group.lines.length).toBeGreaterThan(0);
      for (const l of group.lines) expect(l.storeSection).toBe(group.section);
    }
  });
});

describe("diffAgainstInventory", () => {
  it("subtracts on-hand stock and floors toBuy at zero", () => {
    const list = buildGroceryList(drop, { A: 4, B: 2 }, dishById);
    const diffed = diffAgainstInventory(list.lines, [
      { name: "Ground pork", qty: 2, unit: "lb" }, // more than the 0.5 lb needed
      { name: "Flank steak", qty: 2, unit: "oz" }, // less than the 6 oz needed
    ]);
    const pork = diffed.find((l) => l.name === "Ground pork" && l.unit === "lb");
    expect(pork).toMatchObject({ qty: 0.5, onHand: 2, toBuy: 0 });
    const steak = diffed.find((l) => l.name === "Flank steak");
    expect(steak).toMatchObject({ qty: 6, onHand: 2, toBuy: 4 });
  });

  it("treats unmatched units as not on hand", () => {
    const list = buildGroceryList(drop, { A: 4, B: 2 }, dishById);
    const diffed = diffAgainstInventory(list.lines, [
      { name: "Ground pork", qty: 99, unit: "oz" }, // oz stock ≠ lb line
    ]);
    const porkLb = diffed.find((l) => l.name === "Ground pork" && l.unit === "lb");
    expect(porkLb?.toBuy).toBe(0.5);
  });
});
