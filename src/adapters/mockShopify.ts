// MockShopifyAdapter — resolves against in-memory fixtures with artificial
// latency, standing in for the real Shopify Admin API / MCP connector.
// App logic only ever sees the ShopifyAdapter interface (spec §3), so
// swapping this for a live connector later is a one-line change.

import type { Order, WeeklyDrop } from "../domain/types";
import { mockOrders as mockOrdersFixture } from "../data/mockOrders";
import { lastWeekProducts } from "./fixtures/lastWeekProducts";
import { mockLatency, type Product, type ShopifyAdapter } from "./types";

export class MockShopifyAdapter implements ShopifyAdapter {
  /** UI convention: render a "mock" badge whenever this flag is true. */
  readonly isMock = true as const;

  private products: Product[] = lastWeekProducts.map((product) => ({ ...product }));
  private nextId = 1;

  async getActiveProducts(): Promise<Product[]> {
    await mockLatency();
    return this.products.filter((product) => product.status === "active");
  }

  async createProduct(drop: WeeklyDrop): Promise<{ productIdA: string; productIdB: string }> {
    await mockLatency();
    const productIdA = `prod-${drop.weekOf}-a-${this.nextId++}`;
    const productIdB = `prod-${drop.weekOf}-b-${this.nextId++}`;
    this.products.push(
      {
        id: productIdA,
        box: "A",
        weekOf: drop.weekOf,
        title: `Jade Kitchen Box A — week of ${drop.weekOf}`,
        price: drop.priceA,
        inventoryCap: drop.orderCap,
        status: "active",
      },
      {
        id: productIdB,
        box: "B",
        weekOf: drop.weekOf,
        title: `Jade Kitchen Box B — week of ${drop.weekOf}`,
        price: drop.priceB,
        inventoryCap: drop.orderCap,
        status: "active",
      },
    );
    return { productIdA, productIdB };
  }

  async unpublishProduct(id: string): Promise<void> {
    await mockLatency();
    const product = this.findOrThrow(id);
    product.status = "unpublished";
  }

  async setInventoryCap(id: string, cap: number): Promise<void> {
    await mockLatency();
    const product = this.findOrThrow(id);
    product.inventoryCap = cap;
  }

  /**
   * v1 has one in-memory order set (the current week); `weekOf` is accepted
   * to match the interface but not used to filter, since there's no
   * multi-week order history in this mock.
   */
  async getOrdersForWeek(_weekOf: string): Promise<Order[]> {
    await mockLatency();
    return mockOrdersFixture;
  }

  async closeDrop(ids: string[]): Promise<void> {
    await mockLatency();
    for (const id of ids) {
      this.findOrThrow(id).status = "closed";
    }
  }

  private findOrThrow(id: string): Product {
    const product = this.products.find((p) => p.id === id);
    if (!product) throw new Error(`MockShopifyAdapter: unknown product id "${id}"`);
    return product;
  }
}
