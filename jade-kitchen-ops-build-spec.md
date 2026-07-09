# Jade Kitchen Weekly Ops — Build Spec

Portfolio demo app that automates the weekly launch workflow for Jade Kitchen (weekly Asian meal-prep business, Shopify + Klaviyo stack). One Monday input fans out into four stages that previously consumed founder time across Mon/Thu/Fri/Sat. Built with mocked API layers designed to swap for live Shopify/Klaviyo MCP connectors later.

**Demo narrative:** "My co-founder and I spent Thursday + Friday + Saturday mornings on coordination overhead. This system collapses it to one input on Monday." The judgment-heavy AI work (Stage 2 ops planning) is the centerpiece; the API plumbing (Stages 1/3/4) shows the manual work eliminated.

---

## 1. Stack

- React + Vite (same as wedding app — reuse deployment pattern: GitHub → Vercel)
- Anthropic API via Vercel serverless proxy (NOTE: solve the CORS proxy pattern here first — same fix the wedding app's AI Planner tab needs; reuse the solution there)
- No database for v1 — app state in memory + JSON fixtures; localStorage optional later
- Single-page app, four-stage timeline UI (see §6)

## 2. Domain model

### Weekly drop structure (confirmed against real 2026 Menu doc + Nov 9 2025 drop)
- 2 boxes per week (Box A, Box B)
- Each box = 2 meat dishes + 1 veggie dish + 1 rice choice
- Combined weekly order cap (e.g., 40), split per box by orders as they come in
- Order fulfillment: Sunday 2–6 PM, pickup (self-service at Foundation Kitchen) or delivery

### Core types

```typescript
type Dish = {
  id: string;
  name: string;              // "Lu rou with lu dan"
  nameZh?: string;           // "卤肉饭"
  category: "meat" | "veggie" | "rice" | "soup";
  ingredients: Ingredient[];
  steps: RecipeStep[];
  prepNotes: PrepNote[];     // e.g., { task: "boil eggs", timing: "saturday" }
  allergens: string[];       // soy, egg, wheat, sesame, shellfish...
  cookMinutes: number;
  resources: Resource[];     // burner, prep-table, oven, rice-cooker
};

type Ingredient = {
  name: string;
  qtyPerServing: number | null;  // null = pantry/check-inventory item
  unit: "lb" | "oz" | "ct" | "tbsp" | "tsp" | "cup" | "pantry";
  storeSection: "meat" | "produce" | "pantry" | "dairy";
};

type WeeklyDrop = {
  weekOf: string;            // ISO date
  boxA: BoxConfig;           // { meat1, meat2, veggie, rice: dishIds }
  boxB: BoxConfig;
  orderCap: number;
  priceA: number;
  priceB: number;
  status: "draft" | "launched" | "closed";
};

type Order = {
  id: string;
  customer: Customer;
  box: "A" | "B";
  qty: number;
  fulfillment: "pickup" | "delivery";
  deliveryAddress?: string;
};

type Customer = {
  id: string;
  firstName: string;
  email: string;
  phone: string;
  orderCount: number;        // drives first-timer vs repeat segmentation
};
```

### Seed data
- Recipes: port from the Master Recipes Google Sheet (Lu rou fan, Mapo tofu, Beef with peppers, Hong shao chicken drumsticks, ABC chicken noodle soup, Pork rib + veggie soup, Soy glazed chicken) plus veggie dishes from the 2026 Menu doc (bok choy, broccoli, Sichuan green beans, tu dou si, tomato egg). Per-serving ratios already exist in the sheet — transcribe, don't invent.
- Mock orders: generate ~40 fake orders across 2 boxes with realistic segment mix (55% pickup / 45% delivery, ~20% first-timers). Reuse the fake-guest-list generator pattern (synthetic names/emails/phones).

## 3. Mock API layer (swap-ready)

Every external call goes through an adapter interface so the mock can be replaced by real MCP/API calls without touching app logic.

```typescript
interface ShopifyAdapter {
  getActiveProducts(): Promise<Product[]>;
  createProduct(drop: WeeklyDrop): Promise<{ productIdA, productIdB }>;
  unpublishProduct(id: string): Promise<void>;
  setInventoryCap(id: string, cap: number): Promise<void>;
  getOrdersForWeek(weekOf: string): Promise<Order[]>;
  closeDrop(ids: string[]): Promise<void>;
}

interface KlaviyoAdapter {
  syncCustomers(customers: Customer[], segments: SegmentMap): Promise<void>;
  createCampaignDraft(campaign: EmailCampaign | SmsCampaign): Promise<{ draftId }>;
  // v1 NEVER sends — draft-only by design. Sending stays a human action.
}
```

- `MockShopifyAdapter` / `MockKlaviyoAdapter`: resolve against JSON fixtures with 300–800ms artificial latency + a visible "mock" badge in the UI.
- OPEN QUESTION (resolve after connecting real Shopify): were past drops one product with A/B variants, or two separate products? Affects `createProduct` contract and inventory-cap logic. Build the mock as two separate products for now; adapter interface isolates the change.

## 4. The four stages

### Stage 1 — Monday launch fan-out (deterministic + light AI)
Input: WeeklyDrop config (2 boxes, cap, prices).
Outputs:
1. Shopify: unpublish last week's products, create/publish this week's, set inventory cap. (Adapter calls — no AI.)
2. Full Klaviyo launch email (AI-generated): subject, preview text, hero image slot, per-box dish descriptions, order deadline, pickup/delivery info, CTA. See §5 voice guide.
3. SMS teaser (AI-generated): 1–2 sentences, separate output from same input.

### Stage 2 — Thursday ops plan (the AI centerpiece)
Input: WeeklyDrop + order count + inventory state + team roster.
Deterministic pre-compute (code, NOT AI): scaled grocery list = ingredient ratios × per-box order counts, merged across both boxes, deduped, grouped by store section, diffed against inventory. Arithmetic must never route through the LLM.
AI-generated (single structured call, JSON output):
1. Sunday sequence — every task with assignee, start time, duration, station/resource, respecting constraints in §5.
2. Saturday-night prep list (soak rice, boil lu dan eggs, chop-ahead-safe aromatics).
3. Volunteer one-pagers — one per station, written for someone who has never made the dish, including the "why" on food-safety steps.

### Stage 3 — Friday customer sync (deterministic)
Pull week's orders (mock adapter) → segment: box A/B, pickup/delivery, first-timer/repeat → sync to Klaviyo segments. Replaces the manual "export CSV from Shopify, upload to Klaviyo" step documented in the 2026 Weekly Operations Playbook. Pure code, no AI. Show segment counts as metric cards.

### Stage 4 — Saturday logistics comms (template + light AI personalization)
For each customer, select the correct base template (real templates exist in the "July 20 Messages" doc — port them as fixtures):
- First-time pickup: self-service instructions, shelf location, reheating guide, personal-touch sign-off
- First-time delivery: window, address confirmation, reheating guide
- Repeat pickup / repeat delivery: shorter reminder variants
AI fills personalization slots (name, box contents, week-specific notes) — it does NOT rewrite the templates. Queue as Klaviyo drafts. Then close the drop on Shopify.

## 5. AI design

### Stage 2 prompt architecture (three layers)

**System prompt (fixed):**
- Role: operations planner for Jade Kitchen
- Hard constraints (from Food Safety SOP):
  - Windows: 8:00–10:00 prep, 10:00–12:00 cook + package, 12:00–14:00 cool + clean
  - Danger zone: no TCS food unrefrigerated > 2 hours (target ≤ 1 hour per packaged box)
  - Cook all dishes for a given box in sequence so packaged boxes don't sit idle
  - Cool 140°F → 70°F within 2 hrs, → 40°F within 4 hrs
  - Allergen handling: clean between allergen/non-allergen batches; flag allergens per box
- Prep rules: Saturday-eligible (rice soaking, egg boiling, hardy-aromatic prep, freezable components) vs day-of-only (leafy vegetables, eggs dishes, anything that degrades)
- Output contract: JSON only, schema below

**Injected context (computed weekly):** menu with full recipe steps verbatim from seed data; per-box order counts; pre-scaled grocery quantities (from the deterministic step — the model consumes these, never computes them); team roster with hours; current inventory; available resources (e.g., 2 burners, 1 prep table, 1 rice cooker — confirm real Foundation Kitchen station counts).

**Task instruction:** generate sequence + Saturday prep + one-pagers per the output schema.

### Stage 2 output schema

```json
{
  "saturdayPrep": [{ "task": "", "dish": "", "assignee": "", "estMinutes": 0 }],
  "sundaySequence": [{
    "id": "", "task": "", "dish": "", "box": "A|B|shared",
    "assignee": "", "start": "HH:MM", "durationMin": 0,
    "resource": "burner-1|burner-2|prep-table|rice-cooker|oven|none",
    "dependsOn": ["taskId"]
  }],
  "onePagers": [{ "station": "", "audience": "volunteer", "content": "" }],
  "allergenFlags": [{ "box": "A|B", "allergens": [""] }]
}
```

### Automated eval checks (run in code against the JSON — this is the interview eval story)
1. Every task fits inside its window (prep tasks end by 10:00, cook tasks by 12:00)
2. No resource double-booked (two tasks on burner-1 can't overlap)
3. Dependency order respected (no task starts before its dependsOn tasks end)
4. Box-sequence rule: for each box, dish cook tasks are contiguous
5. No packaged box exceeds 60 min before a "refrigerate" task
6. Every dish in the drop appears in the sequence; no hallucinated dishes
7. Every allergen in seed data for the week's dishes appears in allergenFlags
On failure: surface which check failed, re-prompt once with the failure appended; if it fails twice, flag for human review. Show pass/fail visibly in the UI — the eval layer IS the demo.

### Voice guide (Stages 1 & 4 copy generation)
Source of truth: the July 20 Messages doc + past launch emails. Style traits to encode in the prompt: warm and direct; exclamation points; occasional ALL CAPS for emphasis ("we got a LOT of delivery requests"); emoji as section markers (❄️🔥📍🚚💚); first person from Jessie; practical details always precise (times, addresses, reheating instructions). Include 2–3 real template excerpts as few-shot examples. Generated copy should be indistinguishable from Jessie's — that's the bar, and a good live-demo moment (show real vs. generated side by side).

## 6. UI

Single-page vertical timeline, four stage cards (Mon / Thu / Fri / Sat) matching the validated mockup:
- Top: drop configuration card — Box A + Box B builders (meat 1, meat 2, veggie, rice selects populated from the dish library, filtered by category), order cap slider, prices, "Launch week" button
- Stage 1 card: Shopify actions checklist + full email preview (rendered like an email client: subject / preview text / body) + SMS teaser
- Stage 2 card (visually emphasized — it's the centerpiece): grocery list grouped by store section with inventory diffs, Sunday sequence as a resource-lane Gantt (lanes = assignees or stations), Saturday prep checklist, one-pagers as expandable sections, eval check results as pass/fail pills
- Stage 3 card: segment metric cards (Box A/B, pickup/delivery, first-timer counts) + before/after framing ("replaces manual CSV export")
- Stage 4 card: per-segment message queue with template previews, draft-only badge, "Close drop" action
- Every mock API call shows a subtle "mock" badge; swapping adapters later removes them

Design: clean, flat, minimal — consistent with the wedding app's polish bar. Mobile-responsive not required for v1 (demo is desktop/screen-share).

## 7. Build order

1. Scaffold Vite + React, port the Vercel serverless proxy for Anthropic API calls (unblocks the wedding app CORS fix too)
2. Seed data: dish library from Master Recipes + 2026 Menu doc; mock orders generator; comms templates from July 20 Messages
3. Deterministic core: grocery scaling/merging/dedup + segmentation logic + eval check functions (all pure functions, unit-test these)
4. Mock adapters with latency + fixtures
5. Stage 2 AI call + schema validation + eval loop (hardest part — do before UI polish)
6. Stages 1 & 4 copy generation with voice few-shots
7. Timeline UI, wire everything
8. Deploy to Vercel, record demo walkthrough

## 8. Explicitly out of scope for v1

- Real sending of any email/SMS (draft-only, always)
- Live Shopify/Klaviyo writes (adapters mocked; real connectors are a v2 swap)
- Auth, multi-user, persistence beyond fixtures
- Inventory tracker automation (Tuesday tasks stay human)
- Delivery route optimization (interesting v2: Saturday's route planning)

## 9. Open questions to resolve

1. Shopify product structure for past drops: one product with A/B variants vs. two products (check after connecting the jadekitcheneats store)
2. Foundation Kitchen real resource counts (burners, prep stations) for the Stage 2 constraint set
3. Canonical box pricing for the demo
4. Whether soups are part of the current 2-box structure or a separate a-la-carte line (Nov 9 menu shows soup as a-la-carte — model it that way unless corrected)
