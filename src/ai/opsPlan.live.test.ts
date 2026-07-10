// REAL network smoke test against the Anthropic API through a local
// `vercel dev` proxy. Costs real tokens, so it's skipped unless
// RUN_LIVE_SMOKE=1 is set — not part of the normal `npm test` run. This is
// the one place we check that an actual Claude response can satisfy the
// Stage 2 schema and pass the eval checks (the mocked opsPlan.test.ts only
// proves the orchestration logic, not that the model cooperates).
//
// Run with: RUN_LIVE_SMOKE=1 npx vitest run src/ai/opsPlan.live.test.ts
// (with `vercel dev` running locally on the default port).

import { describe, expect, it } from "vitest";

// This file runs under Node (vitest), never bundled for the browser, so a
// scoped ambient declaration is enough — no need to pull @types/node into
// the whole app's type-check surface just for this one test file.
declare const process: { env: Record<string, string | undefined> };
import { dishById } from "../data/dishes";
import { inventory } from "../data/inventory";
import { availableResources } from "../data/resources";
import { roster } from "../data/roster";
import { testDrop } from "../testUtils/opsPlanFixtures";
import { callClaude, responseText } from "../lib/anthropic";
import { buildSystemPrompt } from "./systemPrompt";
import { buildWeeklyContext } from "./context";
import { generateOpsPlan } from "./opsPlan";

const RUN_LIVE = process.env.RUN_LIVE_SMOKE === "1";
const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3210";

function withLocalFetch<T>(fn: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" && input.startsWith("/") ? `${BASE_URL}${input}` : input;
    return originalFetch(url as RequestInfo, init);
  }) as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

describe.skipIf(!RUN_LIVE)("generateOpsPlan (live Anthropic smoke test)", () => {
  it(
    "diagnostic: single raw call reports stop_reason and response length",
    () =>
      withLocalFetch(async () => {
        const context = buildWeeklyContext(testDrop, { A: 14, B: 11 }, dishById, inventory, roster, availableResources);
        const response = await callClaude({
          model: "claude-sonnet-5",
          max_tokens: 8192,
          system: buildSystemPrompt(),
          messages: [
            {
              role: "user",
              content: `Here is this week's context as JSON:\n\n${JSON.stringify(context, null, 2)}\n\nGenerate the plan per the schema and rules above.`,
            },
          ],
          thinking: { type: "disabled" },
        });
        const text = responseText(response);
        console.log("stop_reason:", response.stop_reason);
        console.log("output_tokens:", response.usage.output_tokens);
        console.log("raw text length:", text.length);
        console.log("content block types:", response.content.map((b) => b.type));
        console.log("full content:", JSON.stringify(response.content, null, 2).slice(0, 2000));
      }),
    90_000,
  );

  it(
    "produces a plan that satisfies schema + eval checks, possibly via the built-in retry",
    () =>
      withLocalFetch(async () => {
        const context = buildWeeklyContext(testDrop, { A: 14, B: 11 }, dishById, inventory, roster, availableResources);
        const result = await generateOpsPlan(testDrop, context, dishById);

        if (result.status === "needs-review") {
          console.error("Live smoke test did NOT converge. Attempt detail:");
          for (const attempt of result.attempts) {
            console.error(`--- attempt ${attempt.attemptNumber} ---`);
            if (attempt.parseError) console.error("parse error:", attempt.parseError);
            if (attempt.shapeErrors.length) console.error("shape errors:", attempt.shapeErrors);
            if (attempt.evalResults) {
              for (const r of attempt.evalResults) {
                if (!r.passed) console.error(`FAILED ${r.name}:`, r.failures);
              }
            }
          }
        } else {
          console.log(`Converged in ${result.attempts.length} attempt(s).`);
          console.log(`Sunday sequence has ${result.plan.sundaySequence.length} tasks.`);
        }

        expect(result.status).toBe("ok");
      }),
    90_000,
  );
});
