"use client";

import { useState } from "react";
import type { MealWithIngredients } from "@/lib/types";
import { DAY_NAMES, MEAL_TYPES, type MealType } from "@/lib/validation";
import { MealCard } from "./MealCard";
import { NutritionDonut } from "@/components/charts/NutritionDonut";

// The weekly plan as day-tabs (Session 8). A row of day chips; picking one shows
// that day's nutrition donut (Session 10 — the donut now tracks the selected
// day and names it) plus its breakfast/lunch/dinner as roomy cards. Opens on
// today. Client-side only: the meals were already screened + saved server-side.
export function WeekView({ meals }: { meals: MealWithIngredients[] }) {
  const byKey = new Map<string, MealWithIngredients>();
  for (const m of meals) byKey.set(`${m.day_of_week}-${m.meal_type}`, m);
  const daysWithMeals = new Set(meals.map((m) => m.day_of_week));

  const todayIdx = (new Date().getDay() + 6) % 7;
  const initial = daysWithMeals.has(todayIdx) ? todayIdx : meals[0]?.day_of_week ?? 0;
  const [day, setDay] = useState(initial);

  const dayMeals = MEAL_TYPES.map((type) => byKey.get(`${day}-${type}`));
  const macros = dayMeals.reduce(
    (a, m) => ({
      protein: a.protein + (m?.protein_g ?? 0),
      carbs: a.carbs + (m?.carbs_g ?? 0),
      fat: a.fat + (m?.fat_g ?? 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <div>
      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        {DAY_NAMES.map((name, i) => {
          const active = i === day;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setDay(i)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[#4C7B61] text-white shadow-sm"
                  : "border border-[#E7E8EC] bg-white text-[#6B7280] hover:border-[#D8E2DB] hover:text-[#1F2933]"
              }`}
            >
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{name.slice(0, 3)}</span>
              {i === todayIdx ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] ${
                    active ? "bg-white/20 text-white" : "bg-[#EAF1EC] text-[#3B6149]"
                  }`}
                >
                  today
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="font-display text-lg font-bold text-[#1F2933]">
          {DAY_NAMES[day]}
        </h3>
        {day === todayIdx ? (
          <span className="text-xs font-medium text-[#3B6149]">· today</span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        {/* Nutrition for the selected day */}
        <div className="rounded-2xl border border-[#E7E8EC] bg-white p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[#EEF0F3] pb-3">
            <h4 className="font-display text-base font-bold text-[#1F2933]">
              Nutrition
            </h4>
            <span className="text-xs font-medium text-[#3B6149]">
              {DAY_NAMES[day]}
            </span>
          </div>
          <NutritionDonut protein={macros.protein} carbs={macros.carbs} fat={macros.fat} />
        </div>

        {/* The day's meals */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {MEAL_TYPES.map((type: MealType) => {
            const meal = byKey.get(`${day}-${type}`);
            return meal ? (
              <MealCard key={type} meal={meal} />
            ) : (
              <div
                key={type}
                className="flex items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white/50 p-8 text-[11px] uppercase tracking-[0.05em] text-[#9CA3AF]"
              >
                {type} — no meal
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
