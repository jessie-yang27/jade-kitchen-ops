import { useState } from "react";
import type { Order } from "../domain/types";
import type { SegmentCounts, SegmentMap } from "../core/segmentation";
import type { MockKlaviyoAdapter } from "../adapters/mockKlaviyo";
import { MockBadge } from "./MockBadge";

type Props = {
  orders: Order[];
  segments: SegmentMap;
  counts: SegmentCounts;
  klaviyo: MockKlaviyoAdapter;
};

export function Stage3Card({ orders, segments, counts, klaviyo }: Props) {
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    await klaviyo.syncCustomers(
      orders.map((o) => o.customer),
      segments,
    );
    setSynced(true);
    setSyncing(false);
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>
          Stage 3 — Friday customer sync <span className="day-tag">Fri</span>
        </h2>
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

      <button type="button" className="primary" onClick={handleSync} disabled={syncing || synced}>
        {synced ? "Synced to Klaviyo ✓" : syncing ? "Syncing…" : "Sync segments to Klaviyo"}
      </button>
    </section>
  );
}
