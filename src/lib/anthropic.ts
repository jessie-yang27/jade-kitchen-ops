// Thin client for the /api/anthropic serverless proxy (see api/anthropic.ts).
// All AI calls in the app go through here — never to api.anthropic.com directly.

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MessagesRequest = {
  model: string;
  max_tokens: number;
  system?: string;
  messages: ChatMessage[];
  temperature?: number;
  /**
   * Extended thinking is on by default for reasoning-capable models and, if
   * left unset, can consume the entire max_tokens budget on a "thinking"
   * block before any visible text is produced (see LEARNINGS #3). For calls
   * that benefit from reasoning, pass an explicit `budget_tokens` well below
   * `max_tokens` so there's always room left for the actual answer. Pass
   * `{ type: "disabled" }` only for simple calls that don't need reasoning.
   */
  thinking?: { type: "enabled"; budget_tokens: number } | { type: "disabled" };
};

type ContentBlock = { type: "text"; text: string } | { type: string };

export type MessagesResponse = {
  id: string;
  content: ContentBlock[];
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
};

export async function callClaude(request: MessagesRequest): Promise<MessagesResponse> {
  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Anthropic proxy error ${res.status}: ${detail}`);
  }
  return (await res.json()) as MessagesResponse;
}

/** Convenience: the concatenated text blocks of a response. */
export function responseText(response: MessagesResponse): string {
  return response.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}
