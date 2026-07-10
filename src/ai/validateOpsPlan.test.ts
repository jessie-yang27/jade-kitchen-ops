import { describe, expect, it } from "vitest";
import { validOpsPlan } from "../testUtils/opsPlanFixtures";
import { extractJson, validateOpsPlanShape } from "./validateOpsPlan";

describe("validateOpsPlanShape", () => {
  it("accepts a well-formed plan", () => {
    const result = validateOpsPlanShape(validOpsPlan());
    expect(result.valid).toBe(true);
  });

  it("rejects a non-object", () => {
    const result = validateOpsPlanShape("just a string");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors[0]).toMatch(/not a JSON object/);
  });

  it("reports which field is missing when sundaySequence is absent", () => {
    const plan = validOpsPlan() as unknown as Record<string, unknown>;
    delete plan.sundaySequence;
    const result = validateOpsPlanShape(plan);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain('"sundaySequence" must be a non-empty array');
  });

  it("rejects an invalid box value", () => {
    const plan = validOpsPlan();
    (plan.sundaySequence[0] as unknown as Record<string, unknown>).box = "C";
    const result = validateOpsPlanShape(plan);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('box must be "A"|"B"|"shared"'))).toBe(true);
    }
  });

  it("rejects an unparseable start time", () => {
    const plan = validOpsPlan();
    (plan.sundaySequence[0] as unknown as Record<string, unknown>).start = "not-a-time";
    const result = validateOpsPlanShape(plan);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('start must be a valid "HH:MM"'))).toBe(true);
    }
  });

  it("rejects an invalid resource enum value", () => {
    const plan = validOpsPlan();
    (plan.sundaySequence[0] as unknown as Record<string, unknown>).resource = "stovetop";
    const result = validateOpsPlanShape(plan);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes("resource must be one of"))).toBe(true);
    }
  });
});

describe("extractJson", () => {
  it("returns bare JSON unchanged (aside from trimming)", () => {
    expect(extractJson('  {"a": 1}  ')).toBe('{"a": 1}');
  });

  it("strips a ```json fenced code block", () => {
    const text = 'Here you go:\n```json\n{"a": 1}\n```\nHope that helps!';
    expect(extractJson(text)).toBe('{"a": 1}');
  });

  it("strips a plain ``` fenced code block", () => {
    const text = '```\n{"a": 1}\n```';
    expect(extractJson(text)).toBe('{"a": 1}');
  });

  it("falls back to slicing between the first { and last } when there's no fence", () => {
    const text = 'Sure, here is the plan: {"a": 1} — let me know if you need changes!';
    expect(extractJson(text)).toBe('{"a": 1}');
  });
});
