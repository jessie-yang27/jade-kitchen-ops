// Stage 2 orchestration: prompt → parse → validate schema → run eval checks
// → on any failure, re-prompt once with the failure appended → on a second
// failure, flag for human review (spec §5). This is the only place the app
// calls the AI for the ops plan; everything upstream of this is deterministic
// code, and everything the AI returns is graded by code before a human sees it.

import type { ChatMessage } from "../lib/anthropic";
import { callClaude, responseText } from "../lib/anthropic";
import type { EvalResult } from "../core/evalChecks";
import { runEvalChecks } from "../core/evalChecks";
import type { Dish, OpsPlan, WeeklyDrop } from "../domain/types";
import { buildSystemPrompt } from "./systemPrompt";
import type { WeeklyContext } from "./context";
import { extractJson, validateOpsPlanShape } from "./validateOpsPlan";

const OPS_PLAN_MODEL = "claude-sonnet-5";
const MAX_ATTEMPTS = 2;
// This is a genuinely hard constraint-satisfaction problem (food-safety
// windows, resource conflicts, dependency order, box contiguity) — worth
// letting the model reason before it writes JSON. But thinking tokens count
// against max_tokens, and an unbounded thinking budget can consume the whole
// response with zero visible output (see LEARNINGS #3). Cap thinking well
// below max_tokens so there's always room left for the actual plan — a full
// plan with thinking disabled ran ~3,900 output tokens, so 2,000 for
// thinking + 10,000 total leaves comfortable headroom.
const THINKING_BUDGET_TOKENS = 2000;
const MAX_TOKENS = 10_000;

export type OpsPlanAttempt = {
  attemptNumber: number;
  rawResponse: string;
  parseError: string | null;
  shapeErrors: string[];
  evalResults: EvalResult[] | null; // null if the response never reached valid shape
};

export type OpsPlanRunResult =
  | { status: "ok"; plan: OpsPlan; evalResults: EvalResult[]; attempts: OpsPlanAttempt[] }
  | { status: "needs-review"; plan: OpsPlan | null; attempts: OpsPlanAttempt[] };

function buildTaskInstruction(context: WeeklyContext): string {
  return `Here is this week's context as JSON:\n\n${JSON.stringify(context, null, 2)}\n\nGenerate the Sunday sequence, Saturday prep list, volunteer one-pagers, and allergen flags per the schema and rules in the system prompt.`;
}

function reformatFailureMessage(kind: "json" | "schema" | "eval", detail: string): string {
  switch (kind) {
    case "json":
      return `Your last response was not valid JSON (${detail}). Return ONLY the corrected JSON, matching the schema exactly — no prose, no code fences.`;
    case "schema":
      return `Your last response didn't match the required schema:\n- ${detail}\n\nReturn ONLY the corrected JSON.`;
    case "eval":
      return `Your plan failed these automated checks:\n\n${detail}\n\nReturn ONLY the corrected JSON, fixing these issues while keeping everything else that was correct.`;
  }
}

export async function generateOpsPlan(
  drop: WeeklyDrop,
  context: WeeklyContext,
  dishById: Map<string, Dish>,
): Promise<OpsPlanRunResult> {
  const systemPrompt = buildSystemPrompt();
  const messages: ChatMessage[] = [{ role: "user", content: buildTaskInstruction(context) }];
  const attempts: OpsPlanAttempt[] = [];

  for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
    const response = await callClaude({
      model: OPS_PLAN_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
      thinking: { type: "enabled", budget_tokens: THINKING_BUDGET_TOKENS },
    });
    const raw = responseText(response);
    const isLastAttempt = attemptNumber === MAX_ATTEMPTS;

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch (err) {
      const parseError = err instanceof Error ? err.message : "unknown JSON parse error";
      attempts.push({ attemptNumber, rawResponse: raw, parseError, shapeErrors: [], evalResults: null });
      if (isLastAttempt) return { status: "needs-review", plan: null, attempts };
      messages.push({ role: "assistant", content: raw });
      messages.push({ role: "user", content: reformatFailureMessage("json", parseError) });
      continue;
    }

    const shapeResult = validateOpsPlanShape(parsed);
    if (!shapeResult.valid) {
      attempts.push({
        attemptNumber,
        rawResponse: raw,
        parseError: null,
        shapeErrors: shapeResult.errors,
        evalResults: null,
      });
      if (isLastAttempt) return { status: "needs-review", plan: null, attempts };
      messages.push({ role: "assistant", content: raw });
      messages.push({ role: "user", content: reformatFailureMessage("schema", shapeResult.errors.join("\n- ")) });
      continue;
    }

    const evalResults = runEvalChecks(shapeResult.plan, drop, dishById);
    const failing = evalResults.filter((result) => !result.passed);
    attempts.push({ attemptNumber, rawResponse: raw, parseError: null, shapeErrors: [], evalResults });

    if (failing.length === 0) {
      return { status: "ok", plan: shapeResult.plan, evalResults, attempts };
    }
    if (isLastAttempt) {
      return { status: "needs-review", plan: shapeResult.plan, attempts };
    }

    const failureText = failing.map((r) => `${r.name}:\n  - ${r.failures.join("\n  - ")}`).join("\n");
    messages.push({ role: "assistant", content: raw });
    messages.push({ role: "user", content: reformatFailureMessage("eval", failureText) });
  }

  throw new Error("generateOpsPlan: exhausted attempts without returning a result");
}
