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

## 2. Production looked "broken" — it was Vercel's SSO wall (2026-07-09)

**Problem:** The deployed site appeared completely broken to anyone opening the
link: the root URL and the `/api/anthropic` proxy both returned `HTTP 302`
redirecting to `vercel.com/sso-api?...`. The code was fine — it worked locally.

**Why it was non-obvious:** Vercel turns **Deployment Protection → "Vercel
Authentication" ON by default** on new (Hobby) projects. The project setting was
`ssoProtection: { deploymentType: "all_except_custom_domains" }`, which puts
*every* `*.vercel.app` URL — site and API — behind a Vercel login. It only
"works" for you because your browser is already signed into Vercel; an
interviewer opening it fresh (or any `curl`) gets bounced. Nothing in the build
logs or the code hints at this; it's purely an account/project setting.

**Fix:** `PATCH /v9/projects/{id}` with `{ "ssoProtection": null }` (or Project
Settings → Deployment Protection → turn off Vercel Authentication in the
dashboard). Also: share the **stable production alias**
(`jade-kitchen-ops.vercel.app`), not the per-deployment `…-hash….vercel.app`
build URLs.

**Consequence we handled:** disabling the wall makes `/api/anthropic` publicly
callable, so a stranger could bill our Anthropic key. Hardened the proxy with a
model allowlist, a `max_tokens` cap, and a coarse rate limit before shipping —
see [api/anthropic.ts](./api/anthropic.ts).
