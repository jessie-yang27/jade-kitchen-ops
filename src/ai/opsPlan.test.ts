// Orchestration tests for the Stage 2 re-prompt loop. The Anthropic proxy is
// mocked at the fetch layer (src/lib/anthropic.ts's callClaude is the only
// thing that touches the network), so these tests exercise the real parse →
// validate → eval → re-prompt → flag-for-review logic without hitting the API.

import { afterEach, describe, expect, it, vi } from "vitest";
import { dishById } from "../data/dishes";
import { inventory } from "../data/inventory";
import { availableResources } from "../data/resources";
import { roster } from "../data/roster";
import { testDrop, validOpsPlan } from "../testUtils/opsPlanFixtures";
import { buildWeeklyContext } from "./context";
import { generateOpsPlan } from "./opsPlan";

const context = buildWeeklyContext(testDrop, { A: 12, B: 10 }, dishById, inventory, roster, availableResources);

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

function lastUserMessage(fetchMock: ReturnType<typeof vi.fn>, callIndex: number): string {
  const body = JSON.parse(fetchMock.mock.calls[callIndex]![1].body as string);
  return body.messages.at(-1).content as string;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateOpsPlan", () => {
  it("returns ok on the first attempt when the plan is valid and passes every eval check", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeMessagesResponse(JSON.stringify(validOpsPlan())));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateOpsPlan(testDrop, context, dishById);

    expect(result.status).toBe("ok");
    expect(result.attempts).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("re-prompts once on invalid JSON, then succeeds if the retry parses and passes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fakeMessagesResponse("Sure! Here's the plan: {not valid json"))
      .mockResolvedValueOnce(fakeMessagesResponse(JSON.stringify(validOpsPlan())));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateOpsPlan(testDrop, context, dishById);

    expect(result.status).toBe("ok");
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0]!.parseError).not.toBeNull();
    expect(lastUserMessage(fetchMock, 1)).toMatch(/not valid JSON/);
  });

  it("re-prompts once when eval checks fail, naming the failing check in the retry message", async () => {
    const brokenPlan = validOpsPlan();
    brokenPlan.allergenFlags = brokenPlan.allergenFlags.filter((flag) => flag.box !== "A");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fakeMessagesResponse(JSON.stringify(brokenPlan)))
      .mockResolvedValueOnce(fakeMessagesResponse(JSON.stringify(validOpsPlan())));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateOpsPlan(testDrop, context, dishById);

    expect(result.status).toBe("ok");
    expect(
      result.attempts[0]!.evalResults?.some((r) => !r.passed && r.id === "allergen-coverage"),
    ).toBe(true);
    expect(lastUserMessage(fetchMock, 1)).toMatch(/All allergens flagged per box/);
  });

  it("flags for human review after two failing attempts, without a third call", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeMessagesResponse("not json at all"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateOpsPlan(testDrop, context, dishById);

    expect(result.status).toBe("needs-review");
    expect(result.attempts).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("flags for human review when the retry still fails eval checks, keeping the last plan for inspection", async () => {
    const brokenPlan = validOpsPlan();
    brokenPlan.allergenFlags = [];
    const fetchMock = vi.fn().mockResolvedValue(fakeMessagesResponse(JSON.stringify(brokenPlan)));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateOpsPlan(testDrop, context, dishById);

    expect(result.status).toBe("needs-review");
    expect(result.attempts).toHaveLength(2);
    if (result.status === "needs-review") {
      expect(result.plan).not.toBeNull();
    }
  });
});
