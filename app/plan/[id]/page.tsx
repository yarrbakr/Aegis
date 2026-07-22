import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanGrid } from "@/components/meal/PlanGrid";
import { GenerateButton } from "@/components/meal/GenerateButton";
import { usd, usdApprox } from "@/lib/format";
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

  const totalCost = plan.total_cost ?? 0;
  const budget = profile?.weekly_budget ?? null;
  const overBudget = budget != null && totalCost > budget;

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
                  of{" "}
                  <span className="font-mono">{usd(budget)}</span> budget
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
          <PlanGrid meals={meals} />
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
