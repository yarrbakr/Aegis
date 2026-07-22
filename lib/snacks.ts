// Snack recommendations (Design.md D11 — replaces the reference's "Recommend
// food" panel). A safety-first take: instead of an LLM guessing snacks, we keep
// a small curated list and run each one through the SAME deterministic guardrail
// (screenMeal) the meal plans use. So the dashboard can only ever recommend a
// snack that is safe for the user's declared allergens — the guardrail earns its
// keep on a second surface, with zero extra model calls.

import { screenMeal, type ScreenableMeal } from "@/lib/guardrails/allergen";

export type Snack = {
  name: string;
  emoji: string;
  kcal: number;
  note: string; // short "why it's here" tag, e.g. "High protein"
  ingredients: { name: string; allergen_tags: string[] }[];
};

// Curated snacks spanning many allergens on purpose, so the filter visibly does
// work (a peanut-allergic user won't see PB toast; a milk-allergic user won't
// see the yogurt). allergen_tags mirror what the model would tag.
const SNACKS: Snack[] = [
  {
    name: "Apple & almond butter",
    emoji: "🍎",
    kcal: 210,
    note: "Fiber + healthy fats",
    ingredients: [
      { name: "Apple", allergen_tags: [] },
      { name: "Almond butter", allergen_tags: ["tree nuts"] },
    ],
  },
  {
    name: "Greek yogurt & berries",
    emoji: "🫐",
    kcal: 180,
    note: "High protein",
    ingredients: [
      { name: "Greek yogurt", allergen_tags: ["milk"] },
      { name: "Mixed berries", allergen_tags: [] },
    ],
  },
  {
    name: "Hummus & carrot sticks",
    emoji: "🥕",
    kcal: 150,
    note: "Plant protein",
    ingredients: [
      { name: "Hummus", allergen_tags: ["sesame"] },
      { name: "Carrot", allergen_tags: [] },
    ],
  },
  {
    name: "Rice cakes & peanut butter",
    emoji: "🥜",
    kcal: 220,
    note: "Quick energy",
    ingredients: [
      { name: "Rice cakes", allergen_tags: [] },
      { name: "Peanut butter", allergen_tags: ["peanuts"] },
    ],
  },
  {
    name: "Banana",
    emoji: "🍌",
    kcal: 105,
    note: "Potassium boost",
    ingredients: [{ name: "Banana", allergen_tags: [] }],
  },
  {
    name: "Roasted edamame",
    emoji: "🫛",
    kcal: 130,
    note: "Plant protein",
    ingredients: [{ name: "Edamame", allergen_tags: ["soy"] }],
  },
  {
    name: "Cheese & crackers",
    emoji: "🧀",
    kcal: 200,
    note: "Savory pick-me-up",
    ingredients: [
      { name: "Cheddar cheese", allergen_tags: ["milk"] },
      { name: "Wheat crackers", allergen_tags: ["wheat", "gluten"] },
    ],
  },
  {
    name: "Boiled eggs",
    emoji: "🥚",
    kcal: 140,
    note: "High protein",
    ingredients: [{ name: "Eggs", allergen_tags: ["eggs"] }],
  },
  {
    name: "Orange slices",
    emoji: "🍊",
    kcal: 80,
    note: "Vitamin C",
    ingredients: [{ name: "Orange", allergen_tags: [] }],
  },
  {
    name: "Roasted chickpeas",
    emoji: "🌰",
    kcal: 160,
    note: "Crunchy & filling",
    ingredients: [{ name: "Chickpeas", allergen_tags: [] }],
  },
  {
    name: "Guacamole & cucumber",
    emoji: "🥑",
    kcal: 170,
    note: "Healthy fats",
    ingredients: [
      { name: "Avocado", allergen_tags: [] },
      { name: "Cucumber", allergen_tags: [] },
    ],
  },
  {
    name: "Dark chocolate square",
    emoji: "🍫",
    kcal: 120,
    note: "Antioxidants",
    ingredients: [{ name: "Dark chocolate", allergen_tags: [] }],
  },
];

// A snack is "disliked" if any disliked term appears in its name or an
// ingredient name. Taste-only filtering — applied AFTER the safety screen, so it
// can never let an unsafe snack through, only hide a safe-but-unwanted one.
function isDisliked(snack: Snack, dislikes: string[]): boolean {
  if (dislikes.length === 0) return false;
  const hay = [snack.name, ...snack.ingredients.map((i) => i.name)]
    .join(" ")
    .toLowerCase();
  return dislikes.some((d) => {
    const term = d.trim().toLowerCase();
    return term.length > 0 && hay.includes(term);
  });
}

/**
 * Safe snacks for a user — every returned snack has passed the deterministic
 * guardrail against `allergens` (safety), then disliked snacks are dropped as a
 * best-effort taste filter. Deterministic and pure (same engine as meals).
 */
export function safeSnacks(
  allergens: string[],
  dislikes: string[] = [],
  limit = 4,
): Snack[] {
  const safe = SNACKS.filter((s) => {
    const meal: ScreenableMeal = {
      name: s.name,
      description: "",
      ingredients: s.ingredients,
    };
    return screenMeal(meal, allergens).safe;
  });
  const liked = safe.filter((s) => !isDisliked(s, dislikes));
  // If dislikes wiped out everything, fall back to the safe set — never show an
  // empty panel over a taste preference (safety already guaranteed above).
  return (liked.length > 0 ? liked : safe).slice(0, limit);
}
