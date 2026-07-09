// Adapter contracts (spec §3). Every external call goes through these
// interfaces so a mock can be swapped for a real Shopify/Klaviyo (MCP)
// connector later without touching app logic.

import type { Customer, Order, WeeklyDrop } from "../domain/types";
import type { SegmentMap } from "../core/segmentation";

export type Product = {
  id: string;
  box: "A" | "B";
  weekOf: string; // ISO date
  title: string;
  price: number;
  inventoryCap: number;
  status: "active" | "unpublished" | "closed";
};

/** Who a Stage 1 broadcast or Stage 4 personal message goes to. */
export type CampaignAudience =
  | { kind: "segment" }
  | { kind: "customer"; customerId: string };

export type EmailCampaign = {
  type: "email";
  audience: CampaignAudience;
  subject: string;
  previewText: string;
  heroImageSlot: string;
  boxDescriptions: { A: string; B: string };
  orderDeadline: string;
  fulfillmentInfo: string;
  cta: string;
};

export type SmsCampaign = {
  type: "sms";
  audience: CampaignAudience;
  body: string;
};

export type CampaignDraft = {
  draftId: string;
  campaign: EmailCampaign | SmsCampaign;
  createdAt: string;
};

export interface ShopifyAdapter {
  getActiveProducts(): Promise<Product[]>;
  createProduct(drop: WeeklyDrop): Promise<{ productIdA: string; productIdB: string }>;
  unpublishProduct(id: string): Promise<void>;
  setInventoryCap(id: string, cap: number): Promise<void>;
  getOrdersForWeek(weekOf: string): Promise<Order[]>;
  closeDrop(ids: string[]): Promise<void>;
}

export interface KlaviyoAdapter {
  syncCustomers(customers: Customer[], segments: SegmentMap): Promise<void>;
  createCampaignDraft(campaign: EmailCampaign | SmsCampaign): Promise<{ draftId: string }>;
  // v1 NEVER sends — draft-only by design. Sending stays a human action.
  // Deliberately no `send`/`sendCampaign` method exists on this interface.
}

/** 300–800ms artificial latency, per spec §3, so the mock "feels" like a network call. */
export function mockLatency(): Promise<void> {
  const ms = 300 + Math.random() * 500;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
