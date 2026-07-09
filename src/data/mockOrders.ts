// Mock order generator (synthetic customers — no real customer data).
// Seeded PRNG so the same seed always yields the same orders: tests stay
// deterministic and demo runs are reproducible.
//
// Target mix per spec §2: ~40 orders across 2 boxes, ~55% pickup /
// 45% delivery, ~20% first-timers.

import type { Order } from "../domain/types";

/** mulberry32 — tiny deterministic PRNG, good enough for fixtures. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Emily", "Jenny", "Kaitlin", "Sarah", "Connor", "Lucy", "Margaret", "Peter",
  "Liana", "Isaiah", "Sophia", "An-Chi", "Eileen", "Tammie", "Chiara", "Jesse",
  "Kevin", "Grace", "Daniel", "Michelle", "Andrew", "Rachel", "Brian", "Amy",
  "Nathan", "Olivia", "Eric", "Hannah", "Victor", "Diana", "Sam", "Priya",
  "Marcus", "Elena", "Tom", "Wendy", "Alex", "Nina", "Chris", "Maya",
];

const LAST_NAMES = [
  "Ou", "Liang", "Woo", "Yiu", "Byrne", "He", "Chuang", "Bergmann", "Sandell",
  "Cohen", "Litovchick", "Huang", "Wei", "Koh", "Cherin", "Ye", "Chen", "Kim",
  "Patel", "Nguyen", "Garcia", "Smith", "Lee", "Wang", "Johnson", "Brown",
  "Rivera", "Zhang", "Murphy", "Das", "Novak", "Silva", "Okafor", "Ross",
];

const STREETS = [
  "Whittier Place", "Anderson Street", "East Dedham Street", "Concord Square",
  "Massachusetts Avenue", "Ransom Road", "Commonwealth Avenue", "Western Ave",
  "Kinnaird Street", "Beech Street", "Cushing Avenue", "Monsignor O'Brien Highway",
];

const CITIES = ["Boston", "Cambridge", "Somerville", "Charlestown", "Belmont"];

export type MockOrderOptions = {
  count?: number;
  seed?: number;
  pickupShare?: number; // 0..1
  firstTimerShare?: number; // 0..1
};

export function generateMockOrders(options: MockOrderOptions = {}): Order[] {
  const { count = 40, seed = 42, pickupShare = 0.55, firstTimerShare = 0.2 } = options;
  const rand = mulberry32(seed);
  const pick = <T>(pool: T[]): T => pool[Math.floor(rand() * pool.length)]!;

  const orders: Order[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const handle = `${firstName.toLowerCase().replace(/[^a-z]/g, "")}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}${Math.floor(rand() * 90) + 10}`;
    const isFirstTimer = rand() < firstTimerShare;
    const fulfillment = rand() < pickupShare ? "pickup" : "delivery";

    const order: Order = {
      id: `#${1200 + i}`,
      customer: {
        id: `cust-${String(i + 1).padStart(3, "0")}`,
        firstName,
        email: `${handle}@example.com`,
        phone: `617${String(Math.floor(rand() * 9000000) + 1000000)}`,
        orderCount: isFirstTimer ? 1 : Math.floor(rand() * 12) + 2,
      },
      box: rand() < 0.5 ? "A" : "B",
      qty: rand() < 0.75 ? 1 : 2,
      fulfillment,
    };
    if (fulfillment === "delivery") {
      order.deliveryAddress = `${Math.floor(rand() * 400) + 1} ${pick(STREETS)}, Apt ${Math.floor(rand() * 30) + 1}, ${pick(CITIES)}, MA`;
    }
    orders.push(order);
  }
  return orders;
}

/** Default fixture used by the mock Shopify adapter. */
export const mockOrders: Order[] = generateMockOrders();
