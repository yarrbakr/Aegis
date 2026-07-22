import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanGrid } from "@/components/meal/PlanGrid";
import { GenerateButton } from "@/components/meal/GenerateButton";
import { BudgetMeter } from "@/components/charts/BudgetMeter";
import { BudgetBar } from "@/components/charts/BudgetBar";
import { NutritionDonut } from "@/components/charts/NutritionDonut";
import { usd, usdApprox } from "@/lib/format";
import { dailyCosts, weeklyMacros } from "@/lib/plan-stats";
import type { MealPlan, MealWithIngredients, Profile } from "@/lib/types";

// "Meal Plans" nav destination — the detailed weekly diet plan (the current
// week's latest plan) inside the app shell. Safety lives in the Security Console;
// here we focus on the food, budget, and nutrition.
export default async function MealPlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("weekly_budget, allergens")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as Pick<Profile, "weekly_budget" | "allergens"> | null;

  const { data: planRow } = await supabase
    .from("meal_plans")
    .select("id, created_at, total_cost, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const plan = planRow as Pick<
    MealPlan,
    "id" | "created_at" | "total_cost" | "status"
  > | null;

  let meals: MealWithIngredients[] = [];
  if (plan) {
    const { data: mealRows } = await supabase
      .from("meals")
      .select("*, ingredients(*)")
      .eq("plan_id", plan.id)
      .order("day_of_week")
      .order("meal_type");
    meals = (mealRows ?? []) as MealWithIngredients[];
  }

  const totalCost = plan?.total_cost ?? 0;
  const budget = profile?.weekly_budget ?? null;
  const overBudget = budget != null && totalCost > budget;
  const costs = dailyCosts(meals);
  const macros = weeklyMacros(meals);
  const dailyBudget = budget != null ? Number((budget / 7).toFixed(2)) : null;

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1F2933]">
            Your weekly plan
          </h1>
          {meals.length ? (
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
          ) : (
            <p className="mt-1 text-sm text-[#9CA3AF]">No plan generated yet.</p>
          )}
        </div>
        <GenerateButton
          variant={meals.length ? "secondary" : "primary"}
          label={meals.length ? "Regenerate week" : "Generate my week"}
        />
      </div>

      {meals.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#E7E8EC] bg-white p-10 text-center">
          <p className="text-sm text-[#6B7280]">
            Generate a full week of meals tailored to your diet, budget, and — above
            all — your allergies.
          </p>
          <div className="mt-4 flex justify-center">
            <GenerateButton variant="primary" label="Generate my week" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#E7E8EC] bg-white p-5">
              <h2 className="text-sm font-semibold text-[#1F2933]">Budget</h2>
              <div className="mt-3">
                <BudgetMeter total={totalCost} budget={budget} />
              </div>
            </div>
            <div className="rounded-2xl border border-[#E7E8EC] bg-white p-5">
              <h2 className="text-sm font-semibold text-[#1F2933]">Cost by day</h2>
              <div className="mt-2">
                <BudgetBar data={costs} dailyBudget={dailyBudget} />
              </div>
            </div>
            <div className="rounded-2xl border border-[#E7E8EC] bg-white p-5">
              <h2 className="text-sm font-semibold text-[#1F2933]">
                Weekly nutrition
              </h2>
              <div className="mt-2">
                <NutritionDonut
                  protein={macros.protein}
                  carbs={macros.carbs}
                  fat={macros.fat}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <PlanGrid meals={meals} />
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#E7E8EC] bg-white px-4 py-3 text-xs text-[#6B7280]">
            <span className="text-[#3B6149]">🛡️</span>
            Every meal above passed the deterministic allergen guardrail.{" "}
            <Link href="/security" className="font-medium text-[#4C7B61] hover:underline">
              See the Security Console →
            </Link>
          </div>
        </>
      )}

      <p className="mt-8 text-xs text-[#9CA3AF]">
        Costs and nutrition are AI estimates. Aegis filters declared allergens; it
        is not a medical device and does not give medical or nutritional advice.
      </p>
    </div>
  );
}
