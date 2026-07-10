// Vercel serverless proxy for the Anthropic Messages API.
//
// Browsers must never call api.anthropic.com directly: the API key would be
// visible to anyone, and Anthropic blocks cross-origin browser calls anyway.
// The client POSTs a Messages API request body to /api/anthropic; this
// function attaches the key server-side and forwards the request.
//
// This endpoint is PUBLIC (the demo has no auth), so it also guards spend:
// an allowlist of cheap models, a hard max_tokens cap, and a coarse
// per-instance rate limit. These make it safe to expose without letting a
// stranger run up the Anthropic bill. Tune the constants per project.
//
// Portable: drop this file into any Vite-on-Vercel repo's api/ folder and set
// ANTHROPIC_API_KEY in .env.local (local) / Vercel project env (deployed).

import type { VercelRequest, VercelResponse } from "@vercel/node";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// --- Spend guards -----------------------------------------------------------
// Only models this demo actually uses. Keeps a leaked URL from being pointed
// at an expensive model. Add ids here as the app needs them.
const ALLOWED_MODELS = new Set([
  "claude-haiku-4-5-20251001",
  "claude-sonnet-5",
]);
// Hard ceiling on output tokens regardless of what the client asks for.
// 10,000 covers Stage 2's bounded thinking budget (2,000) plus a full
// Sunday sequence + several one-pagers (~4,000 observed) with headroom.
const MAX_OUTPUT_TOKENS = 10_000;
// Coarse rate limit: requests per window, per warm serverless instance. Not a
// global limiter (serverless is multi-instance), just a cheap abuse brake.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

const hits: number[] = [];
function rateLimited(): boolean {
  const now = Date.now();
  while (hits.length > 0 && now - hits[0]! > RATE_WINDOW_MS) hits.shift();
  if (hits.length >= RATE_LIMIT) return true;
  hits.push(now);
  return false;
}

type MessagesBody = {
  model?: unknown;
  max_tokens?: unknown;
  messages?: unknown;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed — POST a Messages API body" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "ANTHROPIC_API_KEY is not set (use .env.local locally, project env vars on Vercel)",
    });
    return;
  }

  if (rateLimited()) {
    res.status(429).json({ error: "Rate limit exceeded — slow down and retry shortly" });
    return;
  }

  const body = req.body as MessagesBody | undefined;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Request body must be a JSON Messages API payload" });
    return;
  }

  if (typeof body.model !== "string" || !ALLOWED_MODELS.has(body.model)) {
    res.status(400).json({
      error: `Model not allowed. Permitted models: ${[...ALLOWED_MODELS].join(", ")}`,
    });
    return;
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: "`messages` must be a non-empty array" });
    return;
  }

  // Clamp max_tokens to the ceiling (and require a sane positive number).
  const requested = typeof body.max_tokens === "number" ? body.max_tokens : MAX_OUTPUT_TOKENS;
  const safeBody = {
    ...body,
    max_tokens: Math.min(Math.max(1, requested), MAX_OUTPUT_TOKENS),
  };

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(safeBody),
  });

  // Pass Anthropic's response (success or error) through verbatim so the
  // client sees real status codes and error messages.
  const text = await upstream.text();
  res.status(upstream.status).setHeader("content-type", "application/json").send(text);
}
