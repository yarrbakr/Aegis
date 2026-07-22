import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanGrid } from "@/components/meal/PlanGrid";
import { GenerateButton } from "@/components/meal/GenerateButton";
import { SafetyDashboard } from "@/components/charts/SafetyDashboard";
import { BudgetBar } from "@/components/charts/BudgetBar";
import { BudgetMeter } from "@/components/charts/BudgetMeter";
import { NutritionDonut } from "@/components/charts/NutritionDonut";
import { usd, usdApprox } from "@/lib/format";
import {
  dailyCosts,
  weeklyMacros,
  type SafetyEventRow,
} from "@/lib/plan-stats";
import type { MealPlan, MealWithIngredients, Profile } from "@/lib/types";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS guarantees this only returns the plan if it belongs to the user.
  const { data: planRow } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const plan = planRow as MealPlan | null;
  if (!plan) notFound();

  // Meals with their ingredients embedded via the FK relationship.
  const { data: mealRows } = await supabase
    .from("meals")
    .select("*, ingredients(*)")
    .eq("plan_id", id)
    .order("day_of_week")
    .order("meal_type");
  const meals = (mealRows ?? []) as MealWithIngredients[];

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("weekly_budget, allergens")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as Pick<Profile, "weekly_budget" | "allergens"> | null;

  // This plan's safety audit trail — powers the Safety Dashboard.
  const { data: eventRows } = await supabase
    .from("safety_events")
    .select("event_type, allergen, detail, created_at")
    .eq("plan_id", id)
    .order("created_at", { ascending: false });
  const events = (eventRows ?? []) as SafetyEventRow[];

  const totalCost = plan.total_cost ?? 0;
  const budget = profile?.weekly_budget ?? null;
  const overBudget = budget != null && totalCost > budget;
  const allergens = profile?.allergens ?? [];

  // Metrics from the authoritative meals table (safety_status), so "served" and
  // "regenerated" can never contradict each other. Injections come from the log.
  const served = meals.length;
  const regenerated = meals.filter(
    (m) => m.safety_status === "blocked_regenerated",
  ).length;
  const injections = events.filter(
    (e) => e.event_type === "injection_detected",
  ).length;
  const safetySubtitle =
    regenerated > 0
      ? `All ${served} meals below are allergen-safe. ${regenerated} unsafe suggestion${
          regenerated === 1 ? " was" : "s were"
        } caught and regenerated before serving.`
      : `All ${served} meals below passed a deterministic allergen check before they were saved.`;

  const costs = dailyCosts(meals);
  const macros = weeklyMacros(meals);
  const dailyBudget = budget != null ? Number((budget / 7).toFixed(2)) : null;

  return (
    <main className="min-h-dvh bg-[#F8F9FA] px-4 py-8 text-[#1F2933]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold">
            🛡️ Aegis
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            ← Dashboard
          </Link>
        </header>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your week</h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              {meals.length} meals ·{" "}
              <span className="font-mono">total {usdApprox(totalCost)}</span>
              {budget != null ? (
                <>
                  {" "}
                  of <span className="font-mono">{usd(budget)}</span> budget
                  {overBudget ? (
                    <span className="ml-1 text-[#E03131]">(over budget)</span>
                  ) : (
                    <span className="ml-1 text-[#2F9E44]">(within budget)</span>
                  )}
                </>
              ) : null}
            </p>
          </div>
          <GenerateButton variant="secondary" label="Regenerate week" />
        </div>

        {meals.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B7280]">
            This plan has no meals. Try generating a new one.
          </div>
        ) : (
          <>
            {/* Safety story first — the guardrail is the product. */}
            <div className="mb-6">
              <SafetyDashboard
                title="This plan was screened for your allergens"
                subtitle={safetySubtitle}
                served={served}
                regenerated={regenerated}
                injections={injections}
                allergensWatched={allergens}
                events={events}
              />
            </div>

            {/* Budget + nutrition insights. */}
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                <h2 className="text-sm font-semibold">Budget</h2>
                <div className="mt-3">
                  <BudgetMeter total={totalCost} budget={budget} />
                </div>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 lg:col-span-1">
                <h2 className="text-sm font-semibold">Cost by day</h2>
                <div className="mt-2">
                  <BudgetBar data={costs} dailyBudget={dailyBudget} />
                </div>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                <h2 className="text-sm font-semibold">Weekly nutrition</h2>
                <div className="mt-2">
                  <NutritionDonut
                    protein={macros.protein}
                    carbs={macros.carbs}
                    fat={macros.fat}
                  />
                </div>
              </div>
            </div>

            <PlanGrid meals={meals} />
          </>
        )}

        <p className="mt-8 text-xs text-[#6B7280]">
          Costs and nutrition are AI estimates. Aegis filters declared allergens;
          it is not a medical device and does not give medical or nutritional
          advice.
        </p>
      </div>
    </main>
  );
}
