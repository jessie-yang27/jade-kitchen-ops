// Stage 4 comms templates, transcribed from the real "July 20 Messages" doc.
// The AI fills {{slots}} only — it never rewrites template bodies (spec §4).
//
// Provenance notes:
// - Emoji were garbled in the doc export (mojibake); restored best-effort.
// - "repeat-pickup" wasn't in the doc: reconstructed in the same voice and
//   marked accordingly — Jessie to review.

export type TemplateSource = "transcribed" | "reconstructed";

export type CommsTemplate = {
  id: string;
  /** Which customer segment this template serves. */
  firstTimer: boolean;
  fulfillment: "pickup" | "delivery";
  body: string;
  /** Slot names the AI is allowed to fill. */
  slots: string[];
  source: TemplateSource;
};

/**
 * Shared info block included with every first-time order (transcribed).
 */
export const firstDeliveryInfoBlock = `Hope you enjoy your first Jade Kitchen delivery.

Here's some helpful information:

❄️ Please refrigerate your boxes immediately. Good in the fridge for up to 5 days!

🔥 When you're ready to eat, remove the lid and microwave your bento for 2 minutes. Stir the contents and microwave for another 2 minutes.

✨ Optional: You can place a wet paper towel over the rice to make it moist again!

🥣 For your soup, it's best to reheat by boiling on stove top.

♻️ Our boxes are reusable and dishwasher safe! Each box can be used up to 10 times.`;

export const commsTemplates: CommsTemplate[] = [
  {
    id: "first-time-pickup",
    firstTimer: true,
    fulfillment: "pickup",
    source: "transcribed",
    slots: ["firstName", "pickupWindow", "weekNote"],
    body: `Hi {{firstName}}! This is Jessie from the Jade Kitchen 😊 Thank you SO MUCH for placing your first order with us!

📍 Your order will be ready for pick-up between {{pickupWindow}} at Foundation Kitchen, 32 Cambridge St, Charlestown, MA 02129.

🛍 Pick-up will be SELF-SERVICE, so please make sure you're grabbing only your specific order! {{weekNote}}

📦 To pick-up, please go through the Foundation Kitchen door, and find the pick-up shelf where it says "Jade Kitchen Pick-up". Please find your bag with your name on it!

💚 Let me know if you have any questions. This is my personal number, so don't hesitate to reach out.

Detailed Pick-up Instructions here: https://thejadekitchen.com/pages/pick-up-directions-1`,
  },
  {
    id: "first-time-delivery",
    firstTimer: true,
    fulfillment: "delivery",
    source: "transcribed",
    slots: ["firstName", "deliveryDate", "deliveryWindow", "deliveryAddress"],
    body: `Hi {{firstName}}! This is Jessie from the Jade Kitchen 😊 Thank you SO MUCH for placing your first delivery with us!

🚚 Your order will be delivered tomorrow {{deliveryDate}} between {{deliveryWindow}}. When I'm on the way, hopefully I can text you a more specific delivery window!

📍 Please confirm that I have your delivery address correct: {{deliveryAddress}}

💚 Let me know if you have any questions. This is my personal number, so don't hesitate to reach out.`,
  },
  {
    id: "repeat-delivery",
    firstTimer: false,
    fulfillment: "delivery",
    source: "transcribed",
    slots: ["deliveryDate", "deliveryWindow"],
    body: `Hi! 🚚 Thanks SO MUCH for placing another delivery with Jade Kitchen!

📦 Reminder your order will be delivered tomorrow {{deliveryDate}} between {{deliveryWindow}}. When I'm on the way, hopefully I can text you a more specific delivery window!

💚 Let me know if you have any questions!`,
  },
  {
    id: "repeat-pickup",
    firstTimer: false,
    fulfillment: "pickup",
    source: "reconstructed", // not in the July 20 doc — written in-voice, Jessie to review
    slots: ["pickupWindow"],
    body: `Hi! 😊 Thanks SO MUCH for ordering from Jade Kitchen again!

📍 Reminder your order will be ready for pick-up between {{pickupWindow}} at Foundation Kitchen — same self-service shelf as always, bag with your name on it!

💚 See you soon!`,
  },
];
