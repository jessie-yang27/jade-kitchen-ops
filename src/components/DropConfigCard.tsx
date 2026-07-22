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

function isBoxComplete(box: BoxConfig): boolean {
  return Boolean(box.meat1 && box.meat2 && box.veggie && box.rice);
}

function BoxBuilder({
  label,
  box,
  dishes,
  disabled,
  onChange,
}: {
  label: string;
  box: BoxConfig;
  dishes: Dish[];
  disabled: boolean;
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
        <select
          value={box.meat1}
          disabled={disabled}
          onChange={(e) => onChange({ ...box, meat1: e.target.value })}
        >
          <option value="">— Select —</option>
          {meats.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Meat 2
        <select
          value={box.meat2}
          disabled={disabled}
          onChange={(e) => onChange({ ...box, meat2: e.target.value })}
        >
          <option value="">— Select —</option>
          {meats.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Veggie
        <select
          value={box.veggie}
          disabled={disabled}
          onChange={(e) => onChange({ ...box, veggie: e.target.value })}
        >
          <option value="">— Select —</option>
          {veggies.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rice
        <select
          value={box.rice}
          disabled={disabled}
          onChange={(e) => onChange({ ...box, rice: e.target.value })}
        >
          <option value="">— Select —</option>
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
  const locked = drop.status !== "draft";
  const readyToLaunch = isBoxComplete(drop.boxA) && isBoxComplete(drop.boxB);

  return (
    <section className="card card-primary">
      <h2>Weekly drop — week of {drop.weekOf}</h2>
      <div className="box-builders">
        <BoxBuilder
          label="Box A"
          box={drop.boxA}
          dishes={dishes}
          disabled={locked}
          onChange={(boxA) => onChange({ ...drop, boxA })}
        />
        <BoxBuilder
          label="Box B"
          box={drop.boxB}
          dishes={dishes}
          disabled={locked}
          onChange={(boxB) => onChange({ ...drop, boxB })}
        />
      </div>
      <div className="drop-controls">
        <label>
          Order cap: {drop.orderCap}
          <input
            type="range"
            min={10}
            max={80}
            value={drop.orderCap}
            disabled={locked}
            onChange={(e) => onChange({ ...drop, orderCap: Number(e.target.value) })}
          />
        </label>
        <label>
          Price A ($)
          <input
            type="number"
            min={0}
            value={drop.priceA}
            disabled={locked}
            onChange={(e) => onChange({ ...drop, priceA: Number(e.target.value) })}
          />
        </label>
        <label>
          Price B ($)
          <input
            type="number"
            min={0}
            value={drop.priceB}
            disabled={locked}
            onChange={(e) => onChange({ ...drop, priceB: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="hint">{orderCount} mock orders on file for this week.</p>
      <button
        type="button"
        className="primary"
        onClick={onLaunch}
        disabled={launching || locked || !readyToLaunch}
      >
        {launching ? "Launching…" : locked ? "Launched ✓" : readyToLaunch ? "Launch week" : "Fill in both boxes to launch"}
      </button>
    </section>
  );
}
