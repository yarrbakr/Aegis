import type { MealWithIngredients } from "@/lib/types";
import type { MealType } from "@/lib/validation";
import { usdApprox } from "@/lib/format";

const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
};

// One meal in the weekly grid. Pure display — the data was validated + saved by
// the generate route. (The Phase 3 "✓ allergen-safe" badge lands here.)
export function MealCard({ meal }: { meal: MealWithIngredients }) {
  const allergens = Array.from(
    new Set(meal.ingredients.flatMap((i) => i.allergen_tags ?? [])),
  ).sort();

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#6B7280]">
          {MEAL_EMOJI[meal.meal_type]} {meal.meal_type}
        </span>
        {meal.calories ? (
          <span className="font-mono text-[11px] text-[#6B7280]">
            {meal.calories} kcal
          </span>
        ) : null}
      </div>

      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-[#1F2933]">
        {meal.name}
      </h3>
      {meal.description ? (
        <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
          {meal.description}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-[#6B7280]">
        {meal.cost != null ? <span>{usdApprox(meal.cost)}</span> : null}
        <span>
          P{meal.protein_g ?? 0} · C{meal.carbs_g ?? 0} · F{meal.fat_g ?? 0}
        </span>
      </div>

      {allergens.length ? (
        <div className="mt-3 border-t border-[#F1F3F5] pt-2 text-[11px] text-[#6B7280]">
          <span className="uppercase tracking-wide text-[10px]">contains: </span>
          <span className="capitalize">{allergens.join(", ")}</span>
        </div>
      ) : (
        <div className="mt-3 border-t border-[#F1F3F5] pt-2 text-[11px] text-[#6B7280]">
          no common allergens tagged
        </div>
      )}
    </div>
  );
}
