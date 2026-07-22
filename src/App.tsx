import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { MockKlaviyoAdapter } from "./adapters/mockKlaviyo";
import { MockShopifyAdapter } from "./adapters/mockShopify";
import { DishLibraryCard } from "./components/DishLibraryCard";
import { DropConfigCard } from "./components/DropConfigCard";
import { Stage1Card, type LaunchLogEntry } from "./components/Stage1Card";
import { Stage2Card } from "./components/Stage2Card";
import { Stage3Card } from "./components/Stage3Card";
import { Stage4Card } from "./components/Stage4Card";
import { countBoxServings } from "./core/grocery";
import { segmentCounts, segmentOrders } from "./core/segmentation";
import { loadDishes, saveDishes } from "./data/dishStorage";
import { inventory } from "./data/inventory";
import { mockOrders } from "./data/mockOrders";
import { availableResources } from "./data/resources";
import { roster } from "./data/roster";
import type { Dish, WeeklyDrop } from "./domain/types";

const initialDrop: WeeklyDrop = {
  weekOf: "2026-07-13",
  boxA: { meat1: "", meat2: "", veggie: "", rice: "" },
  boxB: { meat1: "", meat2: "", veggie: "", rice: "" },
  orderCap: 40,
  priceA: 18,
  priceB: 18,
  status: "draft",
};

function App() {
  const [drop, setDrop] = useState<WeeklyDrop>(initialDrop);
  const [launching, setLaunching] = useState(false);
  const [launchLog, setLaunchLog] = useState<LaunchLogEntry[]>([]);
  const [productIds, setProductIds] = useState<{ A: string; B: string } | null>(null);
  const [dishes, setDishes] = useState<Dish[]>(() => loadDishes());

  const shopify = useRef(new MockShopifyAdapter()).current;
  const klaviyo = useRef(new MockKlaviyoAdapter()).current;

  useEffect(() => saveDishes(dishes), [dishes]);

  const dishById = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);

  function handleSaveDish(dish: Dish) {
    setDishes((prev) => {
      const exists = prev.some((d) => d.id === dish.id);
      return exists ? prev.map((d) => (d.id === dish.id ? dish : d)) : [...prev, dish];
    });
  }
  function handleDeleteDish(id: string) {
    setDishes((prev) => prev.filter((d) => d.id !== id));
  }

  const orders = mockOrders;
  const boxCounts = useMemo(() => countBoxServings(orders), [orders]);
  const segments = useMemo(() => segmentOrders(orders), [orders]);
  const counts = useMemo(() => segmentCounts(segments), [segments]);

  async function handleLaunch() {
    setLaunching(true);
    const log: LaunchLogEntry[] = [];
    const push = (label: string) => {
      log.push({ label, done: false });
      setLaunchLog([...log]);
    };
    const finish = () => {
      log[log.length - 1]!.done = true;
      setLaunchLog([...log]);
    };

    push("Unpublish last week's products");
    const active = await shopify.getActiveProducts();
    await Promise.all(active.map((p) => shopify.unpublishProduct(p.id)));
    finish();

    push("Create this week's Box A / Box B products");
    const { productIdA, productIdB } = await shopify.createProduct(drop);
    finish();

    push(`Set inventory cap to ${drop.orderCap} per box`);
    await Promise.all([
      shopify.setInventoryCap(productIdA, drop.orderCap),
      shopify.setInventoryCap(productIdB, drop.orderCap),
    ]);
    finish();

    setProductIds({ A: productIdA, B: productIdB });
    setDrop((d) => ({ ...d, status: "launched" }));
    setLaunching(false);
  }

  const launched = drop.status !== "draft";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Jade Kitchen Weekly Ops</h1>
        <p className="app-subtitle">
          One Monday input → the whole week's launch, ops plan, customer sync, and comms.
        </p>
      </header>

      <DropConfigCard
        drop={drop}
        dishes={dishes}
        orderCount={orders.length}
        onChange={setDrop}
        onLaunch={handleLaunch}
        launching={launching}
      />

      <DishLibraryCard dishes={dishes} onSave={handleSaveDish} onDelete={handleDeleteDish} />

      {launched && (
        <>
          <Stage1Card drop={drop} log={launchLog} />

          <Stage2Card
            drop={drop}
            boxCounts={boxCounts}
            dishById={dishById}
            inventory={inventory}
            roster={roster}
            availableResources={availableResources}
          />

          <Stage3Card orders={orders} segments={segments} counts={counts} klaviyo={klaviyo} />

          <Stage4Card orders={orders} klaviyo={klaviyo} shopify={shopify} productIds={productIds} />
        </>
      )}
    </div>
  );
}

export default App;
