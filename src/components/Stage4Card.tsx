import { useState } from "react";
import type { Order } from "../domain/types";
import { templateSegmentFor } from "../core/segmentation";
import { commsTemplates, type CommsTemplate } from "../data/commsTemplates";
import type { MockKlaviyoAdapter } from "../adapters/mockKlaviyo";
import type { MockShopifyAdapter } from "../adapters/mockShopify";
import { MockBadge } from "./MockBadge";

type Props = {
  orders: Order[];
  klaviyo: MockKlaviyoAdapter;
  shopify: MockShopifyAdapter;
  productIds: { A: string; B: string } | null;
};

function templateFor(order: Order): CommsTemplate {
  const seg = templateSegmentFor(order);
  const template = commsTemplates.find((t) => t.firstTimer === seg.firstTimer && t.fulfillment === seg.fulfillment);
  if (!template) throw new Error(`No comms template for segment ${JSON.stringify(seg)}`);
  return template;
}

export function Stage4Card({ orders, klaviyo, shopify, productIds }: Props) {
  const [queued, setQueued] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [closing, setClosing] = useState(false);

  async function handleQueue() {
    setQueuing(true);
    await Promise.all(
      orders.map((order) =>
        klaviyo.createCampaignDraft({
          type: "sms",
          audience: { kind: "customer", customerId: order.customer.id },
          body: templateFor(order).body,
        }),
      ),
    );
    setQueued(true);
    setQueuing(false);
  }

  async function handleClose() {
    if (!productIds) return;
    setClosing(true);
    await shopify.closeDrop([productIds.A, productIds.B]);
    setClosed(true);
    setClosing(false);
  }

  const grouped = new Map<string, { template: CommsTemplate; count: number }>();
  for (const order of orders) {
    const template = templateFor(order);
    const existing = grouped.get(template.id);
    if (existing) existing.count += 1;
    else grouped.set(template.id, { template, count: 1 });
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>
          Stage 4 — Saturday logistics comms <span className="day-tag">Sat</span>
        </h2>
        <MockBadge />
      </div>
      <p className="hint">
        Template-driven; AI personalization slots (name, box contents) land in the next build step — the AI never
        rewrites the templates themselves.
      </p>

      {[...grouped.values()].map(({ template, count }) => (
        <details key={template.id} className="template-preview">
          <summary>
            {template.id} — {count} customer{count === 1 ? "" : "s"}
          </summary>
          <pre>{template.body}</pre>
        </details>
      ))}

      <div className="stage4-actions">
        <button type="button" className="primary" onClick={handleQueue} disabled={queuing || queued}>
          {queued ? `Queued ${orders.length} drafts ✓` : queuing ? "Queuing…" : "Queue as Klaviyo drafts"}
        </button>
        <span className="draft-only-badge">draft-only — nothing is ever sent</span>
        <button type="button" onClick={handleClose} disabled={!productIds || closing || closed}>
          {closed ? "Drop closed ✓" : closing ? "Closing…" : "Close drop"}
        </button>
      </div>
    </section>
  );
}
