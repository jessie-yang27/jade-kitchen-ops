// Runtime validation of the Stage 2 JSON response against the OpsPlan
// contract (spec §5). TypeScript types vanish at runtime — the AI's response
// is untrusted `unknown` until it passes this. Structural errors here are
// exactly as "re-promptable" as eval-check failures: both become failure
// strings appended to the retry.

import type { OpsPlan } from "../domain/types";
import { toMinutes } from "../core/evalChecks";

const VALID_BOXES = new Set(["A", "B", "shared"]);
const VALID_RESOURCES = new Set(["burner-1", "burner-2", "prep-table", "rice-cooker", "oven", "none"]);

function isString(x: unknown): x is string {
  return typeof x === "string";
}
function isNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}
function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every(isString);
}
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export type ValidationResult =
  | { valid: true; plan: OpsPlan }
  | { valid: false; errors: string[] };

export function validateOpsPlanShape(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["response is not a JSON object"] };
  }

  if (!Array.isArray(value.saturdayPrep)) {
    errors.push('"saturdayPrep" must be an array');
  } else {
    value.saturdayPrep.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`saturdayPrep[${i}] must be an object`);
        return;
      }
      if (!isString(item.task)) errors.push(`saturdayPrep[${i}].task must be a string`);
      if (!isString(item.dish)) errors.push(`saturdayPrep[${i}].dish must be a string`);
      if (!isString(item.assignee)) errors.push(`saturdayPrep[${i}].assignee must be a string`);
      if (!isNumber(item.estMinutes)) errors.push(`saturdayPrep[${i}].estMinutes must be a number`);
    });
  }

  if (!Array.isArray(value.sundaySequence) || value.sundaySequence.length === 0) {
    errors.push('"sundaySequence" must be a non-empty array');
  } else {
    value.sundaySequence.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`sundaySequence[${i}] must be an object`);
        return;
      }
      if (!isString(item.id)) errors.push(`sundaySequence[${i}].id must be a string`);
      if (!isString(item.task)) errors.push(`sundaySequence[${i}].task must be a string`);
      if (!isString(item.dish)) errors.push(`sundaySequence[${i}].dish must be a string`);
      if (!isString(item.box) || !VALID_BOXES.has(item.box)) {
        errors.push(`sundaySequence[${i}].box must be "A"|"B"|"shared"`);
      }
      if (!isString(item.assignee)) errors.push(`sundaySequence[${i}].assignee must be a string`);
      if (!isString(item.start) || toMinutes(item.start) === null) {
        errors.push(`sundaySequence[${i}].start must be a valid "HH:MM" string`);
      }
      if (!isNumber(item.durationMin)) errors.push(`sundaySequence[${i}].durationMin must be a number`);
      if (!isString(item.resource) || !VALID_RESOURCES.has(item.resource)) {
        errors.push(`sundaySequence[${i}].resource must be one of ${[...VALID_RESOURCES].join(", ")}`);
      }
      if (!isStringArray(item.dependsOn)) errors.push(`sundaySequence[${i}].dependsOn must be an array of strings`);
    });
  }

  if (!Array.isArray(value.onePagers)) {
    errors.push('"onePagers" must be an array');
  } else {
    value.onePagers.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`onePagers[${i}] must be an object`);
        return;
      }
      if (!isString(item.station)) errors.push(`onePagers[${i}].station must be a string`);
      if (item.audience !== "volunteer") errors.push(`onePagers[${i}].audience must be "volunteer"`);
      if (!isString(item.content)) errors.push(`onePagers[${i}].content must be a string`);
    });
  }

  if (!Array.isArray(value.allergenFlags)) {
    errors.push('"allergenFlags" must be an array');
  } else {
    value.allergenFlags.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`allergenFlags[${i}] must be an object`);
        return;
      }
      if (item.box !== "A" && item.box !== "B") errors.push(`allergenFlags[${i}].box must be "A"|"B"`);
      if (!isStringArray(item.allergens)) errors.push(`allergenFlags[${i}].allergens must be an array of strings`);
    });
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, plan: value as unknown as OpsPlan };
}

/** Pull JSON out of a model response that may be wrapped in prose or code fences. */
export function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}
