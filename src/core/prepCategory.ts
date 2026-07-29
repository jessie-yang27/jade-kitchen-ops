// Groups the AI's Sunday sequence into the four buckets a cook actually
// thinks in — vegetable prep, meat prep, cooking, packaging — instead of a
// flat chronological table. Pure presentation transform: it doesn't touch
// the OpsPlan schema or the eval checks, which still grade the underlying
// times/resources/dependencies exactly as before.

import type { Dish, SequenceTask } from "../domain/types";
import { classifyTask } from "./evalChecks";
import { PACKAGE_KEYWORD_PATTERN, REFRIGERATE_KEYWORD_PATTERN } from "./taskConventions";

export const PREP_CATEGORIES = ["vegetable-prep", "meat-prep", "cooking", "packaging", "other"] as const;
export type PrepCategory = (typeof PREP_CATEGORIES)[number];

export const PREP_CATEGORY_LABELS: Record<PrepCategory, string> = {
  "vegetable-prep": "Vegetable prep",
  "meat-prep": "Meat prep",
  cooking: "Cooking",
  packaging: "Packaging",
  other: "Other",
};

export function categorizeTask(task: SequenceTask, dishById: Map<string, Dish>): PrepCategory {
  if (PACKAGE_KEYWORD_PATTERN.test(task.task) || REFRIGERATE_KEYWORD_PATTERN.test(task.task)) {
    return "packaging";
  }
  const kind = classifyTask(task);
  if (kind === "cook") return "cooking";
  if (kind === "prep") {
    const dish = dishById.get(task.dish);
    if (dish?.category === "veggie") return "vegetable-prep";
    if (dish?.category === "meat") return "meat-prep";
  }
  return "other";
}

export function groupTasksByPrepCategory(
  tasks: SequenceTask[],
  dishById: Map<string, Dish>,
): Record<PrepCategory, SequenceTask[]> {
  const groups: Record<PrepCategory, SequenceTask[]> = {
    "vegetable-prep": [],
    "meat-prep": [],
    cooking: [],
    packaging: [],
    other: [],
  };
  for (const task of tasks) {
    groups[categorizeTask(task, dishById)].push(task);
  }
  for (const category of PREP_CATEGORIES) {
    groups[category].sort((a, b) => a.start.localeCompare(b.start));
  }
  return groups;
}
