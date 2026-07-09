// MockKlaviyoAdapter — draft-only by design (spec §3). There is deliberately
// no send method: sending an email/SMS stays a human action for v1.

import type { Customer } from "../domain/types";
import type { SegmentMap } from "../core/segmentation";
import {
  mockLatency,
  type CampaignDraft,
  type EmailCampaign,
  type KlaviyoAdapter,
  type SmsCampaign,
} from "./types";

export class MockKlaviyoAdapter implements KlaviyoAdapter {
  /** UI convention: render a "mock" badge whenever this flag is true. */
  readonly isMock = true as const;

  private syncedCustomers: Customer[] = [];
  private syncedSegments: SegmentMap | null = null;
  private drafts: CampaignDraft[] = [];
  private nextDraftId = 1;

  async syncCustomers(customers: Customer[], segments: SegmentMap): Promise<void> {
    await mockLatency();
    this.syncedCustomers = customers;
    this.syncedSegments = segments;
  }

  async createCampaignDraft(campaign: EmailCampaign | SmsCampaign): Promise<{ draftId: string }> {
    await mockLatency();
    const draftId = `draft-${this.nextDraftId++}`;
    this.drafts.push({ draftId, campaign, createdAt: new Date().toISOString() });
    return { draftId };
  }

  /** Not part of the ShopifyAdapter/KlaviyoAdapter contract — read-only
   *  helpers so the UI (Stage 3 segment cards, Stage 4 draft queue) can
   *  inspect what this mock instance has recorded. */
  getSyncedSegments(): SegmentMap | null {
    return this.syncedSegments;
  }

  getSyncedCustomers(): Customer[] {
    return this.syncedCustomers;
  }

  getDrafts(): CampaignDraft[] {
    return this.drafts;
  }
}
