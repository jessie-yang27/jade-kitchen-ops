import { describe, expect, it } from "vitest";
import type { Dish, SequenceTask } from "../domain/types";
import { categorizeTask, groupTasksByPrepCategory } from "./prepCategory";

const dishById = new Map<string, Dish>([
  ["bok-choy", { id: "bok-choy", name: "Bok choy", category: "veggie" } as Dish],
  ["lu-rou-fan", { id: "lu-rou-fan", name: "Lu rou", category: "meat" } as Dish],
  ["brown-rice", { id: "brown-rice", name: "Brown rice", category: "rice" } as Dish],
]);

function task(partial: Partial<SequenceTask> & Pick<SequenceTask, "task">): SequenceTask {
  return {
    id: "t",
    dish: "",
    box: "shared",
    assignee: "Jessie",
    start: "08:00",
    durationMin: 10,
    resource: "none",
    dependsOn: [],
    ...partial,
  };
}

describe("categorizeTask", () => {
  it("buckets veggie prep separately from meat prep", () => {
    expect(categorizeTask(task({ task: "Wash and cut bok choy", dish: "bok-choy" }), dishById)).toBe("vegetable-prep");
    expect(categorizeTask(task({ task: "Prep proteins", dish: "lu-rou-fan" }), dishById)).toBe("meat-prep");
  });

  it("buckets cook tasks as cooking regardless of dish", () => {
    expect(categorizeTask(task({ task: "Cook lu rou", dish: "lu-rou-fan" }), dishById)).toBe("cooking");
    expect(categorizeTask(task({ task: "Stir-fry bok choy", dish: "bok-choy" }), dishById)).toBe("cooking");
  });

  it("packaging beats the cook-verb match ('package' is a cook verb)", () => {
    expect(categorizeTask(task({ task: "Package box A" }), dishById)).toBe("packaging");
  });

  it("routes refrigeration tasks to packaging too", () => {
    expect(categorizeTask(task({ task: "Refrigerate box A" }), dishById)).toBe("packaging");
  });

  it("falls back to other for prep with no dish or a non meat/veggie dish", () => {
    expect(categorizeTask(task({ task: "Prep cooking station" }), dishById)).toBe("other");
    expect(categorizeTask(task({ task: "Soak rice", dish: "brown-rice" }), dishById)).toBe("other");
  });

  it("falls back to other for unclassifiable tasks", () => {
    expect(categorizeTask(task({ task: "Clean stations and break down" }), dishById)).toBe("other");
  });
});

describe("groupTasksByPrepCategory", () => {
  it("partitions every task into exactly one bucket, sorted by start time", () => {
    const tasks = [
      task({ id: "a", task: "Cook lu rou", dish: "lu-rou-fan", start: "10:30" }),
      task({ id: "b", task: "Wash bok choy", dish: "bok-choy", start: "08:30" }),
      task({ id: "c", task: "Package box A", start: "11:00" }),
      task({ id: "d", task: "Prep proteins", dish: "lu-rou-fan", start: "08:00" }),
    ];
    const groups = groupTasksByPrepCategory(tasks, dishById);
    expect(groups["vegetable-prep"].map((t) => t.id)).toEqual(["b"]);
    expect(groups["meat-prep"].map((t) => t.id)).toEqual(["d"]);
    expect(groups.cooking.map((t) => t.id)).toEqual(["a"]);
    expect(groups.packaging.map((t) => t.id)).toEqual(["c"]);
    const total = Object.values(groups).reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(tasks.length);
  });
});
