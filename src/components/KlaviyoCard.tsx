import { useState } from "react";
import type { Dish, Order, WeeklyDrop } from "../domain/types";
import type { SegmentCounts, SegmentMap } from "../core/segmentation";
import type { MockKlaviyoAdapter } from "../adapters/mockKlaviyo";
import { generateMenuDropCopy } from "../ai/campaignCopy";
import { assembleMenuDropEmail, type MenuDropCopy } from "../core/menuDropEmail";
import { listingDishIds } from "../core/productListing";
import { buildReminderCampaigns, type ReminderCampaign } from "../core/reminderCopy";
import { MockBadge } from "./MockBadge";

type Props = {
  drop: WeeklyDrop;
  orders: Order[];
  segments: SegmentMap;
  counts: SegmentCounts;
  dishById: Map<string, Dish>;
  klaviyo: MockKlaviyoAdapter;
};

function boxLabel(box: WeeklyDrop["boxA"], fallback: string): string {
  return box.themeName?.trim() || fallback;
}

function dishNamesFor(box: WeeklyDrop["boxA"], dishById: Map<string, Dish>): string[] {
  return listingDishIds(box)
    .map((id) => dishById.get(id)?.name)
    .filter((name): name is string => Boolean(name));
}

function ReminderVariant({
  campaign,
  onQueue,
}: {
  campaign: ReminderCampaign;
  onQueue: () => void;
}) {
  const [queued, setQueued] = useState(false);
  return (
    <div className="template-preview">
      <p className="hint">{campaign.segment === "first-timer" ? "First-timer" : "Repeat customer"}</p>
      <p className="listing-title">{campaign.subject}</p>
      <pre>{campaign.body}</pre>
      <button
        type="button"
        onClick={async () => {
          await onQueue();
          setQueued(true);
        }}
        disabled={queued}
      >
        {queued ? "Queued ✓" : "Queue as draft"}
      </button>
    </div>
  );
}

export function KlaviyoCard({ drop, orders, segments, counts, dishById, klaviyo }: Props) {
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [menuDropCopy, setMenuDropCopy] = useState<MenuDropCopy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [menuDropQueued, setMenuDropQueued] = useState(false);

  async function handleSync() {
    setSyncing(true);
    await klaviyo.syncCustomers(
      orders.map((o) => o.customer),
      segments,
    );
    setSynced(true);
    setSyncing(false);
  }

  async function handleGenerateMenuDrop() {
    setGenerating(true);
    setGenError(null);
    try {
      const boxA = { label: boxLabel(drop.boxA, "Box A"), dishNames: dishNamesFor(drop.boxA, dishById) };
      const boxB = { label: boxLabel(drop.boxB, "Box B"), dishNames: dishNamesFor(drop.boxB, dishById) };
      const ai = await generateMenuDropCopy({ boxA, boxB });
      setMenuDropCopy({
        headerLine: ai.headerLine,
        sms: ai.sms,
        boxA: { label: boxA.label, blurb: ai.boxABlurb, riceName: dishById.get(drop.boxA.rice)?.name ?? "Rice", dishNames: boxA.dishNames },
        boxB: { label: boxB.label, blurb: ai.boxBBlurb, riceName: dishById.get(drop.boxB.rice)?.name ?? "Rice", dishNames: boxB.dishNames },
      });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Menu drop copy generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleQueueMenuDrop() {
    if (!menuDropCopy) return;
    const { subject, body } = assembleMenuDropEmail(menuDropCopy, drop.weekOf);
    await klaviyo.createCampaignDraft({
      type: "email",
      audience: { kind: "segment" },
      subject,
      body,
      previewText: menuDropCopy.headerLine,
      heroImageSlot: "hero-launch",
      boxDescriptions: { A: menuDropCopy.boxA.blurb, B: menuDropCopy.boxB.blurb },
      orderDeadline: drop.weekOf,
      fulfillmentInfo: "Pickup or delivery Sunday",
      cta: "Order now",
    });
    await klaviyo.createCampaignDraft({ type: "sms", audience: { kind: "segment" }, body: menuDropCopy.sms });
    setMenuDropQueued(true);
  }

  const pickupCampaigns = buildReminderCampaigns("pickup", drop.weekOf);
  const deliveryCampaigns = buildReminderCampaigns("delivery", drop.weekOf);

  return (
    <section className="card">
      <div className="card-header">
        <h2>Klaviyo</h2>
        <MockBadge />
      </div>
      <p className="hint">Replaces the manual "export CSV from Shopify, upload to Klaviyo" step.</p>

      <div className="metric-cards">
        <div className="metric">
          <strong>{counts["box-a"]}</strong>
          <span>Box A</span>
        </div>
        <div className="metric">
          <strong>{counts["box-b"]}</strong>
          <span>Box B</span>
        </div>
        <div className="metric">
          <strong>{counts.pickup}</strong>
          <span>Pickup</span>
        </div>
        <div className="metric">
          <strong>{counts.delivery}</strong>
          <span>Delivery</span>
        </div>
        <div className="metric">
          <strong>{counts["first-timer"]}</strong>
          <span>First-timer</span>
        </div>
        <div className="metric">
          <strong>{counts.repeat}</strong>
          <span>Repeat</span>
        </div>
      </div>
      <button type="button" onClick={handleSync} disabled={syncing || synced}>
        {synced ? "Synced to Klaviyo ✓" : syncing ? "Syncing…" : "Sync segments to Klaviyo"}
      </button>

      <h4>Menu drop campaign</h4>
      <p className="hint">The one piece of copy in this app that's genuinely AI-written — box flavor blurbs and a header line. Dates and the dish list are assembled in code.</p>
      <button type="button" className="primary" onClick={handleGenerateMenuDrop} disabled={generating}>
        {generating ? "Generating…" : menuDropCopy ? "Regenerate copy (AI)" : "Generate copy (AI)"}
      </button>
      {genError && <p className="error">{genError}</p>}
      {menuDropCopy && (
        <div className="template-preview">
          {(() => {
            const { subject, body } = assembleMenuDropEmail(menuDropCopy, drop.weekOf);
            return (
              <>
                <p className="listing-title">{subject}</p>
                <pre>{body}</pre>
              </>
            );
          })()}
          <p className="hint">SMS teaser: {menuDropCopy.sms}</p>
          <button type="button" onClick={handleQueueMenuDrop} disabled={menuDropQueued}>
            {menuDropQueued ? "Queued ✓" : "Queue as Klaviyo draft"}
          </button>
        </div>
      )}

      <h4>Pickup reminder</h4>
      <p className="hint">Reuses the real transcribed customer messages — dates filled in by code, name/address left as merge tags for Klaviyo to fill per recipient.</p>
      {pickupCampaigns.map((c) => (
        <ReminderVariant
          key={c.segment}
          campaign={c}
          onQueue={() =>
            klaviyo.createCampaignDraft({ type: "sms", audience: { kind: "segment" }, body: c.body }).then(() => {})
          }
        />
      ))}

      <h4>Delivery reminder</h4>
      {deliveryCampaigns.map((c) => (
        <ReminderVariant
          key={c.segment}
          campaign={c}
          onQueue={() =>
            klaviyo.createCampaignDraft({ type: "sms", audience: { kind: "segment" }, body: c.body }).then(() => {})
          }
        />
      ))}

      <p className="draft-only-badge">draft-only — nothing is ever sent</p>
    </section>
  );
}
