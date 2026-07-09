import { describe, expect, it } from "vitest";
import type { Order } from "../domain/types";
import { generateMockOrders } from "../data/mockOrders";
import {
  isFirstTimer,
  segmentCounts,
  segmentOrders,
  templateSegmentFor,
} from "./segmentation";

function makeOrder(overrides: {
  id: string;
  box: "A" | "B";
  fulfillment: "pickup" | "delivery";
  orderCount: number;
}): Order {
  return {
    id: overrides.id,
    customer: {
      id: `cust-${overrides.id}`,
      firstName: "Test",
      email: "t@example.com",
      phone: "6170000000",
      orderCount: overrides.orderCount,
    },
    box: overrides.box,
    qty: 1,
    fulfillment: overrides.fulfillment,
  };
}

describe("segmentOrders", () => {
  const orders = [
    makeOrder({ id: "1", box: "A", fulfillment: "pickup", orderCount: 1 }),
    makeOrder({ id: "2", box: "B", fulfillment: "delivery", orderCount: 5 }),
    makeOrder({ id: "3", box: "A", fulfillment: "delivery", orderCount: 2 }),
  ];
  const map = segmentOrders(orders);

  it("places each customer in exactly one of each segment pair", () => {
    expect(map["box-a"]).toEqual(["cust-1", "cust-3"]);
    expect(map["box-b"]).toEqual(["cust-2"]);
    expect(map.pickup).toEqual(["cust-1"]);
    expect(map.delivery).toEqual(["cust-2", "cust-3"]);
    expect(map["first-timer"]).toEqual(["cust-1"]);
    expect(map.repeat).toEqual(["cust-2", "cust-3"]);
  });

  it("produces counts that partition the orders", () => {
    const counts = segmentCounts(map);
    expect(counts["box-a"] + counts["box-b"]).toBe(orders.length);
    expect(counts.pickup + counts.delivery).toBe(orders.length);
    expect(counts["first-timer"] + counts.repeat).toBe(orders.length);
  });
});

describe("isFirstTimer boundary", () => {
  it("orderCount 1 is a first-timer; 2 is repeat", () => {
    expect(isFirstTimer({ id: "c", firstName: "", email: "", phone: "", orderCount: 1 })).toBe(true);
    expect(isFirstTimer({ id: "c", firstName: "", email: "", phone: "", orderCount: 2 })).toBe(false);
  });
});

describe("templateSegmentFor", () => {
  it("maps an order to its Stage 4 template key", () => {
    const order = makeOrder({ id: "9", box: "B", fulfillment: "delivery", orderCount: 1 });
    expect(templateSegmentFor(order)).toEqual({ firstTimer: true, fulfillment: "delivery" });
  });
});

describe("generateMockOrders (fixture sanity)", () => {
  it("is deterministic for the same seed", () => {
    expect(generateMockOrders({ seed: 7 })).toEqual(generateMockOrders({ seed: 7 }));
  });

  it("hits the target segment mix roughly (40 orders, ~55/45, ~20% first-timers)", () => {
    const orders = generateMockOrders();
    expect(orders).toHaveLength(40);
    const counts = segmentCounts(segmentOrders(orders));
    expect(counts.pickup + counts.delivery).toBe(40);
    // loose statistical bounds — the point is "realistic mix", not exactness
    expect(counts.pickup).toBeGreaterThanOrEqual(16);
    expect(counts.pickup).toBeLessThanOrEqual(28);
    expect(counts["first-timer"]).toBeGreaterThanOrEqual(3);
    expect(counts["first-timer"]).toBeLessThanOrEqual(14);
  });

  it("gives every delivery order an address and no pickup order one", () => {
    for (const order of generateMockOrders()) {
      if (order.fulfillment === "delivery") {
        expect(order.deliveryAddress).toBeTruthy();
      } else {
        expect(order.deliveryAddress).toBeUndefined();
      }
    }
  });
});
