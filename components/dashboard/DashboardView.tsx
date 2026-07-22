import Link from "next/link";
import { GenerateButton } from "@/components/meal/GenerateButton";
import { CaloriesLine } from "@/components/charts/CaloriesLine";
import { NutritionDonut } from "@/components/charts/NutritionDonut";
import { usd } from "@/lib/format";
import type { Snack } from "@/lib/snacks";

// Presentational dashboard (Design.md D11). Pure — all data is computed by the
// page (or the design-preview) and passed in. Keeping data-loading out of here
// makes the view reusable and lets us render it with sample data for design QA.

export type DashboardViewProps = {
  displayName: string;
  todayLabel: string;
  hasPlan: boolean;
  totalCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  spent: number;
  weeklyBudget: number | null;
  calorieData: { label: string; calories: number }[];
  served: number;
  regenerated: number;
  todayName: string;
  todaysMeals: { type: string; name: string | null }[];
  snacks: Snack[];
};

function StatCard({
  tint,
  iconTint,
  icon,
  label,
  value,
  sub,
}: {
  tint: string;
  iconTint: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`rounded-2xl ${tint} p-4`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTint}`}>
        {icon}
      </span>
      <div className="mt-3 font-display text-2xl font-bold text-[#1F2933]">{value}</div>
      <div className="text-xs font-medium text-[#6B7280]">{label}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-[#9CA3AF]">{sub}</div> : null}
    </div>
  );
}

export function DashboardView({
  displayName,
  todayLabel,
  hasPlan,
  totalCalories,
  macros,
  spent,
  weeklyBudget,
  calorieData,
  served,
  regenerated,
  todayName,
  todaysMeals,
  snacks,
}: DashboardViewProps) {
  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1F2933]">
            Welcome back, {displayName}!
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">{todayLabel}</p>
        </div>
        <GenerateButton
          variant="primary"
          label={hasPlan ? "Create new plan" : "Create my first plan"}
        />
      </div>

      {/* Safety strip — keeps the shield visible on the landing page */}
      <Link
        href="/security"
        className="mt-5 flex items-center gap-3 rounded-2xl border border-[#E7E8EC] bg-white px-4 py-3 transition hover:border-[#D8E2DB]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF1EC] text-[#3B6149]">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#1F2933]">
            Deterministic guardrail active
          </div>
          <div className="truncate text-xs text-[#6B7280]">
            {hasPlan
              ? `${served} meals screened this week — all allergen-safe${
                  regenerated > 0
                    ? ` · ${regenerated} unsafe suggestion${regenerated > 1 ? "s" : ""} caught & replaced`
                    : ""
                }.`
              : "Every meal Aegis generates is screened against your allergens before you see it."}
          </div>
        </div>
        <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-[#4C7B61] sm:flex">
          Security Console
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </Link>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          tint="bg-[#ECEBFB]"
          iconTint="bg-white/70 text-[#6D5AE6]"
          icon={<span className="text-base">🔥</span>}
          label="Calories · this week"
          value={hasPlan ? `${totalCalories.toLocaleString()}` : "—"}
          sub={hasPlan ? `~${Math.round(totalCalories / 7).toLocaleString()} kcal/day` : "no plan yet"}
        />
        <StatCard
          tint="bg-[#FCEFE2]"
          iconTint="bg-white/70 text-[#E8853A]"
          icon={<span className="text-base">🍞</span>}
          label="Carbs · this week"
          value={hasPlan ? `${macros.carbs} g` : "—"}
          sub={hasPlan ? `${macros.protein} g protein` : undefined}
        />
        <StatCard
          tint="bg-[#E3F3EA]"
          iconTint="bg-white/70 text-[#2F9E44]"
          icon={<span className="text-base">💪</span>}
          label="Protein · this week"
          value={hasPlan ? `${macros.protein} g` : "—"}
          sub={hasPlan ? `${macros.fat} g fat` : undefined}
        />
        <StatCard
          tint="bg-[#FCE8EF]"
          iconTint="bg-white/70 text-[#E8578A]"
          icon={<span className="text-base">💵</span>}
          label="Weekly budget"
          value={weeklyBudget != null ? usd(weeklyBudget) : "—"}
          sub={hasPlan ? `spent ~${usd(spent)}` : "USD"}
        />
      </div>

      {/* Charts */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#E7E8EC] bg-white p-5 lg:col-span-2">
          <CaloriesLine data={calorieData} />
        </div>
        <div className="rounded-2xl border border-[#E7E8EC] bg-white p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[#EEF0F3] pb-3">
            <h3 className="font-display text-lg font-bold text-[#1F2933]">Report</h3>
            <span className="text-xs text-[#9CA3AF]">this week</span>
          </div>
          <NutritionDonut protein={macros.protein} carbs={macros.carbs} fat={macros.fat} />
        </div>
      </div>

      {/* Meal for today + Snacks */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E7E8EC] bg-white p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[#EEF0F3] pb-3">
            <h3 className="font-display text-lg font-bold text-[#1F2933]">
              Meal for today
            </h3>
            <span className="text-xs text-[#9CA3AF]">{hasPlan ? todayName : ""}</span>
          </div>
          {hasPlan ? (
            <ul className="divide-y divide-[#F1F2F4]">
              {todaysMeals.map(({ type, name }) => (
                <li key={type} className="flex items-center gap-3 py-2.5">
                  <span className="w-20 shrink-0 text-xs font-medium capitalize text-[#9CA3AF]">
                    {type}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1F2933]">
                    {name ?? "—"}
                  </span>
                  {name ? (
                    <span className="shrink-0 rounded-full bg-[#EAF1EC] px-2 py-0.5 text-[10px] font-semibold text-[#3B6149]">
                      ✓ safe
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#6B7280]">
                No plan yet — generate a week to see today&apos;s meals.
              </p>
              <div className="mt-3 flex justify-center">
                <GenerateButton variant="secondary" label="Generate my week" />
              </div>
            </div>
          )}
          {hasPlan ? (
            <Link
              href="/meal-plans"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#4C7B61] hover:underline"
            >
              See the full week →
            </Link>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[#E7E8EC] bg-white p-5">
          <div className="mb-3 flex items-center justify-between border-b border-[#EEF0F3] pb-3">
            <h3 className="font-display text-lg font-bold text-[#1F2933]">
              Snack recommendations
            </h3>
            <span className="rounded-full bg-[#EAF1EC] px-2 py-0.5 text-[10px] font-semibold text-[#3B6149]">
              guardrail-screened
            </span>
          </div>
          <p className="mb-3 text-xs text-[#9CA3AF]">
            Only snacks safe for your allergens are shown.
          </p>
          {snacks.length ? (
            <ul className="space-y-2">
              {snacks.map((s) => (
                <li
                  key={s.name}
                  className="flex items-center gap-3 rounded-xl border border-[#F1F2F4] px-3 py-2"
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#1F2933]">
                      {s.name}
                    </span>
                    <span className="block text-[11px] text-[#9CA3AF]">{s.note}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-[#6B7280]">
                    {s.kcal} kcal
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-[#6B7280]">
              No preset snacks clear your current allergens — your meal plan is still
              fully screened and safe.
            </p>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-[#9CA3AF]">
        Aegis filters your declared allergens; it is not a medical device and does not
        give medical or nutritional advice.
      </p>
    </div>
  );
}
