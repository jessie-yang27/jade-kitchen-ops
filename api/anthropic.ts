// Vercel serverless proxy for the Anthropic Messages API.
//
// Browsers must never call api.anthropic.com directly: the API key would be
// visible to anyone, and Anthropic blocks cross-origin browser calls anyway.
// The client POSTs a Messages API request body to /api/anthropic; this
// function attaches the key server-side and forwards the request.
//
// Portable: drop this file into any Vite-on-Vercel repo's api/ folder and set
// ANTHROPIC_API_KEY in .env.local (local) / Vercel project env (deployed).

import type { VercelRequest, VercelResponse } from "@vercel/node";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

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

  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({ error: "Request body must be a JSON Messages API payload" });
    return;
  }

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(req.body),
  });

  // Pass Anthropic's response (success or error) through verbatim so the
  // client sees real status codes and error messages.
  const text = await upstream.text();
  res.status(upstream.status).setHeader("content-type", "application/json").send(text);
}
