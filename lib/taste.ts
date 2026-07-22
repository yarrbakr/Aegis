// Best-effort TASTE matching — deterministic, but explicitly NOT a safety check.
// Only the allergen guardrail (lib/guardrails/allergen.ts) makes safety
// decisions. This just spots a user's disliked foods in a meal's text so we can
// (a) hide disliked snacks and (b) re-roll disliked meals. A crude substring
// match on purpose: forgiving on plurals ("mushroom" ⊂ "mushrooms") is exactly
// what a taste filter wants, and an over-eager match only costs a harmless
// re-roll — never a wrong safety verdict.

export type TasteScreenable = {
  name: string;
  description?: string;
  ingredients: { name: string }[];
};

/** First disliked term found in the item's name/description/ingredients, or null. */
export function findDislikedTerm(
  item: TasteScreenable,
  dislikes: string[],
): string | null {
  if (!dislikes.length) return null;
  const hay = [
    item.name,
    item.description ?? "",
    ...item.ingredients.map((i) => i.name),
  ]
    .join(" ")
    .toLowerCase();
  for (const d of dislikes) {
    const term = d.trim().toLowerCase();
    if (term.length > 0 && hay.includes(term)) return term;
  }
  return null;
}
