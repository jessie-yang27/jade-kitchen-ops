// Fixture: products still "active" from last week's drop when this week's
// Monday launch runs. MockShopifyAdapter.getActiveProducts() resolves these
// until unpublishProduct() is called on them.
//
// Built as TWO separate products per box (spec §3 open question — resolve
// against the real jadekitcheneats store in the v2 swap).

import type { Product } from "../types";

export const lastWeekProducts: Product[] = [
  {
    id: "prod-2026-07-06-a",
    box: "A",
    weekOf: "2026-07-06",
    title: "Jade Kitchen Box A — week of Jul 6",
    price: 18,
    inventoryCap: 20,
    status: "active",
  },
  {
    id: "prod-2026-07-06-b",
    box: "B",
    weekOf: "2026-07-06",
    title: "Jade Kitchen Box B — week of Jul 6",
    price: 18,
    inventoryCap: 20,
    status: "active",
  },
];
