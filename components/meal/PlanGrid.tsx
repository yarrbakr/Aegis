import type { MealWithIngredients } from "@/lib/types";
import { DAY_NAMES, MEAL_TYPES, type MealType } from "@/lib/validation";
import { MealCard } from "./MealCard";

// The 7-day grid: one column per day, each stacking breakfast/lunch/dinner.
// Horizontally scrollable so the page never scrolls sideways (Design.md §4).
export function PlanGrid({ meals }: { meals: MealWithIngredients[] }) {
  const byKey = new Map<string, MealWithIngredients>();
  for (const m of meals) byKey.set(`${m.day_of_week}-${m.meal_type}`, m);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-4">
        {DAY_NAMES.map((dayName, day) => (
          <div key={day} className="flex w-60 shrink-0 flex-col gap-3">
            <div className="rounded-lg bg-[#EAF1EC] px-3 py-2">
              <span className="text-sm font-semibold text-[#3B6149]">
                {dayName}
              </span>
            </div>
            {MEAL_TYPES.map((type: MealType) => {
              const meal = byKey.get(`${day}-${type}`);
              return meal ? (
                <MealCard key={type} meal={meal} />
              ) : (
                <div
                  key={type}
                  className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white/50 p-4 text-[11px] uppercase tracking-[0.05em] text-[#9CA3AF]"
                >
                  {type} — no meal
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
