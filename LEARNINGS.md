# LEARNINGS

A running log of non-obvious problems we hit while building this, and how we
solved them. Newest entries at the bottom. Each entry: **the problem**, **why
it was non-obvious**, **the fix**.

## 1. Browser → Anthropic API needs a serverless proxy (2026-07-09)

**Problem:** A Vite SPA can't call `api.anthropic.com` from the browser — the
API key would be exposed to anyone with dev tools, and Anthropic rejects
cross-origin browser requests (CORS) precisely to prevent that.

**Fix:** [api/anthropic.ts](./api/anthropic.ts) — a ~50-line Vercel serverless
function. The browser POSTs a Messages API body to `/api/anthropic` (same
origin, no CORS); the function attaches `ANTHROPIC_API_KEY` from server-side
env and forwards the request, passing Anthropic's response through verbatim.
Portable to any Vite-on-Vercel repo (the wedding app's AI Planner needs
exactly this).

**Non-obvious part:** `vercel dev` does **not** read `.env.local` — that's
Vite's convention for client-side vars. `vercel dev` pulls the linked
project's *Development* environment variables (or a local `.env`). First test
returned "key not set" even though the key sat in `.env.local`. Durable fix:
`vercel env add ANTHROPIC_API_KEY` for development, preview, and production —
one source of truth, and the eventual deploy needs no extra setup.
