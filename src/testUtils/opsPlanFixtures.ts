// Shared test fixtures: a WeeklyDrop and a known-good Sunday OpsPlan that
// satisfies every food-safety constraint. Used by both evalChecks.test.ts
// (corrupt one thing, assert the right check fails) and opsPlan.test.ts
// (simulate the model returning this plan verbatim).

import type { OpsPlan, SequenceTask, WeeklyDrop } from "../domain/types";

export const testDrop: WeeklyDrop = {
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

export function taskFixture(
  partial: Partial<SequenceTask> & Pick<SequenceTask, "id" | "task" | "start" | "durationMin">,
): SequenceTask {
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
export function validOpsPlan(): OpsPlan {
  const task = taskFixture;
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
