// Dish library. Ratios marked "transcribed" come from the real
// "Jade Kitchen Master Recipes" sheet (per-serving = recipe amount ÷ serving
// basis) and the July 20 2025 ops sheet. Ratios marked "stubbed" are
// realistic placeholders — Jessie will supply real values (the Sheets export
// only returned the first tab, so Hong shao drumsticks and most veggie dishes
// couldn't be transcribed).
//
// Pantry/spice items follow the spec §2 convention: qtyPerServing = null
// means "check inventory", not "scale on the grocery list".

import type { Dish } from "../domain/types";

export const dishes: Dish[] = [
  // ------------------------------------------------------------- meats
  {
    id: "lu-rou-fan",
    name: "Lu rou with lu dan",
    nameZh: "卤肉饭",
    category: "meat",
    ratioSource: "transcribed", // Master Recipes "Lu rou fan" tab, 4-serving basis
    ingredients: [
      { name: "Eggs (lu dan)", qtyPerServing: 1.5, unit: "ct", storeSection: "dairy" },
      { name: "Ground pork", qtyPerServing: 0.125, unit: "lb", storeSection: "meat" },
      { name: "Ground turkey", qtyPerServing: 0.125, unit: "lb", storeSection: "meat" },
      { name: "Red onion", qtyPerServing: 0.25, unit: "cup", storeSection: "produce" },
      { name: "Shiitake mushrooms", qtyPerServing: 0.375, unit: "oz", storeSection: "produce" },
      { name: "Ginger", qtyPerServing: 0.25, unit: "ct", storeSection: "produce" },
      { name: "Scallion", qtyPerServing: 0.125, unit: "ct", storeSection: "produce" },
      { name: "Star anise", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Light soy sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Dark soy sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Oyster sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Sugar", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Cornstarch", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Chicken powder", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: [
      "Boil the eggs; peel once cool.",
      "Dice half a red onion and the shiitake mushrooms.",
      "On medium heat, cook ginger and onions for 1–2 minutes.",
      "Add mushrooms for 2 minutes.",
      "On high heat, add oil, ground pork/turkey, and star anise; brown the meat.",
      "Add the sauce (light + dark soy, oyster sauce, sugar, salt, chicken powder).",
      "Add 2 cups boiling water per 4 servings; boil for 10 minutes.",
      "Add the boiled eggs; boil for 10 more minutes.",
      "Add cornstarch slurry, remove star anise, and thicken on high heat.",
      "Garnish with diced scallion.",
    ],
    prepNotes: [
      { task: "Boil and peel lu dan eggs", timing: "saturday" },
      { task: "Dice red onion and shiitake", timing: "saturday" },
    ],
    allergens: ["soy", "wheat", "egg", "shellfish"],
    cookMinutes: 45,
    resources: ["burner", "prep-table"],
  },
  {
    id: "mapo-tofu",
    name: "Mapo tofu",
    nameZh: "麻婆豆腐",
    category: "meat",
    ratioSource: "transcribed", // Master Recipes "Mapo Tofu" tab, 2-serving basis
    ingredients: [
      { name: "Medium-firm tofu", qtyPerServing: 7, unit: "oz", storeSection: "dairy" },
      { name: "Ground pork", qtyPerServing: 3, unit: "oz", storeSection: "meat" },
      { name: "Garlic", qtyPerServing: 1.5, unit: "ct", storeSection: "produce" },
      { name: "Ginger (minced)", qtyPerServing: 0.5, unit: "tbsp", storeSection: "produce" },
      { name: "Scallion", qtyPerServing: 0.25, unit: "ct", storeSection: "produce" },
      { name: "Sichuan peppercorn", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Doubanjiang (spicy bean paste)", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Cooking wine", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Chicken powder", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Cornstarch", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: [
      "Prep all the aromatics; grind the peppercorn if you have a mortar and pestle.",
      "Dice tofu into cubes.",
      "Add oil to pan, stir-fry aromatics.",
      "Add ground meat until browned; add cooking wine and seasonings.",
      "Add spicy bean paste, then water; low heat for 5 minutes.",
      "Add cornstarch mixture.",
      "Add tofu; low heat 5 minutes to soak flavor, then high heat for the sauce.",
      "Heat peppercorn in oil and finish.",
    ],
    prepNotes: [{ task: "Mince garlic and ginger", timing: "saturday" }],
    allergens: ["soy", "wheat"],
    cookMinutes: 30,
    resources: ["burner", "prep-table"],
  },
  {
    id: "beef-with-peppers",
    name: "Beef with longhorn peppers",
    nameZh: "小椒牛肉",
    category: "meat",
    ratioSource: "transcribed", // Master Recipes "Beef with Peppers" tab, 4-serving basis
    ingredients: [
      { name: "Flank steak", qtyPerServing: 3, unit: "oz", storeSection: "meat" },
      { name: "Longhorn peppers", qtyPerServing: 0.75, unit: "ct", storeSection: "produce" },
      { name: "Long red pepper (小米辣)", qtyPerServing: 0.25, unit: "ct", storeSection: "produce" },
      { name: "Garlic", qtyPerServing: 0.75, unit: "ct", storeSection: "produce" },
      { name: "Ginger", qtyPerServing: 0.25, unit: "ct", storeSection: "produce" },
      { name: "Baking soda", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "White pepper", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Light soy sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Dark soy sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Oyster sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Cornstarch", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Chicken powder", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: [
      "Slice beef flank per slicing instructions.",
      "Marinade 1: baking soda, white pepper, light + dark soy — mix with a gloved hand.",
      "Marinade 2: add cornstarch and oil. Marinate at least 20 minutes.",
      "Slice peppers lengthwise, remove seeds, cut on a diagonal.",
      "Stir-fry beef in oil for 20 seconds; remove and set aside.",
      "Stir-fry ginger, garlic, long red pepper; add beef back.",
      "Add sauce (oyster sauce, dark soy, chicken powder) and serve.",
    ],
    prepNotes: [
      { task: "Slice and marinate beef", timing: "day-of" },
      { task: "Prep garlic and ginger", timing: "saturday" },
    ],
    allergens: ["soy", "wheat", "shellfish"],
    cookMinutes: 30,
    resources: ["burner", "prep-table"],
  },
  {
    id: "soy-glazed-chicken",
    name: "Soy glazed chicken",
    category: "meat",
    // Meat/dry-rub amounts transcribed (2-serving basis); the glaze quantities
    // were cut off in the sheet export — verify against the real tab.
    ratioSource: "transcribed",
    ingredients: [
      { name: "Chicken thigh (boneless, skinless)", qtyPerServing: 8, unit: "oz", storeSection: "meat" },
      { name: "Salt", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Black pepper", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Cornstarch", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Soy sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: [
      "Lay chicken thighs flat, season with dry rub (salt, black pepper, cornstarch).",
      "Mix sauce ingredients.",
      "Cook chicken on both sides until golden brown and crispy; remove.",
      "Add sauce and let simmer 45 seconds; add the chicken back to glaze.",
    ],
    prepNotes: [{ task: "Trim and dry-rub chicken thighs", timing: "day-of" }],
    allergens: ["soy", "wheat"],
    cookMinutes: 40,
    resources: ["burner", "prep-table"],
  },
  {
    id: "hong-shao-chicken-drumsticks",
    name: "Hong shao chicken drumsticks",
    nameZh: "红烧鸡腿",
    category: "meat",
    ratioSource: "stubbed", // TODO(Jessie): real ratios from Master Recipes
    ingredients: [
      { name: "Chicken drumsticks", qtyPerServing: 2, unit: "ct", storeSection: "meat" },
      { name: "Potato", qtyPerServing: 0.25, unit: "lb", storeSection: "produce" },
      { name: "Cabbage", qtyPerServing: 0.2, unit: "lb", storeSection: "produce" },
      { name: "Ginger", qtyPerServing: 0.25, unit: "ct", storeSection: "produce" },
      { name: "Scallion", qtyPerServing: 0.25, unit: "ct", storeSection: "produce" },
      { name: "Glass noodles", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Star anise", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Rock sugar", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Light soy sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Dark soy sauce", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: [
      "Blanch drumsticks and pat dry.",
      "Melt rock sugar in oil, brown the drumsticks.",
      "Add aromatics, soy sauces, and water; braise 30 minutes.",
      "Add potato and cabbage; braise until tender.",
      "Add soaked glass noodles at the end to soak up the sauce.",
    ],
    prepNotes: [
      { task: "Soak glass noodles", timing: "saturday" },
      { task: "Cut potato and cabbage", timing: "saturday" },
    ],
    allergens: ["soy", "wheat"],
    cookMinutes: 60,
    resources: ["burner", "prep-table"],
  },

  // ------------------------------------------------------------ veggies
  {
    id: "bok-choy",
    name: "Stir-fried bok choy",
    nameZh: "炒青菜",
    category: "veggie",
    ratioSource: "transcribed", // Master Recipes "Vegetable Stir-fries": 1⅓ lb per 4 orders
    ingredients: [
      { name: "Bok choy", qtyPerServing: 0.33, unit: "lb", storeSection: "produce" },
      { name: "Garlic", qtyPerServing: 0.5, unit: "ct", storeSection: "produce" },
      { name: "Salt", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: [
      "Cut bok choy lengthwise in half; wash well.",
      "Stir-fry garlic in hot oil, add bok choy, season with salt.",
    ],
    prepNotes: [{ task: "Wash and cut bok choy", timing: "day-of" }],
    allergens: [],
    cookMinutes: 15,
    resources: ["burner", "prep-table"],
  },
  {
    id: "broccoli",
    name: "Stir-fried broccoli",
    category: "veggie",
    ratioSource: "stubbed", // TODO(Jessie): real ratios (stub mirrors bok choy)
    ingredients: [
      { name: "Broccoli", qtyPerServing: 0.33, unit: "lb", storeSection: "produce" },
      { name: "Garlic", qtyPerServing: 0.5, unit: "ct", storeSection: "produce" },
      { name: "Salt", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: ["Cut broccoli into florets.", "Stir-fry garlic, add broccoli, splash of water, cover briefly, season."],
    prepNotes: [{ task: "Cut broccoli into florets", timing: "saturday" }],
    allergens: [],
    cookMinutes: 15,
    resources: ["burner", "prep-table"],
  },
  {
    id: "sichuan-green-beans",
    name: "Sichuan green beans",
    nameZh: "干煸四季豆",
    category: "veggie",
    ratioSource: "stubbed", // TODO(Jessie): real ratios
    ingredients: [
      { name: "Green beans", qtyPerServing: 0.33, unit: "lb", storeSection: "produce" },
      { name: "Garlic", qtyPerServing: 0.75, unit: "ct", storeSection: "produce" },
      { name: "Dried chili", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Sichuan peppercorn", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: ["Trim beans and dry well.", "Blister beans in oil; remove.", "Fry chili, peppercorn, garlic; toss beans back and season."],
    prepNotes: [{ task: "Trim and wash green beans", timing: "saturday" }],
    allergens: [],
    cookMinutes: 20,
    resources: ["burner", "prep-table"],
  },
  {
    id: "tu-dou-si",
    name: "Tu dou si (shredded potato)",
    nameZh: "土豆丝",
    category: "veggie",
    ratioSource: "stubbed", // TODO(Jessie): real ratios
    ingredients: [
      { name: "Potato", qtyPerServing: 0.4, unit: "lb", storeSection: "produce" },
      { name: "Dried chili", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Black vinegar", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: ["Julienne potatoes and soak to remove starch.", "Stir-fry with chili on high heat; finish with vinegar."],
    prepNotes: [{ task: "Julienne potatoes (keep in water)", timing: "day-of" }],
    allergens: [],
    cookMinutes: 15,
    resources: ["burner", "prep-table"],
  },
  {
    id: "tomato-egg",
    name: "Tomato egg stir-fry",
    nameZh: "番茄炒蛋",
    category: "veggie",
    ratioSource: "stubbed", // TODO(Jessie): real ratios
    ingredients: [
      { name: "Eggs", qtyPerServing: 1.5, unit: "ct", storeSection: "dairy" },
      { name: "Tomato", qtyPerServing: 0.5, unit: "lb", storeSection: "produce" },
      { name: "Scallion", qtyPerServing: 0.25, unit: "ct", storeSection: "produce" },
      { name: "Sugar", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Salt", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: ["Beat and softly scramble eggs; remove.", "Cook tomato wedges down with sugar and salt.", "Fold eggs back in; garnish with scallion."],
    prepNotes: [{ task: "Egg dishes degrade — cook day-of only", timing: "day-of" }],
    allergens: ["egg"],
    cookMinutes: 15,
    resources: ["burner", "prep-table"],
  },

  // --------------------------------------------------------------- rice
  {
    id: "white-rice",
    name: "White rice",
    category: "rice",
    ratioSource: "stubbed", // TODO(Jessie): confirm per-serving cups
    ingredients: [{ name: "White rice", qtyPerServing: 0.5, unit: "cup", storeSection: "pantry" }],
    steps: ["Measure rice into rice cooker.", "Wash 2×.", "Cook on standard setting."],
    prepNotes: [],
    allergens: [],
    cookMinutes: 60,
    resources: ["rice-cooker"],
  },
  {
    id: "brown-rice",
    name: "Brown rice (mixed)",
    category: "rice",
    ratioSource: "transcribed", // July 20 ops sheet: 1 cup white + 1 cup brown ≈ 3.5 servings
    ingredients: [
      { name: "White rice", qtyPerServing: 0.29, unit: "cup", storeSection: "pantry" },
      { name: "Brown rice", qtyPerServing: 0.29, unit: "cup", storeSection: "pantry" },
    ],
    steps: [
      "Measure and add rice to rice cooker.",
      "Wash rice 2×.",
      "Soak rice for at least 2 hours.",
      "Press White/Mixed on the Zojirushi (~1 hr cook time).",
    ],
    prepNotes: [{ task: "Soak rice at least 2 hours (night before)", timing: "saturday" }],
    allergens: [],
    cookMinutes: 60,
    resources: ["rice-cooker"],
  },

  // -------------------------------------------------- soups (a-la-carte)
  // Modeled a-la-carte per spec §9.4 (Nov 9 menu shows soup outside the boxes).
  {
    id: "abc-chicken-noodle-soup",
    name: "ABC chicken noodle soup",
    category: "soup",
    ratioSource: "transcribed", // Master Recipes, per 32 oz container
    ingredients: [
      { name: "Chicken (whole, shredded)", qtyPerServing: 4, unit: "oz", storeSection: "meat" },
      { name: "Farfalle pasta", qtyPerServing: 2.75, unit: "oz", storeSection: "pantry" },
      { name: "Celery", qtyPerServing: 2, unit: "oz", storeSection: "produce" },
      { name: "Carrot", qtyPerServing: 1, unit: "oz", storeSection: "produce" },
      { name: "Tomato", qtyPerServing: 2, unit: "oz", storeSection: "produce" },
      { name: "Ginger", qtyPerServing: 0.5, unit: "oz", storeSection: "produce" },
      { name: "Spinach", qtyPerServing: 0.5, unit: "oz", storeSection: "produce" },
      { name: "Green onion", qtyPerServing: 0.5, unit: "ct", storeSection: "produce" },
      { name: "Dried jujube", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Goji berries", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Chicken bouillon", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
      { name: "Sesame oil", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: [
      "Dice celery and carrots into 2 cm chunks; cut tomato into wedges.",
      "Cut chicken into 5 large chunks (2 breasts, 2 legs, middle carcass).",
      "Boil chicken in water; remove scum and dump the water.",
      "Remove meat off the bones; add all chicken back to BOILING water.",
      "Add pasta, celery, tomato, carrot, ginger, jujube.",
      "Season with salt and bouillon; boil at least 1 hour.",
      "Remove big bones, add goji berries, finish with green onion and sesame oil.",
    ],
    prepNotes: [{ task: "Dice celery and carrots", timing: "saturday" }],
    allergens: ["wheat", "sesame"],
    cookMinutes: 90,
    resources: ["burner", "prep-table"],
  },
  {
    id: "pork-rib-veggie-soup",
    name: "Pork rib, corn, carrot & daikon soup",
    nameZh: "排骨汤",
    category: "soup",
    ratioSource: "transcribed", // Master Recipes, per 32 oz container
    ingredients: [
      { name: "Pork ribs", qtyPerServing: 5, unit: "oz", storeSection: "meat" },
      { name: "Fresh sweet corn", qtyPerServing: 2.5, unit: "oz", storeSection: "produce" },
      { name: "Carrot", qtyPerServing: 1.5, unit: "oz", storeSection: "produce" },
      { name: "Daikon", qtyPerServing: 3.5, unit: "oz", storeSection: "produce" },
      { name: "Ginger", qtyPerServing: 1, unit: "oz", storeSection: "produce" },
      { name: "Salt", qtyPerServing: null, unit: "pantry", storeSection: "pantry" },
    ],
    steps: [
      "Bias-cut carrots ~2 inches; cut daikon into quarter rounds ~1 inch.",
      "Break corn into chunks.",
      "Boil pork ribs; remove scum and dump the water.",
      "Add pork back to boiling water.",
      "Add corn, carrot, daikon, ginger; salt to season.",
      "Boil for at least 1 hour.",
    ],
    prepNotes: [{ task: "Cut carrots, daikon, corn", timing: "saturday" }],
    allergens: [],
    cookMinutes: 90,
    resources: ["burner", "prep-table"],
  },
];

export const dishById = new Map(dishes.map((dish) => [dish.id, dish]));
