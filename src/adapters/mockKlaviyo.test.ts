import { describe, expect, it } from "vitest";
import type { Customer } from "../domain/types";
import type { SegmentMap } from "../core/segmentation";
import type { EmailCampaign, KlaviyoAdapter, SmsCampaign } from "./types";
import { MockKlaviyoAdapter } from "./mockKlaviyo";

const customers: Customer[] = [
  { id: "cust-1", firstName: "Jesse", email: "jesse@example.com", phone: "6170000001", orderCount: 1 },
];

const segments: SegmentMap = {
  "box-a": ["cust-1"],
  "box-b": [],
  pickup: ["cust-1"],
  delivery: [],
  "first-timer": ["cust-1"],
  repeat: [],
};

const emailCampaign: EmailCampaign = {
  type: "email",
  audience: { kind: "segment" },
  subject: "This week's boxes are LIVE 🔥",
  previewText: "Order by Thursday!",
  heroImageSlot: "hero-launch",
  boxDescriptions: { A: "Lu rou + mapo tofu", B: "Beef + soy glazed chicken" },
  orderDeadline: "Thursday 8pm",
  fulfillmentInfo: "Pickup or delivery Sunday 2-6pm",
  cta: "Order now",
};

const smsCampaign: SmsCampaign = {
  type: "sms",
  audience: { kind: "customer", customerId: "cust-1" },
  body: "Your box is ready for pickup between 2-6 PM tomorrow!",
};

describe("MockKlaviyoAdapter", () => {
  it("exposes a mock badge flag", () => {
    expect(new MockKlaviyoAdapter().isMock).toBe(true);
  });

  it("has artificial latency in the 300-800ms range", async () => {
    const adapter = new MockKlaviyoAdapter();
    const start = performance.now();
    await adapter.syncCustomers(customers, segments);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(290);
    expect(elapsed).toBeLessThan(900);
  });

  it("syncCustomers records what the UI can later read back", async () => {
    const adapter = new MockKlaviyoAdapter();
    await adapter.syncCustomers(customers, segments);
    expect(adapter.getSyncedSegments()).toEqual(segments);
  });

  it("createCampaignDraft returns a unique draftId per call and records the draft", async () => {
    const adapter = new MockKlaviyoAdapter();
    const first = await adapter.createCampaignDraft(emailCampaign);
    const second = await adapter.createCampaignDraft(smsCampaign);
    expect(first.draftId).not.toBe(second.draftId);
    const drafts = adapter.getDrafts();
    expect(drafts).toHaveLength(2);
    expect(drafts[0]!.campaign).toBe(emailCampaign);
    expect(drafts[1]!.campaign).toBe(smsCampaign);
  });

  it("is draft-only by design: no send method exists on the interface", () => {
    // Type-level guarantee: this line only compiles if KlaviyoAdapter has no
    // `send`/`sendCampaign` member. If someone adds one, this cast breaks.
    const adapter: KlaviyoAdapter = new MockKlaviyoAdapter();
    expect("send" in adapter).toBe(false);
    expect("sendCampaign" in adapter).toBe(false);
  });
});
