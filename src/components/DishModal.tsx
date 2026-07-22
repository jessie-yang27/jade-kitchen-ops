import { useState } from "react";
import type { Dish, DishCategory, DishResource, Ingredient, PrepNote, PrepTiming, StoreSection, Unit } from "../domain/types";
import { generateDishId } from "../data/dishStorage";

const CATEGORIES: DishCategory[] = ["meat", "veggie", "rice", "soup"];
const UNITS: Unit[] = ["lb", "oz", "ct", "tbsp", "tsp", "cup", "pantry"];
const STORE_SECTIONS: StoreSection[] = ["meat", "produce", "pantry", "dairy"];
const TIMINGS: PrepTiming[] = ["saturday", "day-of"];
const RESOURCES: DishResource[] = ["burner", "prep-table", "oven", "rice-cooker"];

function blankDish(category: DishCategory): Dish {
  return {
    id: "",
    name: "",
    category,
    ingredients: [],
    steps: [],
    prepNotes: [],
    allergens: [],
    cookMinutes: 30,
    resources: [],
    ratioSource: "stubbed",
    notes: "",
  };
}

type Props = {
  dish: Dish | null; // null → create mode
  existingDishes: Dish[];
  defaultCategory: DishCategory;
  onClose: () => void;
  onSave: (dish: Dish) => void;
  onDelete?: (id: string) => void;
};

export function DishModal({ dish, existingDishes, defaultCategory, onClose, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(dish === null);
  const [draft, setDraft] = useState<Dish>(dish ?? blankDish(defaultCategory));

  function updateIngredient(index: number, patch: Partial<Ingredient>) {
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
    }));
  }
  function addIngredient() {
    setDraft((d) => ({
      ...d,
      ingredients: [...d.ingredients, { name: "", qtyPerServing: null, unit: "pantry", storeSection: "pantry" }],
    }));
  }
  function removeIngredient(index: number) {
    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((_, i) => i !== index) }));
  }

  function updateStep(index: number, value: string) {
    setDraft((d) => ({ ...d, steps: d.steps.map((s, i) => (i === index ? value : s)) }));
  }
  function addStep() {
    setDraft((d) => ({ ...d, steps: [...d.steps, ""] }));
  }
  function removeStep(index: number) {
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== index) }));
  }

  function updatePrepNote(index: number, patch: Partial<PrepNote>) {
    setDraft((d) => ({
      ...d,
      prepNotes: d.prepNotes.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }
  function addPrepNote() {
    setDraft((d) => ({ ...d, prepNotes: [...d.prepNotes, { task: "", timing: "day-of" }] }));
  }
  function removePrepNote(index: number) {
    setDraft((d) => ({ ...d, prepNotes: d.prepNotes.filter((_, i) => i !== index) }));
  }

  function toggleResource(resource: DishResource) {
    setDraft((d) => ({
      ...d,
      resources: d.resources.includes(resource)
        ? d.resources.filter((r) => r !== resource)
        : [...d.resources, resource],
    }));
  }

  function handleSave() {
    if (!draft.name.trim()) return;
    const id = draft.id || generateDishId(draft.name, existingDishes);
    onSave({ ...draft, id, name: draft.name.trim() });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {!editing ? (
          <>
            <div className="modal-header">
              <h3>
                {draft.name}
                {draft.nameZh && <span className="name-zh"> {draft.nameZh}</span>}
              </h3>
              <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>
            <p className="hint">
              {draft.category} · {draft.cookMinutes} min
              {draft.allergens.length > 0 && ` · allergens: ${draft.allergens.join(", ")}`}
            </p>

            <h4>Ingredients</h4>
            <ul className="recipe-list">
              {draft.ingredients.map((ing, i) => (
                <li key={i}>
                  {ing.name} — {ing.qtyPerServing === null ? "check inventory" : `${ing.qtyPerServing} ${ing.unit} / serving`}
                </li>
              ))}
              {draft.ingredients.length === 0 && <li className="hint">No ingredients listed yet.</li>}
            </ul>

            <h4>Steps</h4>
            <ol className="recipe-list">
              {draft.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
              {draft.steps.length === 0 && <li className="hint">No steps listed yet.</li>}
            </ol>

            {draft.prepNotes.length > 0 && (
              <>
                <h4>Prep notes</h4>
                <ul className="recipe-list">
                  {draft.prepNotes.map((p, i) => (
                    <li key={i}>
                      {p.task} ({p.timing})
                    </li>
                  ))}
                </ul>
              </>
            )}

            {draft.notes && (
              <>
                <h4>Notes</h4>
                <p className="dish-notes">{draft.notes}</p>
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="primary" onClick={() => setEditing(true)}>
                Edit
              </button>
              {onDelete && draft.id && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (confirm(`Delete "${draft.name}"? This can't be undone.`)) {
                      onDelete(draft.id);
                      onClose();
                    }
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <h3>{dish ? "Edit dish" : "Add a new dish"}</h3>
              <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="form-grid">
              <label>
                Name
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Lu rou with lu dan"
                />
              </label>
              <label>
                Chinese name (optional)
                <input
                  type="text"
                  value={draft.nameZh ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, nameZh: e.target.value || undefined }))}
                  placeholder="卤肉饭"
                />
              </label>
              <label>
                Category
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as DishCategory }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cook minutes
                <input
                  type="number"
                  min={0}
                  value={draft.cookMinutes}
                  onChange={(e) => setDraft((d) => ({ ...d, cookMinutes: Number(e.target.value) }))}
                />
              </label>
              <label className="span-2">
                Allergens (comma-separated)
                <input
                  type="text"
                  value={draft.allergens.join(", ")}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      allergens: e.target.value
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="soy, wheat, egg"
                />
              </label>
            </div>

            <div className="checkbox-row">
              {RESOURCES.map((r) => (
                <label key={r} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={draft.resources.includes(r)}
                    onChange={() => toggleResource(r)}
                  />
                  {r}
                </label>
              ))}
            </div>

            <h4>
              Ingredients
              <button type="button" className="link-button" onClick={addIngredient}>
                + add
              </button>
            </h4>
            {draft.ingredients.map((ing, i) => (
              <div key={i} className="ingredient-row">
                <input
                  type="text"
                  placeholder="ingredient name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, { name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="qty/serving"
                  value={ing.qtyPerServing ?? ""}
                  onChange={(e) =>
                    updateIngredient(i, { qtyPerServing: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
                <select value={ing.unit} onChange={(e) => updateIngredient(i, { unit: e.target.value as Unit })}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <select
                  value={ing.storeSection}
                  onChange={(e) => updateIngredient(i, { storeSection: e.target.value as StoreSection })}
                >
                  {STORE_SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button type="button" className="icon-button" onClick={() => removeIngredient(i)} aria-label="Remove ingredient">
                  ✕
                </button>
              </div>
            ))}

            <h4>
              Steps
              <button type="button" className="link-button" onClick={addStep}>
                + add
              </button>
            </h4>
            {draft.steps.map((step, i) => (
              <div key={i} className="step-row">
                <span className="step-num">{i + 1}.</span>
                <input type="text" value={step} onChange={(e) => updateStep(i, e.target.value)} />
                <button type="button" className="icon-button" onClick={() => removeStep(i)} aria-label="Remove step">
                  ✕
                </button>
              </div>
            ))}

            <h4>
              Prep notes
              <button type="button" className="link-button" onClick={addPrepNote}>
                + add
              </button>
            </h4>
            {draft.prepNotes.map((p, i) => (
              <div key={i} className="ingredient-row">
                <input
                  type="text"
                  placeholder="task"
                  value={p.task}
                  onChange={(e) => updatePrepNote(i, { task: e.target.value })}
                />
                <select value={p.timing} onChange={(e) => updatePrepNote(i, { timing: e.target.value as PrepTiming })}>
                  {TIMINGS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button type="button" className="icon-button" onClick={() => removePrepNote(i)} aria-label="Remove prep note">
                  ✕
                </button>
              </div>
            ))}

            <label className="span-2">
              Notes (paste from a blog, recipe card, etc. — kept as reference text, not parsed)
              <textarea
                rows={4}
                value={draft.notes ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="Paste a link or recipe text here for your own reference…"
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="primary" onClick={handleSave} disabled={!draft.name.trim()}>
                Save dish
              </button>
              <button type="button" onClick={() => (dish ? setEditing(false) : onClose())}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
