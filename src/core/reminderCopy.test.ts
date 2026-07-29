import { describe, expect, it } from "vitest";
import { buildReminderCampaigns } from "./reminderCopy";

describe("buildReminderCampaigns", () => {
  it("returns first-timer and repeat variants for pickup", () => {
    const campaigns = buildReminderCampaigns("pickup", "2026-07-13");
    expect(campaigns.map((c) => c.segment)).toEqual(["first-timer", "repeat"]);
    expect(campaigns[0]!.subject).toBe("Your Jade Kitchen pickup is this July 13!");
    expect(campaigns[0]!.body).toMatch(/self-service/i);
  });

  it("fills the week's fulfillment window into pickup copy", () => {
    const [firstTimer] = buildReminderCampaigns("pickup", "2026-07-13");
    expect(firstTimer!.body).toContain("4-6 PM");
    expect(firstTimer!.body).not.toContain("{{pickupWindow}}");
  });

  it("fills the delivery date and window, leaves per-customer merge tags intact", () => {
    const [firstTimer] = buildReminderCampaigns("delivery", "2026-07-13");
    expect(firstTimer!.body).toContain("July 13");
    expect(firstTimer!.body).toContain("4-6 PM");
    expect(firstTimer!.body).toContain("{{deliveryAddress}}");
    expect(firstTimer!.body).toContain("{{firstName}}"); // per-customer — left for Klaviyo to fill at send
  });

  it("the repeat variant has no firstName greeting (matches the real transcribed template)", () => {
    const [, repeat] = buildReminderCampaigns("delivery", "2026-07-13");
    expect(repeat!.body).not.toContain("{{firstName}}");
  });
});
