import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GenerateButton } from "@/components/meal/GenerateButton";
import { usd, usdApprox } from "@/lib/format";
import type { MealPlan, Profile } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = data as Profile | null;

  const needsOnboarding =
    !profile || (profile.allergens.length === 0 && profile.weekly_budget == null);

  // Most recent plan, if any — powers the "view / regenerate" section.
  const { data: planData } = await supabase
    .from("meal_plans")
    .select("id, created_at, total_cost, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestPlan = planData as Pick<
    MealPlan,
    "id" | "created_at" | "total_cost" | "status"
  > | null;

  return (
    <main className="min-h-dvh bg-[#F8F9FA] px-4 py-10 text-[#1F2933]">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="text-xl font-bold">🛡️ Aegis</div>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
              Sign out
            </button>
          </form>
        </header>

        <h1 className="text-2xl font-bold">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">{user.email}</p>

        {needsOnboarding ? (
          <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="font-semibold">Set up your preferences</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Tell us your diet, allergies, and budget so Aegis can plan safe meals for you.
            </p>
            <Link
              href="/onboarding"
              className="mt-4 inline-block rounded-lg bg-[#FF6B6B] px-4 py-2 font-semibold text-white hover:bg-[#FA5252]"
            >
              Set up preferences →
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="font-semibold">Your preferences</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#6B7280]">Diet</dt>
                <dd className="font-medium capitalize">{profile!.diet_type}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">People</dt>
                <dd className="font-medium">{profile!.num_people}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Weekly budget</dt>
                <dd className="font-medium">
                  {profile!.weekly_budget != null
                    ? usd(profile!.weekly_budget)
                    : "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[#6B7280]">Allergens</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {profile!.allergens.length ? (
                    profile!.allergens.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-[#EAF1EC] px-2.5 py-0.5 text-xs font-medium capitalize text-[#3B6149]"
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#6B7280]">none declared</span>
                  )}
                </dd>
              </div>
            </dl>
            <Link
              href="/onboarding"
              className="mt-4 inline-block text-sm font-medium text-[#4C7B61] hover:underline"
            >
              Edit preferences
            </Link>
          </div>
        )}

        {!needsOnboarding ? (
          <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="font-semibold">Your meal plan</h2>
            {latestPlan ? (
              <>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Latest plan generated{" "}
                  {new Date(latestPlan.created_at).toLocaleDateString()}
                  {latestPlan.total_cost != null ? (
                    <>
                      {" "}
                      · total{" "}
                      <span className="font-mono">
                        {usdApprox(latestPlan.total_cost)}
                      </span>
                    </>
                  ) : null}
                  .
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/plan/${latestPlan.id}`}
                    className="inline-block rounded-[10px] bg-[#FF6B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FA5252]"
                  >
                    View this week →
                  </Link>
                  <GenerateButton variant="secondary" label="Generate a new week" />
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Generate a full week of meals tailored to your diet, budget,
                  and — above all — your allergies.
                </p>
                <div className="mt-4">
                  <GenerateButton variant="primary" label="Generate my week" />
                </div>
              </>
            )}
          </div>
        ) : null}

        <p className="mt-8 text-xs text-[#6B7280]">
          Aegis filters your declared allergens; it is not a medical device and
          does not give medical or nutritional advice.
        </p>
      </div>
    </main>
  );
}
