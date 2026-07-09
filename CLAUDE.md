# CLAUDE.md — Working conventions

Jade Kitchen Weekly Ops: a portfolio demo that automates the weekly launch
workflow for a meal-prep business (Shopify + Klaviyo stack). Built for PM
interviews at AI-native companies — code quality, AI/eval design, and visible
product-management practice matter more than feature count.

## Source of truth

[jade-kitchen-ops-build-spec.md](./jade-kitchen-ops-build-spec.md) defines the
domain model, adapter contracts, four-stage workflow, prompt architecture, eval
checks, and build order. **Where the spec conflicts with instinct, the spec
wins.** If something is ambiguous or seems wrong, ask Jessie — don't improvise.

## Code conventions

- **TypeScript strict mode** everywhere (`"strict": true`, no `any` escapes).
- **Small, focused files.** No component libraries — plain CSS or CSS Modules.
- **Deterministic core = pure, unit-tested functions.** The LLM never does
  arithmetic. Grocery scaling, merging, segmentation, and schedule validation
  are code; the model consumes pre-computed values and is checked by evals.
- **Adapter pattern for all external calls** (spec §3). Mocks resolve against
  JSON fixtures; live Shopify/Klaviyo connectors swap in later without
  touching app logic.
- **AI calls go through the Vercel serverless proxy** (`api/`), never directly
  from the browser.

## Process conventions

- **Commit after each build step** with clear messages; close the matching
  GitHub issue as steps land.
- **Never commit secrets.** Keys live in `.env.local` (gitignored).
- **LEARNINGS.md**: append an entry whenever we hit and solve a non-obvious
  problem.
- Work is tracked as GitHub issues under `epic:*` labels and the
  "v1 mock demo" / "v2 live connectors" milestones.

## Product guardrails (from spec)

- v1 never sends email/SMS — Klaviyo drafts only. Sending stays human.
- v1 has no live Shopify/Klaviyo writes, no auth, no database.
- Eval failures re-prompt once with the failure appended; a second failure
  flags for human review. Pass/fail is always visible in the UI.
