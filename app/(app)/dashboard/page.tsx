import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { safeSnacks } from "@/lib/snacks";
import { DAY_NAMES, MEAL_TYPES } from "@/lib/validation";
import type { MealPlan, Profile } from "@/lib/types";

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type DashMeal = {
  day_of_week: number;
  meal_type: string;
  name: string;
  cost: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  safety_status: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileData as Profile | null;

  const needsOnboarding =
    !profile || (profile.allergens.length === 0 && profile.weekly_budget == null);
  if (needsOnboarding) redirect("/onboarding");

  const displayName = profile!.display_name?.trim() || "there";
  const allergens = profile!.allergens ?? [];

  const { data: planData } = await supabase
    .from("meal_plans")
    .select("id, created_at, total_cost, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestPlan = planData as Pick<MealPlan, "id"> | null;

  let meals: DashMeal[] = [];
  if (latestPlan) {
    const { data: mealData } = await supabase
      .from("meals")
      .select(
        "day_of_week, meal_type, name, cost, calories, protein_g, carbs_g, fat_g, safety_status",
      )
      .eq("plan_id", latestPlan.id);
    meals = (mealData ?? []) as DashMeal[];
  }
  const hasPlan = meals.length > 0;

  const totalCalories = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const macros = meals.reduce(
    (a, m) => ({
      protein: a.protein + (m.protein_g ?? 0),
      carbs: a.carbs + (m.carbs_g ?? 0),
      fat: a.fat + (m.fat_g ?? 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
  const spent = meals.reduce((s, m) => s + (m.cost ?? 0), 0);

  const perDay = new Array(7).fill(0);
  for (const m of meals) {
    if (m.day_of_week >= 0 && m.day_of_week <= 6)
      perDay[m.day_of_week] += m.calories ?? 0;
  }
  const calorieData = SHORT_DAYS.map((label, i) => ({
    label,
    calories: Math.round(perDay[i]),
  }));

  const served = meals.length;
  const regenerated = meals.filter(
    (m) => m.safety_status === "blocked_regenerated",
  ).length;

  const todayIdx = (new Date().getDay() + 6) % 7;
  const todaysMeals = MEAL_TYPES.map((type) => {
    const meal = meals.find((m) => m.day_of_week === todayIdx && m.meal_type === type);
    return { type, name: meal?.name ?? null };
  });

  const snacks = safeSnacks(allergens, 4);
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <DashboardView
      displayName={displayName}
      todayLabel={todayLabel}
      hasPlan={hasPlan}
      totalCalories={totalCalories}
      macros={macros}
      spent={spent}
      weeklyBudget={profile!.weekly_budget}
      calorieData={calorieData}
      served={served}
      regenerated={regenerated}
      todayName={DAY_NAMES[todayIdx]}
      todaysMeals={todaysMeals}
      snacks={snacks}
    />
  );
}
