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

_Filled in as we build:_

- _(placeholder — deterministic core / "the LLM never does arithmetic")_
- _(placeholder — eval harness design)_
- _(placeholder — swap-ready adapter layer)_

## Demo

- Live demo: _(coming soon)_
- Screenshot: _(coming soon)_

## Docs

- [Build spec](./jade-kitchen-ops-build-spec.md) — the source of truth
- [CLAUDE.md](./CLAUDE.md) — working conventions
- [LEARNINGS.md](./LEARNINGS.md) — non-obvious problems and fixes
