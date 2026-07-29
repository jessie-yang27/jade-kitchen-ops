// Pickup/delivery reminder campaign copy — deterministic, no AI call.
// Reuses the real transcribed customer messages (data/commsTemplates.ts) so
// the wording matches Jessie's actual voice exactly, rather than having an
// LLM re-paraphrase real copy. Week-specific slots (date, window) are filled
// in by code; per-customer slots ({{firstName}}, {{deliveryAddress}}) are
// left as literal merge tags — that's how a real Klaviyo campaign draft
// looks before send, personalized per recipient at send time, not per draft.

import { commsTemplates } from "../data/commsTemplates";
import { FULFILLMENT_WINDOW, formatLongDate } from "./campaignDates";

export type ReminderCampaign = {
  segment: "first-timer" | "repeat";
  subject: string;
  body: string;
};

function fillWeekSlots(body: string, weekOf: string): string {
  return body
    .replaceAll("{{pickupWindow}}", FULFILLMENT_WINDOW)
    .replaceAll("{{deliveryWindow}}", FULFILLMENT_WINDOW)
    .replaceAll("{{deliveryDate}}", formatLongDate(weekOf, false))
    .replaceAll("{{weekNote}}", "");
}

function templateFor(fulfillment: "pickup" | "delivery", firstTimer: boolean) {
  const template = commsTemplates.find((t) => t.fulfillment === fulfillment && t.firstTimer === firstTimer);
  if (!template) throw new Error(`No comms template for ${fulfillment}/${firstTimer ? "first-timer" : "repeat"}`);
  return template;
}

/** Both segment variants (first-timer, repeat) for a fulfillment channel — the two real drafts a campaign send would use. */
export function buildReminderCampaigns(fulfillment: "pickup" | "delivery", weekOf: string): ReminderCampaign[] {
  const dateLabel = formatLongDate(weekOf, false);
  const subject =
    fulfillment === "pickup"
      ? `Your Jade Kitchen pickup is this ${dateLabel}!`
      : `Your Jade Kitchen delivery is this ${dateLabel}!`;

  return [true, false].map((firstTimer) => ({
    segment: firstTimer ? "first-timer" : "repeat",
    subject,
    body: fillWeekSlots(templateFor(fulfillment, firstTimer).body, weekOf),
  }));
}
