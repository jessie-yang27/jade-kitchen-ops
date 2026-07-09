// Customer segmentation — pure code, no AI (spec §4 Stage 3).
// Replaces the manual "export CSV from Shopify, upload to Klaviyo" step.

import type { Customer, Order } from "../domain/types";

export const SEGMENT_NAMES = [
  "box-a",
  "box-b",
  "pickup",
  "delivery",
  "first-timer",
  "repeat",
] as const;

export type SegmentName = (typeof SEGMENT_NAMES)[number];

/** Segment name → customer ids (the shape the Klaviyo adapter syncs). */
export type SegmentMap = Record<SegmentName, string[]>;

export function isFirstTimer(customer: Customer): boolean {
  return customer.orderCount <= 1;
}

export function segmentOrders(orders: Order[]): SegmentMap {
  const map: SegmentMap = {
    "box-a": [],
    "box-b": [],
    pickup: [],
    delivery: [],
    "first-timer": [],
    repeat: [],
  };
  for (const order of orders) {
    const id = order.customer.id;
    map[order.box === "A" ? "box-a" : "box-b"].push(id);
    map[order.fulfillment].push(id);
    map[isFirstTimer(order.customer) ? "first-timer" : "repeat"].push(id);
  }
  return map;
}

export type SegmentCounts = Record<SegmentName, number>;

export function segmentCounts(map: SegmentMap): SegmentCounts {
  return Object.fromEntries(
    SEGMENT_NAMES.map((name) => [name, map[name].length]),
  ) as SegmentCounts;
}

/**
 * Stage 4 template selection key: first-timer/repeat × pickup/delivery.
 * Matches CommsTemplate.{firstTimer, fulfillment}.
 */
export function templateSegmentFor(order: Order): {
  firstTimer: boolean;
  fulfillment: "pickup" | "delivery";
} {
  return {
    firstTimer: isFirstTimer(order.customer),
    fulfillment: order.fulfillment,
  };
}
