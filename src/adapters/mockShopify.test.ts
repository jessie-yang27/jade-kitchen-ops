import { describe, expect, it } from "vitest";
import type { WeeklyDrop } from "../domain/types";
import { MockShopifyAdapter } from "./mockShopify";

const drop: WeeklyDrop = {
  weekOf: "2026-07-13",
  boxA: { meat1: "lu-rou-fan", meat2: "mapo-tofu", veggie: "bok-choy", rice: "brown-rice" },
  boxB: {
    meat1: "beef-with-peppers",
    meat2: "soy-glazed-chicken",
    veggie: "sichuan-green-beans",
    rice: "white-rice",
  },
  orderCap: 40,
  priceA: 18,
  priceB: 20,
  status: "draft",
};

describe("MockShopifyAdapter", () => {
  it("exposes a mock badge flag", () => {
    expect(new MockShopifyAdapter().isMock).toBe(true);
  });

  it("has artificial latency in the 300-800ms range", async () => {
    const adapter = new MockShopifyAdapter();
    const start = performance.now();
    await adapter.getActiveProducts();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(290); // small slack for timer jitter
    expect(elapsed).toBeLessThan(900);
  });

  it("starts with last week's two products as active", async () => {
    const products = await new MockShopifyAdapter().getActiveProducts();
    expect(products).toHaveLength(2);
    expect(products.map((p) => p.box).sort()).toEqual(["A", "B"]);
  });

  it("createProduct makes two separate products (spec §3 open question, built as two)", async () => {
    const adapter = new MockShopifyAdapter();
    const { productIdA, productIdB } = await adapter.createProduct(drop);
    expect(productIdA).not.toBe(productIdB);
    const active = await adapter.getActiveProducts();
    const created = active.filter((p) => p.id === productIdA || p.id === productIdB);
    expect(created).toHaveLength(2);
    expect(created.find((p) => p.id === productIdA)?.price).toBe(18);
    expect(created.find((p) => p.id === productIdB)?.price).toBe(20);
  });

  it("unpublishProduct removes a product from getActiveProducts", async () => {
    const adapter = new MockShopifyAdapter();
    const before = await adapter.getActiveProducts();
    await adapter.unpublishProduct(before[0]!.id);
    const after = await adapter.getActiveProducts();
    expect(after).toHaveLength(before.length - 1);
    expect(after.find((p) => p.id === before[0]!.id)).toBeUndefined();
  });

  it("setInventoryCap updates the cap on the matching product", async () => {
    const adapter = new MockShopifyAdapter();
    const [first] = await adapter.getActiveProducts();
    await adapter.setInventoryCap(first!.id, 99);
    const after = await adapter.getActiveProducts();
    expect(after.find((p) => p.id === first!.id)?.inventoryCap).toBe(99);
  });

  it("throws a clear error for an unknown product id", async () => {
    const adapter = new MockShopifyAdapter();
    await expect(adapter.unpublishProduct("nonexistent")).rejects.toThrow(/unknown product id/);
  });

  it("getOrdersForWeek returns the mock order fixture", async () => {
    const orders = await new MockShopifyAdapter().getOrdersForWeek("2026-07-13");
    expect(orders.length).toBeGreaterThan(0);
  });

  it("closeDrop marks the given products closed", async () => {
    const adapter = new MockShopifyAdapter();
    const before = await adapter.getActiveProducts();
    await adapter.closeDrop(before.map((p) => p.id));
    const after = await adapter.getActiveProducts();
    expect(after).toHaveLength(0);
  });
});
