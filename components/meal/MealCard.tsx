import type { MealWithIngredients } from "@/lib/types";
import type { MealType } from "@/lib/validation";
import { usdApprox } from "@/lib/format";

const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
};

// One meal in the weekly grid. Pure display — the data was validated, screened
// by the deterministic allergen guardrail, and saved by the generate route.
// Every meal shown here PASSED that guardrail, so it always carries the safe
// badge (Design.md: safe = green + ✓; a "blocked" state never appears on a
// served meal — only on the Safety Dashboard/logs).
export function MealCard({ meal }: { meal: MealWithIngredients }) {
  const allergens = Array.from(
    new Set(meal.ingredients.flatMap((i) => i.allergen_tags ?? [])),
  ).sort();

  const wasRegenerated = meal.safety_status === "blocked_regenerated";

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

      {/* Safety badge — every served meal has cleared the guardrail. */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF1EC] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#2F9E44]">
          <span aria-hidden>✓</span> allergen-safe
        </span>
        {wasRegenerated ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]"
            title="The first suggestion for this slot was blocked by the guardrail and regenerated."
          >
            <span aria-hidden>↻</span> regenerated for safety
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-[#1F2933]">
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
