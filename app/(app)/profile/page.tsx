import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usd } from "@/lib/format";
import type { Profile } from "@/lib/types";

// "Profile" nav destination — the user's preferences at a glance, with an edit
// link into the preferences form. Shows declared allergens (safety-enforced) and
// taste preferences (cuisines / dislikes — best-effort hints, not enforced).
export default async function ProfilePage() {
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
  if (!profile) redirect("/onboarding");

  // Defensive: taste columns may be absent until the migration runs.
  const favoriteCuisines = profile.favorite_cuisines ?? [];
  const dislikedFoods = profile.disliked_foods ?? [];

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Name", value: profile.display_name || "—" },
    { label: "Email", value: user.email },
    {
      label: "Diet",
      value: <span className="capitalize">{profile.diet_type}</span>,
    },
    { label: "Household", value: `${profile.num_people} ${profile.num_people === 1 ? "person" : "people"}` },
    {
      label: "Weekly budget",
      value: profile.weekly_budget != null ? usd(profile.weekly_budget) : "—",
    },
  ];

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1F2933]">
            Profile
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Aegis uses these to plan your meals — and to block anything with your
            allergens.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="rounded-[10px] bg-[#4C7B61] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B6149]"
        >
          Edit preferences
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E7E8EC] bg-white p-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label}>
              <dt className="text-xs font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">
                {r.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#1F2933]">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border-t border-[#F1F2F4] pt-4">
          <dt className="text-xs font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">
            Allergens watched
          </dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {profile.allergens.length ? (
              profile.allergens.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-[#FCE8EF] px-2.5 py-0.5 text-xs font-medium capitalize text-[#C2255C]"
                >
                  {a}
                </span>
              ))
            ) : (
              <span className="text-sm text-[#6B7280]">none declared</span>
            )}
          </dd>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#D8E2DB] bg-[#F6FAF7] p-5">
        <div className="flex items-center gap-2">
          <span className="text-[#3B6149]">🍽️</span>
          <h2 className="text-sm font-semibold text-[#1F2933]">
            Taste preferences
          </h2>
        </div>
        <p className="mt-2 text-sm text-[#6B7280]">
          Used to tailor your plan. Best-effort taste hints — only your declared{" "}
          <strong>allergens</strong> are enforced by the safety guardrail.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
              Favorite cuisines
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {favoriteCuisines.length ? (
                favoriteCuisines.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-[#EAF1EC] px-2.5 py-0.5 text-xs font-medium capitalize text-[#3B6149]"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#9CA3AF]">no preference set</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
              Foods to skip by choice
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dislikedFoods.length ? (
                dislikedFoods.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-[#FCEFE2] px-2.5 py-0.5 text-xs font-medium capitalize text-[#B45309]"
                  >
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#9CA3AF]">none set</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-[#9CA3AF]">
        Aegis filters your declared allergens; it is not a medical device and does
        not give medical or nutritional advice.
      </p>
    </div>
  );
}
