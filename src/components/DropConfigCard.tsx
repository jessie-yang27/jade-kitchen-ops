import type { BoxConfig, Dish, WeeklyDrop } from "../domain/types";

type Props = {
  drop: WeeklyDrop;
  dishes: Dish[];
  orderCount: number;
  onChange: (drop: WeeklyDrop) => void;
  onLaunch: () => void;
  launching: boolean;
};

function dishOptions(dishes: Dish[], category: Dish["category"]): Dish[] {
  return dishes.filter((d) => d.category === category);
}

function BoxBuilder({
  label,
  box,
  dishes,
  onChange,
}: {
  label: string;
  box: BoxConfig;
  dishes: Dish[];
  onChange: (box: BoxConfig) => void;
}) {
  const meats = dishOptions(dishes, "meat");
  const veggies = dishOptions(dishes, "veggie");
  const rices = dishOptions(dishes, "rice");

  return (
    <div className="box-builder">
      <h3>{label}</h3>
      <label>
        Meat 1
        <select value={box.meat1} onChange={(e) => onChange({ ...box, meat1: e.target.value })}>
          {meats.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Meat 2
        <select value={box.meat2} onChange={(e) => onChange({ ...box, meat2: e.target.value })}>
          {meats.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Veggie
        <select value={box.veggie} onChange={(e) => onChange({ ...box, veggie: e.target.value })}>
          {veggies.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rice
        <select value={box.rice} onChange={(e) => onChange({ ...box, rice: e.target.value })}>
          {rices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function DropConfigCard({ drop, dishes, orderCount, onChange, onLaunch, launching }: Props) {
  return (
    <section className="card">
      <h2>Weekly drop — week of {drop.weekOf}</h2>
      <div className="box-builders">
        <BoxBuilder label="Box A" box={drop.boxA} dishes={dishes} onChange={(boxA) => onChange({ ...drop, boxA })} />
        <BoxBuilder label="Box B" box={drop.boxB} dishes={dishes} onChange={(boxB) => onChange({ ...drop, boxB })} />
      </div>
      <div className="drop-controls">
        <label>
          Order cap: {drop.orderCap}
          <input
            type="range"
            min={10}
            max={80}
            value={drop.orderCap}
            onChange={(e) => onChange({ ...drop, orderCap: Number(e.target.value) })}
          />
        </label>
        <label>
          Price A ($)
          <input
            type="number"
            min={0}
            value={drop.priceA}
            onChange={(e) => onChange({ ...drop, priceA: Number(e.target.value) })}
          />
        </label>
        <label>
          Price B ($)
          <input
            type="number"
            min={0}
            value={drop.priceB}
            onChange={(e) => onChange({ ...drop, priceB: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="hint">{orderCount} mock orders on file for this week.</p>
      <button type="button" className="primary" onClick={onLaunch} disabled={launching || drop.status !== "draft"}>
        {launching ? "Launching…" : drop.status === "draft" ? "Launch week" : "Launched ✓"}
      </button>
    </section>
  );
}
