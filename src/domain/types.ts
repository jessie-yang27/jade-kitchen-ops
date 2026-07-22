// Core domain types, transcribed from the build spec §2 (source of truth).
// One addition beyond the spec: `ratioSource` marks whether ingredient ratios
// were transcribed from the Master Recipes sheet or stubbed pending real data.

export type Unit = "lb" | "oz" | "ct" | "tbsp" | "tsp" | "cup" | "pantry";
export type StoreSection = "meat" | "produce" | "pantry" | "dairy";
export type DishCategory = "meat" | "veggie" | "rice" | "soup";

export type Ingredient = {
  name: string;
  qtyPerServing: number | null; // null = pantry/check-inventory item
  unit: Unit;
  storeSection: StoreSection;
};

export type RecipeStep = string;

export type PrepTiming = "saturday" | "day-of";
export type PrepNote = { task: string; timing: PrepTiming };

/** Equipment classes a dish needs (station instances live in the ops plan). */
export type DishResource = "burner" | "prep-table" | "oven" | "rice-cooker";

export type Dish = {
  id: string;
  name: string; // "Lu rou with lu dan"
  nameZh?: string; // "卤肉饭"
  category: DishCategory;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  prepNotes: PrepNote[]; // e.g., { task: "boil eggs", timing: "saturday" }
  allergens: string[]; // soy, egg, wheat, sesame, shellfish...
  cookMinutes: number;
  resources: DishResource[];
  /** Data provenance: "transcribed" = real Master Recipes values; "stubbed" = replace with real data. */
  ratioSource: "transcribed" | "stubbed";
  /** Freeform reference text (e.g. pasted from a blog) — not parsed into structured fields. */
  notes?: string;
};

export type BoxConfig = {
  meat1: string; // dish ids
  meat2: string;
  veggie: string;
  rice: string;
};

export type WeeklyDrop = {
  weekOf: string; // ISO date
  boxA: BoxConfig;
  boxB: BoxConfig;
  orderCap: number;
  priceA: number;
  priceB: number;
  status: "draft" | "launched" | "closed";
};

export type Customer = {
  id: string;
  firstName: string;
  email: string;
  phone: string;
  orderCount: number; // drives first-timer vs repeat segmentation
};

export type Order = {
  id: string;
  customer: Customer;
  box: "A" | "B";
  qty: number;
  fulfillment: "pickup" | "delivery";
  deliveryAddress?: string;
};

// ---------------------------------------------------------------------------
// Stage 2 ops-plan output contract (spec §5). The AI must return exactly this
// shape; the seven eval checks run against it in code.
// ---------------------------------------------------------------------------

export type ScheduleResource =
  | "burner-1"
  | "burner-2"
  | "prep-table"
  | "rice-cooker"
  | "oven"
  | "none";

export type SaturdayPrepItem = {
  task: string;
  dish: string;
  assignee: string;
  estMinutes: number;
};

export type SequenceTask = {
  id: string;
  task: string;
  dish: string;
  box: "A" | "B" | "shared";
  assignee: string;
  start: string; // "HH:MM"
  durationMin: number;
  resource: ScheduleResource;
  dependsOn: string[]; // task ids
};

export type OnePager = {
  station: string;
  audience: "volunteer";
  content: string;
};

export type AllergenFlag = {
  box: "A" | "B";
  allergens: string[];
};

export type OpsPlan = {
  saturdayPrep: SaturdayPrepItem[];
  sundaySequence: SequenceTask[];
  onePagers: OnePager[];
  allergenFlags: AllergenFlag[];
};
