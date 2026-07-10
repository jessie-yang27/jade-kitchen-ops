// The seven automated eval checks (spec §5) — pure functions run in code
// against the Stage 2 AI's JSON output. On failure the failure strings are
// appended to a single re-prompt; a second failure flags for human review.
//
// Task classification convention: checks 1 and 4 need to know whether a task
// is prep or cook. The Stage 2 system prompt instructs the model to start
// task names with a classifying verb; classifyTask() encodes the same verb
// lists, so prompt and eval stay in lockstep.

import type { Dish, OpsPlan, SequenceTask, WeeklyDrop } from "../domain/types";
import {
  COOK_VERBS,
  PACKAGE_KEYWORD_PATTERN,
  PREP_VERBS,
  REFRIGERATE_KEYWORD_PATTERN,
} from "./taskConventions";

export type EvalCheckId =
  | "window-fit"
  | "resource-conflict"
  | "dependency-order"
  | "box-contiguity"
  | "refrigerate-within-60"
  | "dish-coverage"
  | "allergen-coverage";

export type EvalResult = {
  id: EvalCheckId;
  name: string;
  passed: boolean;
  /** Human-readable failure descriptions — appended verbatim to re-prompts. */
  failures: string[];
};

// Sunday windows from the Food Safety SOP (spec §5), in minutes since midnight.
export const DAY_START = 8 * 60; // 08:00
export const PREP_END = 10 * 60; // 10:00
export const COOK_END = 12 * 60; // 12:00
export const DAY_END = 14 * 60; // 14:00
export const MAX_UNREFRIGERATED_MIN = 60;

/** "HH:MM" → minutes since midnight. Returns null for malformed times. */
export function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export type TaskKind = "prep" | "cook" | "other";

export function classifyTask(task: SequenceTask): TaskKind {
  if (PREP_VERBS.test(task.task)) return "prep";
  if (COOK_VERBS.test(task.task)) return "cook";
  return "other";
}

function taskEnd(task: SequenceTask): number | null {
  const start = toMinutes(task.start);
  return start === null ? null : start + task.durationMin;
}

function describe(task: SequenceTask): string {
  return `"${task.task}" (${task.id}, ${task.start} +${task.durationMin}min)`;
}

// ---------------------------------------------------------------- check 1
/** Prep tasks end by 10:00, cook tasks by 12:00, everything within 8:00–14:00. */
export function checkWindowFit(plan: OpsPlan): EvalResult {
  const failures: string[] = [];
  for (const task of plan.sundaySequence) {
    const start = toMinutes(task.start);
    const end = taskEnd(task);
    if (start === null || end === null) {
      failures.push(`${describe(task)} has an invalid start time`);
      continue;
    }
    if (start < DAY_START) failures.push(`${describe(task)} starts before 08:00`);
    if (end > DAY_END) failures.push(`${describe(task)} ends after 14:00`);
    const kind = classifyTask(task);
    if (kind === "prep" && end > PREP_END) {
      failures.push(`prep task ${describe(task)} ends after the 10:00 prep window`);
    }
    if (kind === "cook" && end > COOK_END) {
      failures.push(`cook task ${describe(task)} ends after the 12:00 cook window`);
    }
  }
  return { id: "window-fit", name: "Every task fits its window", passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------- check 2
/** No two tasks may overlap on the same physical resource. */
export function checkResourceConflicts(plan: OpsPlan): EvalResult {
  const failures: string[] = [];
  const byResource = new Map<string, SequenceTask[]>();
  for (const task of plan.sundaySequence) {
    if (task.resource === "none") continue;
    const list = byResource.get(task.resource) ?? [];
    list.push(task);
    byResource.set(task.resource, list);
  }
  for (const [resource, tasks] of byResource) {
    const sorted = tasks
      .map((task) => ({ task, start: toMinutes(task.start) }))
      .filter((entry): entry is { task: SequenceTask; start: number } => entry.start !== null)
      .sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const curr = sorted[i]!;
      if (curr.start < prev.start + prev.task.durationMin) {
        failures.push(
          `${resource} double-booked: ${describe(prev.task)} overlaps ${describe(curr.task)}`,
        );
      }
    }
  }
  return { id: "resource-conflict", name: "No resource double-booked", passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------- check 3
/** Every dependsOn id must exist, and the dependency must end before the task starts. */
export function checkDependencyOrder(plan: OpsPlan): EvalResult {
  const failures: string[] = [];
  const byId = new Map(plan.sundaySequence.map((task) => [task.id, task]));
  for (const task of plan.sundaySequence) {
    const start = toMinutes(task.start);
    for (const depId of task.dependsOn) {
      const dep = byId.get(depId);
      if (!dep) {
        failures.push(`${describe(task)} depends on unknown task id "${depId}"`);
        continue;
      }
      const depEnd = taskEnd(dep);
      if (start !== null && depEnd !== null && start < depEnd) {
        failures.push(`${describe(task)} starts before its dependency ${describe(dep)} ends`);
      }
    }
  }
  return { id: "dependency-order", name: "Dependency order respected", passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------- check 4
/**
 * Box-sequence rule (Food Safety SOP): cook all dishes for a given box in
 * sequence so packaged boxes don't sit idle. Interpreted as: no box-B cook
 * task may start inside box A's cook block (first start → last end), and
 * vice versa. Shared tasks are exempt.
 */
export function checkBoxContiguity(plan: OpsPlan): EvalResult {
  const failures: string[] = [];
  const cookSpan = (box: "A" | "B"): { start: number; end: number } | null => {
    const cooks = plan.sundaySequence.filter(
      (task) => task.box === box && classifyTask(task) === "cook",
    );
    let start = Infinity;
    let end = -Infinity;
    for (const task of cooks) {
      const s = toMinutes(task.start);
      const e = taskEnd(task);
      if (s === null || e === null) continue;
      start = Math.min(start, s);
      end = Math.max(end, e);
    }
    return cooks.length === 0 ? null : { start, end };
  };

  for (const [box, other] of [["A", "B"], ["B", "A"]] as const) {
    const span = cookSpan(box);
    if (!span) continue;
    for (const task of plan.sundaySequence) {
      if (task.box !== other || classifyTask(task) !== "cook") continue;
      const s = toMinutes(task.start);
      if (s !== null && s > span.start && s < span.end) {
        failures.push(
          `box ${other} cook task ${describe(task)} interleaves inside box ${box}'s cook block`,
        );
      }
    }
  }
  return { id: "box-contiguity", name: "Per-box cook tasks are contiguous", passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------- check 5
/**
 * Danger-zone rule: each box's packaging task must be followed by a
 * refrigerate task starting within 60 minutes of packaging ending.
 */
export function checkRefrigeration(plan: OpsPlan): EvalResult {
  const failures: string[] = [];
  const isPackage = (task: SequenceTask) => PACKAGE_KEYWORD_PATTERN.test(task.task);
  const isRefrigerate = (task: SequenceTask) => REFRIGERATE_KEYWORD_PATTERN.test(task.task);

  for (const box of ["A", "B"] as const) {
    const packs = plan.sundaySequence.filter((t) => isPackage(t) && (t.box === box || t.box === "shared"));
    for (const pack of packs) {
      const packEnd = taskEnd(pack);
      if (packEnd === null) continue;
      const fridge = plan.sundaySequence
        .filter((t) => isRefrigerate(t) && (t.box === pack.box || t.box === "shared"))
        .map((t) => ({ t, start: toMinutes(t.start) }))
        .filter((e): e is { t: SequenceTask; start: number } => e.start !== null && e.start >= packEnd)
        .sort((a, b) => a.start - b.start)[0];
      if (!fridge) {
        failures.push(`no refrigerate task follows packaging task ${describe(pack)}`);
      } else if (fridge.start - packEnd > MAX_UNREFRIGERATED_MIN) {
        failures.push(
          `packaged box ${pack.box} sits ${fridge.start - packEnd} min before ${describe(fridge.t)} — limit is ${MAX_UNREFRIGERATED_MIN}`,
        );
      }
    }
  }
  return { id: "refrigerate-within-60", name: "Packaged boxes refrigerated within 60 min", passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------- check 6
/**
 * Every dish in the drop appears in the sequence; every dish referenced by
 * the sequence is a real drop dish (no hallucinations). Task dish fields use
 * dish ids; "" means a non-dish task (setup, cleaning) and is allowed.
 */
export function checkDishCoverage(plan: OpsPlan, drop: WeeklyDrop): EvalResult {
  const failures: string[] = [];
  const dropDishes = new Set(
    [drop.boxA, drop.boxB].flatMap((box) => [box.meat1, box.meat2, box.veggie, box.rice]),
  );
  const referenced = new Set(
    plan.sundaySequence.map((task) => task.dish).filter((dish) => dish !== ""),
  );
  for (const dishId of dropDishes) {
    if (!referenced.has(dishId)) {
      failures.push(`drop dish "${dishId}" never appears in the Sunday sequence`);
    }
  }
  for (const dishId of referenced) {
    if (!dropDishes.has(dishId)) {
      failures.push(`sequence references "${dishId}", which is not a dish in this week's drop`);
    }
  }
  return { id: "dish-coverage", name: "All drop dishes scheduled, none hallucinated", passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------- check 7
/** Every allergen present in a box's dishes must appear in that box's allergenFlags. */
export function checkAllergenCoverage(
  plan: OpsPlan,
  drop: WeeklyDrop,
  dishById: Map<string, Dish>,
): EvalResult {
  const failures: string[] = [];
  for (const box of ["A", "B"] as const) {
    const config = box === "A" ? drop.boxA : drop.boxB;
    const expected = new Set(
      [config.meat1, config.meat2, config.veggie, config.rice].flatMap(
        (id) => dishById.get(id)?.allergens ?? [],
      ),
    );
    const flagged = new Set(
      plan.allergenFlags.filter((flag) => flag.box === box).flatMap((flag) => flag.allergens),
    );
    for (const allergen of expected) {
      if (!flagged.has(allergen)) {
        failures.push(`box ${box} contains "${allergen}" but it is missing from allergenFlags`);
      }
    }
  }
  return { id: "allergen-coverage", name: "All allergens flagged per box", passed: failures.length === 0, failures };
}

// ------------------------------------------------------------------ runner
export function runEvalChecks(
  plan: OpsPlan,
  drop: WeeklyDrop,
  dishById: Map<string, Dish>,
): EvalResult[] {
  return [
    checkWindowFit(plan),
    checkResourceConflicts(plan),
    checkDependencyOrder(plan),
    checkBoxContiguity(plan),
    checkRefrigeration(plan),
    checkDishCoverage(plan, drop),
    checkAllergenCoverage(plan, drop, dishById),
  ];
}
