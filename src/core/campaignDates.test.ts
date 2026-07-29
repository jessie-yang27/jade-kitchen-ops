import { describe, expect, it } from "vitest";
import { addDays, formatLongDate, orderDeadlineLabel } from "./campaignDates";

describe("formatLongDate", () => {
  it("formats an ISO date with weekday by default", () => {
    expect(formatLongDate("2026-07-13")).toBe("Monday, July 13");
  });

  it("can omit the weekday", () => {
    expect(formatLongDate("2026-07-13", false)).toBe("July 13");
  });
});

describe("addDays", () => {
  it("adds (and subtracts) days, crossing month boundaries", () => {
    expect(addDays("2026-07-13", -2)).toBe("2026-07-11");
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
  });
});

describe("orderDeadlineLabel", () => {
  it("is two days before the fulfillment date at 11:59 PM", () => {
    expect(orderDeadlineLabel("2026-07-13")).toBe("Saturday, July 11 at 11:59 PM");
  });
});
