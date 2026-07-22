import { useState } from "react";
import type { Dish, DishCategory } from "../domain/types";
import { DishModal } from "./DishModal";

type Props = {
  dishes: Dish[];
  onSave: (dish: Dish) => void;
  onDelete: (id: string) => void;
};

function DishColumn({
  title,
  category,
  dishes,
  onOpen,
  onAdd,
}: {
  title: string;
  category: DishCategory;
  dishes: Dish[];
  onOpen: (dish: Dish) => void;
  onAdd: (category: DishCategory) => void;
}) {
  return (
    <div className="dish-column">
      <h3>{title}</h3>
      <ul className="dish-list">
        {dishes.map((dish) => (
          <li key={dish.id}>
            <button type="button" className="dish-name-button" onClick={() => onOpen(dish)}>
              {dish.name}
            </button>
          </li>
        ))}
        {dishes.length === 0 && <li className="hint">No dishes yet.</li>}
      </ul>
      <button type="button" className="link-button" onClick={() => onAdd(category)}>
        + Add {title.toLowerCase()} dish
      </button>
    </div>
  );
}

export function DishLibraryCard({ dishes, onSave, onDelete }: Props) {
  const [openDish, setOpenDish] = useState<Dish | null | "new">(null);
  const [newCategory, setNewCategory] = useState<DishCategory>("meat");

  const meats = dishes.filter((d) => d.category === "meat");
  const veggies = dishes.filter((d) => d.category === "veggie");

  return (
    <section className="card">
      <h2>Dish library</h2>
      <p className="hint">Click a dish to view the full recipe, edit it, or add a new one.</p>
      <div className="dish-columns">
        <DishColumn
          title="Meat"
          category="meat"
          dishes={meats}
          onOpen={setOpenDish}
          onAdd={(c) => {
            setNewCategory(c);
            setOpenDish("new");
          }}
        />
        <DishColumn
          title="Veggie"
          category="veggie"
          dishes={veggies}
          onOpen={setOpenDish}
          onAdd={(c) => {
            setNewCategory(c);
            setOpenDish("new");
          }}
        />
      </div>

      {openDish !== null && (
        <DishModal
          dish={openDish === "new" ? null : openDish}
          existingDishes={dishes}
          defaultCategory={newCategory}
          onClose={() => setOpenDish(null)}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </section>
  );
}
