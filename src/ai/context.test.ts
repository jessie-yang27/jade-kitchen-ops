import { describe, expect, it } from "vitest";
import { dishById } from "../data/dishes";
import { inventory } from "../data/inventory";
import { availableResources } from "../data/resources";
import { roster } from "../data/roster";
import { testDrop } from "../testUtils/opsPlanFixtures";
import { buildWeeklyContext } from "./context";

describe("buildWeeklyContext", () => {
  const context = buildWeeklyContext(testDrop, { A: 12, B: 10 }, dishById, inventory, roster, availableResources);

  it("includes exactly the drop's 8 dishes, split by box, with recipe steps intact", () => {
    expect(context.boxes).toHaveLength(2);
    const boxA = context.boxes.find((b) => b.box === "A")!;
    const boxB = context.boxes.find((b) => b.box === "B")!;
    expect(boxA.dishes.map((d) => d.id).sort()).toEqual(
      ["bok-choy", "brown-rice", "lu-rou-fan", "mapo-tofu"].sort(),
    );
    expect(boxB.dishes.map((d) => d.id).sort()).toEqual(
      ["beef-with-peppers", "sichuan-green-beans", "soy-glazed-chicken", "white-rice"].sort(),
    );
    expect(boxA.dishes.find((d) => d.id === "lu-rou-fan")?.steps.length).toBeGreaterThan(0);
  });

  it("carries the box servings through unchanged", () => {
    expect(context.boxes.find((b) => b.box === "A")?.servings).toBe(12);
    expect(context.boxes.find((b) => b.box === "B")?.servings).toBe(10);
  });

  it("includes the pre-scaled, inventory-diffed grocery list — the model never computes quantities", () => {
    const allLines = context.scaledGroceryList.flatMap((g) => g.lines);
    expect(allLines.length).toBeGreaterThan(0);
    // every line already has toBuy/onHand computed, nothing left for the model to calculate
    for (const line of allLines) {
      expect(typeof line.toBuy).toBe("number");
      expect(typeof line.onHand).toBe("number");
    }
  });

  it("passes through roster and available resources fixtures unchanged", () => {
    expect(context.roster).toEqual(roster);
    expect(context.availableResources).toEqual(availableResources);
  });

  it("is JSON-serializable (safe to embed directly in the prompt)", () => {
    expect(() => JSON.stringify(context)).not.toThrow();
  });
});
