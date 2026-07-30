import { useState } from "react";
import type { Dish, WeeklyDrop } from "../domain/types";
import { dishIconDataUri } from "../core/dishIcon";
import { buildProductListing, listingDishIds } from "../core/productListing";
import type { MockShopifyAdapter } from "../adapters/mockShopify";
import { MockBadge } from "./MockBadge";
import type { LaunchLogEntry } from "./launchTypes";

type Props = {
  drop: WeeklyDrop;
  dishById: Map<string, Dish>;
  log: LaunchLogEntry[];
  productIds: { A: string; B: string } | null;
  shopify: MockShopifyAdapter;
  onClosed: () => void;
};

export function ShopifyCard({ drop, dishById, log, productIds, shopify, onClosed }: Props) {
  const [closing, setClosing] = useState(false);
  const closed = drop.status === "closed";

  async function handleClose() {
    if (!productIds) return;
    setClosing(true);
    await shopify.closeDrop([productIds.A, productIds.B]);
    onClosed();
    setClosing(false);
  }

  const dishIds = [...new Set([...listingDishIds(drop.boxA), ...listingDishIds(drop.boxB)])];

  return (
    <section className="card">
      <div className="card-header">
        <h2>Shopify</h2>
        <MockBadge />
      </div>

      <ul className="checklist">
        {log.map((entry, i) => (
          <li key={i} className={entry.done ? "done" : "pending"}>
            {entry.done ? "✓" : "…"} {entry.label}
          </li>
        ))}
      </ul>

      <h4>Product listings</h4>
      <div className="listing-grid">
        {dishIds.map((id) => {
          const dish = dishById.get(id);
          if (!dish) return null;
          const listing = buildProductListing(dish);
          return (
            <div key={id} className="listing-card">
              <img
                src={listing.imageUrl ?? dishIconDataUri(dish)}
                alt={dish.name}
                className="listing-photo"
              />
              <h4 className="listing-title">{listing.title}</h4>
              {listing.blurb ? (
                <p className="listing-blurb">{listing.blurb}</p>
              ) : (
                <p className="hint">No listing copy yet — edit this dish in the library to add one.</p>
              )}
              {listing.coreIngredients.length > 0 && (
                <p className="listing-meta">Core Ingredients: {listing.coreIngredients.join(", ")}</p>
              )}
              <p className="listing-fine-print">{listing.disclaimer}</p>
              {listing.contains && <p className="listing-fine-print">{listing.contains}</p>}
              <p className="listing-fine-print">{listing.allergenInfo}</p>
              <p className="listing-fine-print">{listing.bestBy}</p>
            </div>
          );
        })}
      </div>

      <div className="modal-actions">
        <button type="button" onClick={handleClose} disabled={!productIds || closing || closed}>
          {closed ? "Drop closed ✓" : closing ? "Closing…" : "Close drop"}
        </button>
      </div>
    </section>
  );
}
