# Jade Kitchen Weekly Ops

**One Monday input replaces four mornings of coordination overhead for a
weekly meal-prep business — with an AI ops planner whose output is verified by
automated eval checks.**

> Built from the real weekly workflow of Jade Kitchen, a weekly Asian meal-prep
> business I ran on a Shopify + Klaviyo stack.

## What it does

Every week used to require founder time on four separate days:

- **Monday — Launch:** roll Shopify products over to this week's two boxes,
  write and send the launch email + SMS teaser.
- **Thursday — Ops plan:** scale grocery quantities to actual orders, build the
  Sunday cook schedule around food-safety windows and station constraints,
  write prep instructions for volunteers.
- **Friday — Customer sync:** export orders from Shopify, segment them
  (box, pickup/delivery, first-timer/repeat), upload to Klaviyo.
- **Saturday — Logistics comms:** send each customer the right
  pickup/delivery instructions for their situation.

This app collapses all of that into one Monday input. The judgment-heavy AI
work (the Thursday ops plan) is the centerpiece; a deterministic code layer
does every calculation, and **seven automated eval checks verify the AI's
schedule before a human ever sees it** — checking time windows, resource
conflicts, task dependencies, food-safety limits, and allergen coverage.

## Tech stack

- React + Vite, TypeScript strict mode, plain CSS (no component libraries)
- Anthropic API via a Vercel serverless proxy (no keys in the browser)
- Mock Shopify/Klaviyo adapters behind swap-ready interfaces (live MCP
  connectors are the v2 plan)
- Vitest for the unit-tested deterministic core
- Deployed on Vercel via GitHub

## Engineering highlights

- **The LLM never does arithmetic.** Grocery scaling (ratios × order counts,
  merged across dishes, deduped, diffed against inventory) and customer
  segmentation are pure, unit-tested TypeScript functions
  ([src/core/grocery.ts](./src/core/grocery.ts),
  [src/core/segmentation.ts](./src/core/segmentation.ts)). The AI call for the
  Thursday ops plan is only ever handed the *already-computed* numbers.

- **The eval harness is the actual interview story.** Seven automated checks
  ([src/core/evalChecks.ts](./src/core/evalChecks.ts)) grade the AI's Sunday
  schedule against the Food Safety SOP in code — time windows, resource
  conflicts, dependency order, box contiguity, refrigeration limits, dish
  coverage (no hallucinated dishes), allergen coverage. On failure, the
  specific check failures are appended to one re-prompt; a second failure
  flags for human review instead of silently shipping a bad plan
  ([src/ai/opsPlan.ts](./src/ai/opsPlan.ts)).

- **Swap-ready adapter layer.** Every Shopify/Klaviyo call goes through an
  interface ([src/adapters/types.ts](./src/adapters/types.ts)); the mock
  implementations add artificial latency and a visible "mock" badge, and
  Klaviyo is draft-only by design — there's no `send` method on the interface
  at all, so nothing this app does can ever message a real customer.

- **A real production bug caught and fixed.** `claude-sonnet-5` defaults to
  extended thinking, which counts against `max_tokens` — a constraint-heavy
  prompt burned its entire output budget reasoning and returned zero visible
  text. Fixed with an explicit bounded thinking budget rather than disabling
  reasoning outright, since Stage 2 is a genuine scheduling problem worth the
  model thinking about. Full writeup: [LEARNINGS.md #3](./LEARNINGS.md).

## Demo

- Live demo: [jade-kitchen-ops.vercel.app](https://jade-kitchen-ops.vercel.app)
- Screenshot: _(coming soon)_
- Walkthrough recording: _(coming soon)_

## Current scope (v1)

Built: drop configuration, Stage 1 Shopify rollover, Stage 2 AI ops plan with
the full eval harness, Stage 3 customer segmentation + Klaviyo sync, Stage 4
template-driven comms queue, all on mock adapters.

Not yet built: AI-generated launch email/SMS copy and per-customer
personalization (Stage 1 & 4 currently show the deterministic parts only —
correct template selection, no AI-filled copy). This was cut from v1 to ship
the eval-harness centerpiece; see [issue #11](https://github.com/jessie-yang27/jade-kitchen-ops/issues/11)
if it gets picked back up.

## Docs

- [Build spec](./jade-kitchen-ops-build-spec.md) — the source of truth
- [CLAUDE.md](./CLAUDE.md) — working conventions
- [LEARNINGS.md](./LEARNINGS.md) — non-obvious problems and fixes
