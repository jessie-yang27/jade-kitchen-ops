// The Anthropic proxy is mocked at the fetch layer, matching opsPlan.test.ts's
// approach, so this exercises the real parse/validate logic without hitting
// the API.

import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMenuDropCopy } from "./campaignCopy";

function fakeMessagesResponse(text: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      id: "msg_test",
      content: [{ type: "text", text }],
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 10 },
    }),
    text: async () => text,
  } as unknown as Response;
}

const input = {
  boxA: { label: "Mom's Classics", dishNames: ["Beef with Longhorn Peppers", "Tomato & Egg Stir-Fry"] },
  boxB: { label: "Taste of Sichuan", dishNames: ["Twice Cooked Chicken", "Green Beans with Garlic"] },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateMenuDropCopy", () => {
  it("parses a well-formed JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      fakeMessagesResponse(
        JSON.stringify({
          headerLine: "☀️ Summer Series ☀️",
          boxABlurb: "Cozy homestyle flavors.",
          boxBBlurb: "Bold and aromatic.",
          sms: "New boxes are live!",
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateMenuDropCopy(input);
    expect(result.headerLine).toBe("☀️ Summer Series ☀️");
    expect(result.boxABlurb).toBe("Cozy homestyle flavors.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("strips code fences if the model wraps the JSON anyway", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      fakeMessagesResponse(
        '```json\n{"headerLine":"Hi","boxABlurb":"a","boxBBlurb":"b","sms":"c"}\n```',
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateMenuDropCopy(input);
    expect(result.headerLine).toBe("Hi");
  });

  it("throws a clear error on invalid JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeMessagesResponse("not json at all"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateMenuDropCopy(input)).rejects.toThrow(/invalid JSON/);
  });

  it("throws a clear error when required fields are missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeMessagesResponse(JSON.stringify({ headerLine: "Hi" })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateMenuDropCopy(input)).rejects.toThrow(/unexpected shape/);
  });

  it("sends thinking disabled and the haiku model", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      fakeMessagesResponse(JSON.stringify({ headerLine: "h", boxABlurb: "a", boxBBlurb: "b", sms: "c" })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateMenuDropCopy(input);
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body.model).toBe("claude-haiku-4-5-20251001");
    expect(body.thinking).toEqual({ type: "disabled" });
  });
});
