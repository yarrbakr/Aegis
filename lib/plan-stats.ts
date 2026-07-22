// Aggregations for the Phase 4 visualizations. Pure functions, computed on the
// server and handed to the (client) chart components as plain data.

import type { MealWithIngredients } from "@/lib/types";

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type DailyCost = { day: string; cost: number };
export type Macros = { protein: number; carbs: number; fat: number };

/** Total cost per day of the week, in order Mon..Sun. */
export function dailyCosts(meals: MealWithIngredients[]): DailyCost[] {
  const sums = new Array(7).fill(0);
  for (const m of meals) {
    if (m.day_of_week >= 0 && m.day_of_week <= 6) sums[m.day_of_week] += m.cost ?? 0;
  }
  return SHORT_DAYS.map((day, i) => ({ day, cost: Number(sums[i].toFixed(2)) }));
}

/** Total macronutrient grams across the week. */
export function weeklyMacros(meals: MealWithIngredients[]): Macros {
  return meals.reduce<Macros>(
    (acc, m) => ({
      protein: acc.protein + (m.protein_g ?? 0),
      carbs: acc.carbs + (m.carbs_g ?? 0),
      fat: acc.fat + (m.fat_g ?? 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
}

export type SafetyEventRow = {
  event_type: string;
  allergen: string | null;
  detail: string;
  created_at: string;
};

export type SafetyStats = {
  passed: number; // meals cleared by the guardrail
  blocked: number; // block + regenerate actions
  injections: number; // injection patterns caught
};

/** Roll safety_events into headline counts for the Safety Dashboard. */
export function safetyStats(events: SafetyEventRow[]): SafetyStats {
  let passed = 0;
  let blocked = 0;
  let injections = 0;
  for (const e of events) {
    if (e.event_type === "meal_passed") passed++;
    else if (e.event_type === "meal_blocked") blocked++;
    else if (e.event_type === "injection_detected") injections++;
  }
  return { passed, blocked, injections };
}
