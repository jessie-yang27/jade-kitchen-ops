// AI-generated creative copy for the Monday menu-drop email — the only piece
// of Klaviyo copy in this app that's actually LLM-written. Pickup/delivery
// reminders reuse real transcribed customer messages instead (see
// core/reminderCopy.ts) because that's more faithful than having an LLM
// re-paraphrase Jessie's actual words.
//
// Scope is deliberately narrow: the model only writes a header line and two
// short per-box flavor blurbs plus an SMS teaser — dates, the dish list, and
// the sign-off are assembled deterministically (core/menuDropEmail.ts). This
// keeps the one AI call in this feature cheap and low-risk: worst case, a
// bad header/blurb is easy to spot and regenerate, unlike a wrong date.

import { callClaude, responseText, type ChatMessage } from "../lib/anthropic";

const MODEL = "claude-haiku-4-5-20251001"; // short creative copy — no need for a heavier model

const VOICE_GUIDE = `You write marketing copy for Jade Kitchen, a weekly Asian meal-prep business, in the voice of its founder Jessie. Match this voice exactly:
- Warm and direct, first person ("we", "I")
- Liberal exclamation points
- Occasional ALL CAPS for emphasis (e.g. "we got a LOT of delivery requests")
- Emoji as section/emphasis markers (☀️🍱💚🍽️🫶🥢), not decoration on every line
- Practical details stated plainly — no filler, no corporate tone

Example of the real voice from a past launch email:
"☀️ The Summer Series Continues ☀️
Hi Jade Kitchen community,
We're halfway through our Summer Series, so don't miss out on this week's boxes: Mom's Classics, rooted in homestyle, nostalgic flavors, and Taste of Sichuan, a lively medley of vibrant spices. Get them while they're here!
🫶 Mom's Classics
This box features cozy, home-cooked dishes like tender beef with longhorn peppers, fluffy scrambled egg and tomato, and fresh broccoli with garlic."`;

export type MenuDropCopyInput = {
  boxA: { label: string; dishNames: string[] };
  boxB: { label: string; dishNames: string[] };
};

export type MenuDropCopyOutput = {
  headerLine: string;
  boxABlurb: string;
  boxBBlurb: string;
  sms: string;
};

function buildPrompt(input: MenuDropCopyInput): ChatMessage[] {
  return [
    {
      role: "user",
      content: `${VOICE_GUIDE}

Write this week's launch copy for two boxes:
- ${input.boxA.label}: ${input.boxA.dishNames.join(", ")}
- ${input.boxB.label}: ${input.boxB.dishNames.join(", ")}

Respond with ONLY this JSON, no prose, no code fences:
{
  "headerLine": "a short punchy header line with 1-2 emoji, e.g. '☀️ The Summer Series Continues ☀️'",
  "boxABlurb": "1-2 sentences evoking ${input.boxA.label}'s flavor profile, mentioning 2-3 of its dishes naturally",
  "boxBBlurb": "1-2 sentences evoking ${input.boxB.label}'s flavor profile, mentioning 2-3 of its dishes naturally",
  "sms": "1-2 sentence SMS teaser for the same drop, in the same voice"
}`,
    },
  ];
}

function isMenuDropCopyOutput(value: unknown): value is MenuDropCopyOutput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.headerLine === "string" &&
    typeof v.boxABlurb === "string" &&
    typeof v.boxBBlurb === "string" &&
    typeof v.sms === "string"
  );
}

export async function generateMenuDropCopy(input: MenuDropCopyInput): Promise<MenuDropCopyOutput> {
  const response = await callClaude({
    model: MODEL,
    max_tokens: 1000,
    messages: buildPrompt(input),
    thinking: { type: "disabled" }, // short creative copy — a hard cap here would only risk truncation for no benefit
  });
  const raw = responseText(response).trim();
  const jsonText = raw.startsWith("{") ? raw : (raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Menu drop copy generation returned invalid JSON: ${raw.slice(0, 200)}`);
  }
  if (!isMenuDropCopyOutput(parsed)) {
    throw new Error("Menu drop copy generation returned an unexpected shape");
  }
  return parsed;
}
