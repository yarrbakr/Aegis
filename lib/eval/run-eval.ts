// ─────────────────────────────────────────────────────────────────────────────
// Aegis EVAL HARNESS — the number that proves the guardrail works (Phase 5).
//
//   npm run eval        (node --experimental-strip-types lib/eval/run-eval.ts)
//
// It builds a large LABELED corpus — meals we KNOW are unsafe for a given
// allergy profile, and meals we KNOW are safe — across many profiles, then runs
// every meal through the REAL shipped guardrail (`screenMeal` from
// lib/guardrails/allergen.ts — not a copy). It reports:
//
//   • CATCH RATE  — of all unsafe meals, how many the guardrail blocked. This is
//     the safety number; the target is 100% (a single miss = an unsafe meal
//     could reach a user, so the harness exits non-zero).
//   • SPECIFICITY — of all safe meals, how many the guardrail correctly allowed
//     (false positives are a UX cost, not a safety failure, but we track them).
//
// The unsafe foods below are an INDEPENDENT list of real allergen-containing
// ingredients — deliberately NOT the guardrail's own synonym table — so this is
// a real test of coverage, not a circular one.
// ─────────────────────────────────────────────────────────────────────────────

import { screenMeal, type ScreenableMeal } from "../guardrails/allergen.ts";

type Profile = { name: string; allergens: string[] };

// Real foods that contain each allergen (independent of the guardrail internals).
const CONTAINS: Record<string, string[]> = {
  peanuts: ["peanut butter", "roasted peanuts", "groundnut oil", "satay sauce"],
  "tree nuts": ["almonds", "cashew butter", "chopped walnuts", "pecans"],
  milk: ["cheddar cheese", "whole milk", "greek yogurt", "cream cheese", "whey protein"],
  eggs: ["scrambled eggs", "mayonnaise", "egg noodles"],
  fish: ["salmon fillet", "canned tuna", "cod loin"],
  shellfish: ["shrimp", "king prawns", "crab meat", "lobster tail"],
  soy: ["tofu", "soy sauce", "edamame beans"],
  wheat: ["wheat flour", "white bread", "wheat pasta"],
  gluten: ["barley", "rye bread", "seitan"],
  sesame: ["tahini", "sesame oil", "hummus"],
  kiwi: ["kiwi fruit", "sliced kiwi"],
  mango: ["fresh mango", "dried mango"],
};

// Ingredients free of every allergen above — used to build known-safe meals.
const SAFE_INGREDIENTS = [
  "chicken breast",
  "white rice",
  "potato",
  "carrot",
  "broccoli",
  "olive oil",
  "apple",
  "banana",
  "beef strips",
  "spinach",
  "bell pepper",
  "quinoa",
];

const PROFILES: Profile[] = [
  { name: "Peanut allergy", allergens: ["peanuts"] },
  { name: "Tree-nut allergy", allergens: ["tree nuts"] },
  { name: "Milk allergy", allergens: ["milk"] },
  { name: "Egg allergy", allergens: ["eggs"] },
  { name: "Fish allergy", allergens: ["fish"] },
  { name: "Shellfish allergy", allergens: ["shellfish"] },
  { name: "Soy allergy", allergens: ["soy"] },
  { name: "Wheat allergy", allergens: ["wheat"] },
  { name: "Coeliac (gluten)", allergens: ["gluten"] },
  { name: "Sesame allergy", allergens: ["sesame"] },
  { name: "Custom: kiwi", allergens: ["kiwi"] },
  { name: "Custom: mango", allergens: ["mango"] },
  { name: "Multi: peanuts + shellfish + kiwi", allergens: ["peanuts", "shellfish", "kiwi"] },
  { name: "Coeliac + dairy", allergens: ["gluten", "wheat", "milk"] },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

type UnsafeCase = { meal: ScreenableMeal; allergen: string; vector: string };

// For each declared allergen, hide a real allergen-containing food three ways:
// tagged (model got it right), untagged (model forgot — the hard case), and only
// in the meal name/description (allergen never reaches an ingredient row).
function unsafeMealsFor(profile: Profile): UnsafeCase[] {
  const out: UnsafeCase[] = [];
  for (const allergen of profile.allergens) {
    for (const food of CONTAINS[allergen] ?? []) {
      out.push({
        allergen,
        vector: "tagged",
        meal: {
          name: "Daily special",
          description: "A hearty plate.",
          ingredients: [{ name: cap(food), quantity: "100g", allergen_tags: [allergen] }],
        },
      });
      out.push({
        allergen,
        vector: "untagged-ingredient",
        meal: {
          name: "Daily special",
          description: "A hearty plate.",
          ingredients: [{ name: cap(food), quantity: "100g", allergen_tags: [] }],
        },
      });
      out.push({
        allergen,
        vector: "meal-name-only",
        meal: {
          name: `${cap(food)} bowl`,
          description: `Freshly prepared with ${food}.`,
          ingredients: [{ name: "House seasoning", quantity: "1 tsp", allergen_tags: [] }],
        },
      });
    }
  }
  return out;
}

function safeMealsFor(): ScreenableMeal[] {
  const combos = [
    ["chicken breast", "white rice", "broccoli"],
    ["beef strips", "potato", "carrot"],
    ["quinoa", "spinach", "bell pepper", "olive oil"],
    ["banana", "apple"],
  ];
  return combos.map((ings, i) => ({
    name: `Wholesome plate ${i + 1}`,
    description: "Allergen-free by construction.",
    ingredients: ings.map((n) => ({ name: cap(n), quantity: "100g", allergen_tags: [] })),
  }));
}

// ── Run ───────────────────────────────────────────────────────────────────

console.log("\n════════════════════════════════════════════════════════════");
console.log("  AEGIS GUARDRAIL EVAL — real shipped screenMeal() vs a labeled corpus");
console.log("════════════════════════════════════════════════════════════\n");
console.log(`  ${pad("Profile", 34)} ${pad("unsafe blocked", 16)} safe allowed`);
console.log(`  ${"-".repeat(34)} ${"-".repeat(16)} ------------`);

let unsafeTotal = 0;
let unsafeCaught = 0;
let safeTotal = 0;
let safePassed = 0;
const misses: string[] = [];
const falsePositives: string[] = [];

for (const profile of PROFILES) {
  const unsafe = unsafeMealsFor(profile);
  let caught = 0;
  for (const u of unsafe) {
    unsafeTotal++;
    if (!screenMeal(u.meal, profile.allergens).safe) {
      caught++;
      unsafeCaught++;
    } else {
      misses.push(
        `${profile.name}: MISSED ${u.allergen} via ${u.vector} — "${u.meal.name}" [${u.meal.ingredients
          .map((i) => i.name)
          .join(", ")}]`,
      );
    }
  }

  const safe = safeMealsFor();
  let passed = 0;
  for (const s of safe) {
    safeTotal++;
    const v = screenMeal(s, profile.allergens);
    if (v.safe) {
      passed++;
      safePassed++;
    } else {
      falsePositives.push(
        `${profile.name}: FALSE POSITIVE — "${s.name}" flagged for ${v.hits[0]?.allergen}`,
      );
    }
  }

  console.log(
    `  ${pad(profile.name, 34)} ${pad(`${caught}/${unsafe.length}`, 16)} ${passed}/${safe.length}`,
  );
}

const catchRate = unsafeTotal ? (unsafeCaught / unsafeTotal) * 100 : 100;
const specificity = safeTotal ? (safePassed / safeTotal) * 100 : 100;

if (misses.length) {
  console.log("\n  ⚠ UNSAFE MEALS THAT SLIPPED THROUGH:");
  for (const m of misses) console.log(`    ✗ ${m}`);
}
if (falsePositives.length) {
  console.log("\n  Note — safe meals flagged (UX cost, not a safety miss):");
  for (const f of falsePositives) console.log(`    · ${f}`);
}

console.log("\n────────────────────────────────────────────────────────────");
console.log(
  `  Meals evaluated: ${unsafeTotal + safeTotal}  (${unsafeTotal} unsafe, ${safeTotal} safe) across ${PROFILES.length} allergy profiles`,
);
console.log(
  `  CATCH RATE  (unsafe meals blocked): ${unsafeCaught}/${unsafeTotal} = ${catchRate.toFixed(1)}%`,
);
console.log(
  `  SPECIFICITY (safe meals allowed):   ${safePassed}/${safeTotal} = ${specificity.toFixed(1)}%`,
);
console.log("────────────────────────────────────────────────────────────");
console.log(
  catchRate === 100
    ? "  ✓ PASS — every unsafe meal was blocked. No unsafe meal can reach a user.\n"
    : "  ✗ FAIL — at least one unsafe meal was not blocked (see above).\n",
);

if (unsafeCaught < unsafeTotal) process.exit(1);
