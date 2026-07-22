// ─────────────────────────────────────────────────────────────────────────────
// Aegis OUTPUT GUARDRAIL — the deterministic allergen check (the product).
//
// This is TypeScript, not an LLM "is this safe?" prompt. A safety company never
// lets the model grade its own output (Rules.md §5.1, D5). Given a meal and the
// user's declared allergens, this decides safe / unsafe — deterministically and
// explainably.
//
// DEFENSE IN DEPTH — we never trust the model's own `allergen_tags` alone (the
// same model chose the ingredient AND tagged it; a miss there would slip
// through). So we scan, in order:
//   1. each ingredient's allergen_tags   (highest precision — model-provided)
//   2. each ingredient's name + quantity (catches an untagged allergen)
//   3. the meal name + description        (last-resort catch)
// against a synonym map, so declaring "milk" also catches cheese/whey/casein and
// declaring "shellfish" catches shrimp/crab/prawn — words the model may not tag.
//
// False positives here are cheap (the meal is regenerated); a false negative is
// the one thing we must never ship. When unsure, we flag.
// ─────────────────────────────────────────────────────────────────────────────

// Minimal shape the guardrail needs — satisfied by both the freshly generated
// meal (GeneratedMeal) and a persisted one (MealWithIngredients).
export type ScreenableIngredient = {
  name: string;
  quantity?: string | null;
  allergen_tags?: string[] | null;
};
export type ScreenableMeal = {
  name: string;
  description?: string | null;
  meal_type?: string;
  day_of_week?: number;
  ingredients: ScreenableIngredient[];
};

export type AllergenHit = {
  allergen: string; // the user's declared allergen that matched
  matched: string; // the specific word/phrase that triggered it
  source: "tag" | "ingredient" | "meal";
  ingredient?: string; // the offending ingredient (for tag/ingredient hits)
};

export type MealVerdict = {
  safe: boolean;
  hits: AllergenHit[]; // one per matched allergen; empty when safe
};

// Canonical allergen → words/phrases that imply it. Keyed by the SINGULAR form
// (see depluralize) so it works whether the user declared "milk" or "eggs".
// Multi-word entries (e.g. "peanut butter") are matched as phrases; single words
// are matched against singularized tokens.
const SYNONYMS: Record<string, string[]> = {
  peanut: ["groundnut", "arachis", "peanut butter", "satay"],
  "tree nut": [
    "almond",
    "cashew",
    "walnut",
    "pecan",
    "pistachio",
    "hazelnut",
    "macadamia",
    "praline",
    "marzipan",
    "nutella",
    "brazil nut",
    "pine nut",
  ],
  milk: [
    "dairy",
    "cheese",
    "butter",
    "cream",
    "yogurt",
    "yoghurt",
    "casein",
    "whey",
    "ghee",
    "custard",
    "buttermilk",
    "paneer",
  ],
  egg: ["egg", "mayonnaise", "mayo", "albumin", "meringue", "omelette", "omelet"],
  fish: [
    "salmon",
    "tuna",
    "cod",
    "tilapia",
    "anchovy",
    "sardine",
    "haddock",
    "trout",
    "mackerel",
    "halibut",
  ],
  shellfish: [
    "shrimp",
    "prawn",
    "crab",
    "lobster",
    "clam",
    "mussel",
    "oyster",
    "scallop",
    "crayfish",
    "squid",
    "calamari",
    "crustacean",
  ],
  soy: ["soya", "soybean", "tofu", "edamame", "miso", "tempeh", "soy sauce"],
  wheat: [
    "flour",
    "bread",
    "pasta",
    "couscous",
    "bulgur",
    "semolina",
    "cracker",
    "breadcrumb",
    "tortilla",
    "noodle",
  ],
  gluten: [
    "wheat",
    "barley",
    "rye",
    "malt",
    "bread",
    "pasta",
    "couscous",
    "bulgur",
    "semolina",
    "seitan",
    "noodle",
    "flour",
  ],
  sesame: ["tahini", "hummus", "zaatar", "za'atar"],
};

/** Remove a trailing plural "s" from a whole string ("eggs" → "egg"). */
function depluralize(s: string): string {
  const t = s.toLowerCase().trim();
  return t.endsWith("s") && t.length > 3 ? t.slice(0, -1) : t;
}

/** Singularize a single token for whole-word comparison. */
function singular(word: string): string {
  return word.endsWith("s") && word.length > 3 ? word.slice(0, -1) : word;
}

/** Split into singularized alpha tokens. */
function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean)
      .map(singular),
  );
}

// Dairy-free "butters" and plant milks — for a MILK-allergic user these contain
// "butter"/"milk" but no dairy, so we neutralize them before the name scan so
// they don't nuisance-trigger. (Only applied when screening for milk.)
const NONDAIRY_BUTTER =
  /\b(peanut|almond|cashew|hazelnut|walnut|pecan|sunflower|pumpkin|seed|cocoa|shea|coconut|apple)\s+butter\b/g;
const PLANT_MILK =
  /\b(almond|soy|soya|oat|rice|coconut|cashew|hemp|pea|hazelnut)\s+milk\b/g;
// Gluten-free flours — contain "flour" but no gluten/wheat.
const GF_FLOUR =
  /\b(almond|coconut|rice|corn|chickpea|gram|tapioca|potato|cassava|buckwheat)\s+flour\b/g;

/**
 * Build a lowercase haystack for one allergen. For NAME scans we strip the
 * allergen-specific false-positive compounds; for TAG scans we strip nothing
 * (tags are deliberate allergen words we want to catch).
 */
function haystackFor(text: string, allergenKey: string, nameScan: boolean): string {
  let s = ` ${text.toLowerCase()} `;
  if (!nameScan) return s;
  if (allergenKey === "milk") {
    s = s.replace(NONDAIRY_BUTTER, " ").replace(PLANT_MILK, " ");
  }
  if (allergenKey === "gluten" || allergenKey === "wheat") {
    s = s.replace(GF_FLOUR, " ");
  }
  return s;
}

type Needles = { words: Set<string>; phrases: string[] };

function buildNeedles(allergen: string): Needles {
  const words = new Set<string>();
  const phrases: string[] = [];
  const add = (raw: string) => {
    const x = raw.trim().toLowerCase();
    if (!x) return;
    if (x.includes(" ")) phrases.push(x);
    else words.add(singular(x));
  };
  add(allergen); // the declared word itself (e.g. a custom allergen like "kiwi")
  const syn = SYNONYMS[depluralize(allergen)] ?? SYNONYMS[allergen.toLowerCase()];
  if (syn) syn.forEach(add);
  return { words, phrases };
}

/** Return the first needle found in the haystack, or null. */
function matchNeedles(hay: string, needles: Needles): string | null {
  for (const p of needles.phrases) {
    if (hay.includes(p)) return p;
  }
  const toks = tokens(hay);
  for (const w of needles.words) {
    if (toks.has(w)) return w;
  }
  return null;
}

/** Find the first place `allergen` shows up in `meal`, or null (tags→names→meal). */
function findHit(
  meal: ScreenableMeal,
  allergen: string,
  needles: Needles,
): Omit<AllergenHit, "allergen"> | null {
  const key = depluralize(allergen);

  // 1) allergen_tags (model-provided — highest precision)
  for (const ing of meal.ingredients) {
    for (const tag of ing.allergen_tags ?? []) {
      const m = matchNeedles(haystackFor(tag, key, false), needles);
      if (m) return { matched: m, source: "tag", ingredient: ing.name };
    }
  }
  // 2) ingredient name + quantity
  for (const ing of meal.ingredients) {
    const hay = haystackFor(`${ing.name} ${ing.quantity ?? ""}`, key, true);
    const m = matchNeedles(hay, needles);
    if (m) return { matched: m, source: "ingredient", ingredient: ing.name };
  }
  // 3) meal name + description
  const hay = haystackFor(`${meal.name} ${meal.description ?? ""}`, key, true);
  const m = matchNeedles(hay, needles);
  if (m) return { matched: m, source: "meal" };

  return null;
}

/**
 * Screen a single meal against a user's declared allergens.
 * Deterministic and pure — this exact function is what the Phase 5 eval tests.
 */
export function screenMeal(
  meal: ScreenableMeal,
  declaredAllergens: string[],
): MealVerdict {
  const declared = Array.from(
    new Set(
      declaredAllergens.map((a) => a.toLowerCase().trim()).filter(Boolean),
    ),
  );

  const hits: AllergenHit[] = [];
  for (const allergen of declared) {
    const hit = findHit(meal, allergen, buildNeedles(allergen));
    if (hit) hits.push({ allergen, ...hit });
  }
  return { safe: hits.length === 0, hits };
}

/** Convenience: true if the meal contains none of the declared allergens. */
export function isMealSafe(
  meal: ScreenableMeal,
  declaredAllergens: string[],
): boolean {
  return screenMeal(meal, declaredAllergens).safe;
}

/** Screen a whole plan; returns a verdict per meal (same order). */
export function screenPlan(
  meals: ScreenableMeal[],
  declaredAllergens: string[],
): MealVerdict[] {
  return meals.map((m) => screenMeal(m, declaredAllergens));
}

/** Human-readable one-liner for a hit — used in safety_events.detail + logs. */
export function describeHit(hit: AllergenHit): string {
  const where =
    hit.source === "tag"
      ? `tagged on "${hit.ingredient}"`
      : hit.source === "ingredient"
        ? `in ingredient "${hit.ingredient}"`
        : "in the meal name/description";
  return `contains "${hit.allergen}" (matched "${hit.matched}" ${where})`;
}
