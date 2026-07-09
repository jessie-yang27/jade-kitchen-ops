// Tests for the seven eval checks — the most important code in the project.
// Strategy: build one known-good Sunday plan that satisfies every food-safety
// constraint, assert all checks pass, then corrupt exactly one thing per test
// and assert the right check fails with a message useful for re-prompting.

import { describe, expect, it } from "vitest";
import type { OpsPlan, SequenceTask, WeeklyDrop } from "../domain/types";
import { dishById } from "../data/dishes";
import {
  checkAllergenCoverage,
  checkBoxContiguity,
  checkDependencyOrder,
  checkDishCoverage,
  checkRefrigeration,
  checkResourceConflicts,
  checkWindowFit,
  classifyTask,
  runEvalChecks,
  toMinutes,
} from "./evalChecks";

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

function task(partial: Partial<SequenceTask> & Pick<SequenceTask, "id" | "task" | "start" | "durationMin">): SequenceTask {
  return {
    dish: "",
    box: "shared",
    assignee: "Jessie",
    resource: "none",
    dependsOn: [],
    ...partial,
  };
}

/**
 * A valid plan: prep 08:00–10:00, box A cooks 10:00–11:15 (incl. packaging),
 * box B cooks 11:15–12:00, refrigeration within 60 min of each packaging,
 * rice on the shared rice cooker, no resource overlaps, all 8 dishes present.
 */
function validPlan(): OpsPlan {
  return {
    saturdayPrep: [
      { task: "Soak brown rice", dish: "brown-rice", assignee: "Jessie", estMinutes: 10 },
      { task: "Boil lu dan eggs", dish: "lu-rou-fan", assignee: "Jessie", estMinutes: 30 },
    ],
    sundaySequence: [
      task({ id: "p1", task: "Prep aromatics and proteins", start: "08:00", durationMin: 60, resource: "prep-table" }),
      task({ id: "p2", task: "Wash and cut bok choy", dish: "bok-choy", box: "A", start: "09:00", durationMin: 30, resource: "prep-table" }),
      task({ id: "p3", task: "Trim green beans", dish: "sichuan-green-beans", box: "B", start: "09:30", durationMin: 30, resource: "prep-table" }),
      task({ id: "r1", task: "Cook brown rice", dish: "brown-rice", start: "08:15", durationMin: 75, resource: "rice-cooker" }),
      task({ id: "r2", task: "Cook white rice", dish: "white-rice", start: "09:30", durationMin: 60, resource: "rice-cooker" }),
      task({ id: "a1", task: "Cook lu rou with lu dan", dish: "lu-rou-fan", box: "A", start: "10:00", durationMin: 40, resource: "burner-1", dependsOn: ["p1"] }),
      task({ id: "a2", task: "Cook mapo tofu", dish: "mapo-tofu", box: "A", start: "10:00", durationMin: 30, resource: "burner-2", dependsOn: ["p1"] }),
      task({ id: "a3", task: "Stir-fry bok choy", dish: "bok-choy", box: "A", start: "10:40", durationMin: 15, resource: "burner-1", dependsOn: ["p2"] }),
      task({ id: "a4", task: "Package box A", box: "A", start: "10:55", durationMin: 20, resource: "prep-table", dependsOn: ["a1", "a2", "a3"] }),
      task({ id: "b1", task: "Cook beef with longhorn peppers", dish: "beef-with-peppers", box: "B", start: "11:15", durationMin: 25, resource: "burner-1", dependsOn: ["p1"] }),
      task({ id: "b2", task: "Cook soy glazed chicken", dish: "soy-glazed-chicken", box: "B", start: "11:15", durationMin: 30, resource: "burner-2", dependsOn: ["p1"] }),
      task({ id: "b3", task: "Stir-fry Sichuan green beans", dish: "sichuan-green-beans", box: "B", start: "11:40", durationMin: 15, resource: "burner-1", dependsOn: ["p3", "b1"] }),
      task({ id: "b4", task: "Package box B", box: "B", start: "11:45", durationMin: 15, resource: "prep-table", dependsOn: ["b1", "b2"] }),
      task({ id: "f1", task: "Refrigerate box A", box: "A", start: "11:30", durationMin: 10, dependsOn: ["a4"] }),
      task({ id: "f2", task: "Refrigerate box B", box: "B", start: "12:10", durationMin: 10, dependsOn: ["b4"] }),
      task({ id: "c1", task: "Clean stations and break down", start: "12:30", durationMin: 60 }),
    ],
    onePagers: [
      { station: "burner-1", audience: "volunteer", content: "How to cook lu rou safely…" },
    ],
    allergenFlags: [
      { box: "A", allergens: ["soy", "wheat", "egg", "shellfish"] },
      { box: "B", allergens: ["soy", "wheat", "shellfish"] },
    ],
  };
}

describe("helpers", () => {
  it("toMinutes parses HH:MM and rejects junk", () => {
    expect(toMinutes("08:00")).toBe(480);
    expect(toMinutes("23:59")).toBe(1439);
    expect(toMinutes("8:30")).toBe(510);
    expect(toMinutes("25:00")).toBeNull();
    expect(toMinutes("soon")).toBeNull();
  });

  it("classifyTask follows the verb convention", () => {
    expect(classifyTask(task({ id: "x", task: "Prep aromatics", start: "08:00", durationMin: 10 }))).toBe("prep");
    expect(classifyTask(task({ id: "x", task: "Chop scallions", start: "08:00", durationMin: 10 }))).toBe("prep");
    expect(classifyTask(task({ id: "x", task: "Cook lu rou", start: "10:00", durationMin: 10 }))).toBe("cook");
    expect(classifyTask(task({ id: "x", task: "Package box A", start: "11:00", durationMin: 10 }))).toBe("cook");
    expect(classifyTask(task({ id: "x", task: "Refrigerate box A", start: "11:30", durationMin: 10 }))).toBe("other");
  });
});

describe("the known-good plan", () => {
  it("passes all seven checks", () => {
    const results = runEvalChecks(validPlan(), drop, dishById);
    expect(results).toHaveLength(7);
    for (const result of results) {
      expect(result.failures, `${result.id} should pass`).toEqual([]);
      expect(result.passed).toBe(true);
    }
  });
});

describe("check 1: window-fit", () => {
  it("fails a prep task that runs past 10:00", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "p3")!.durationMin = 90; // 09:30 + 90 = 11:00
    const result = checkWindowFit(plan);
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toMatch(/prep task .* ends after the 10:00/);
  });

  it("fails a cook task that runs past 12:00", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "b2")!.durationMin = 90; // 11:15 + 90 = 12:45
    const result = checkWindowFit(plan);
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toMatch(/ends after the 12:00/);
  });

  it("fails tasks outside the 08:00–14:00 day", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "p1")!.start = "07:30";
    plan.sundaySequence.find((t) => t.id === "c1")!.start = "13:30"; // +60 = 14:30
    const result = checkWindowFit(plan);
    expect(result.failures).toHaveLength(2);
  });

  it("fails an unparseable start time", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "p1")!.start = "early";
    expect(checkWindowFit(plan).failures[0]).toMatch(/invalid start time/);
  });
});

describe("check 2: resource-conflict", () => {
  it("fails when two tasks overlap on the same burner", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "a2")!.resource = "burner-1"; // now overlaps a1
    const result = checkResourceConflicts(plan);
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toMatch(/burner-1 double-booked/);
  });

  it("ignores tasks with resource 'none'", () => {
    const plan = validPlan();
    // f1 (11:30) and a "none" task at the same time — no conflict
    plan.sundaySequence.push(task({ id: "x1", task: "Label boxes", start: "11:30", durationMin: 30 }));
    expect(checkResourceConflicts(plan).passed).toBe(true);
  });
});

describe("check 3: dependency-order", () => {
  it("fails when a task starts before its dependency ends", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "a4")!.start = "10:30"; // a1 ends 10:40
    const result = checkDependencyOrder(plan);
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toMatch(/starts before its dependency/);
  });

  it("fails on a dependsOn id that doesn't exist", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "a1")!.dependsOn = ["ghost-task"];
    expect(checkDependencyOrder(plan).failures[0]).toMatch(/unknown task id "ghost-task"/);
  });
});

describe("check 4: box-contiguity", () => {
  it("fails when a box B cook task interleaves inside box A's cook block", () => {
    const plan = validPlan();
    const b1 = plan.sundaySequence.find((t) => t.id === "b1")!;
    b1.start = "10:30"; // inside A's 10:00–11:15 block
    const result = checkBoxContiguity(plan);
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toMatch(/interleaves inside box A's cook block/);
  });

  it("allows shared tasks (rice) to run inside either block", () => {
    // r1/r2 are shared and overlap prep/cook spans in the valid plan already
    expect(checkBoxContiguity(validPlan()).passed).toBe(true);
  });
});

describe("check 5: refrigerate-within-60", () => {
  it("fails when no refrigerate task follows packaging", () => {
    const plan = validPlan();
    plan.sundaySequence = plan.sundaySequence.filter((t) => t.id !== "f1");
    const result = checkRefrigeration(plan);
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toMatch(/no refrigerate task follows/);
  });

  it("fails when the gap after packaging exceeds 60 minutes", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "f1")!.start = "12:30"; // a4 ends 11:15 → 75 min
    const result = checkRefrigeration(plan);
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toMatch(/sits 75 min/);
  });
});

describe("check 6: dish-coverage", () => {
  it("fails when a drop dish is missing and when a dish is hallucinated", () => {
    const plan = validPlan();
    plan.sundaySequence.find((t) => t.id === "a2")!.dish = "kung-pao-unicorn";
    const result = checkDishCoverage(plan, drop);
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/"mapo-tofu" never appears/),
        expect.stringMatching(/"kung-pao-unicorn", which is not a dish/),
      ]),
    );
  });

  it("allows dish-less tasks (setup, cleaning, packaging)", () => {
    expect(checkDishCoverage(validPlan(), drop).passed).toBe(true);
  });
});

describe("check 7: allergen-coverage", () => {
  it("fails when a box's allergen is missing from allergenFlags", () => {
    const plan = validPlan();
    plan.allergenFlags = plan.allergenFlags.map((flag) =>
      flag.box === "A"
        ? { ...flag, allergens: flag.allergens.filter((a) => a !== "egg") }
        : flag,
    );
    const result = checkAllergenCoverage(plan, drop, dishById);
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toMatch(/box A contains "egg" but it is missing/);
  });

  it("derives expected allergens from the week's dishes, per box", () => {
    // Box B has no egg dish — flags without egg must still pass
    expect(checkAllergenCoverage(validPlan(), drop, dishById).passed).toBe(true);
  });
});
