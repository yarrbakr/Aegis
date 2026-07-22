import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { COMMON_ALLERGENS, COMMON_CUISINES, DIET_TYPES } from "@/lib/validation";
import { saveProfile } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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

  const common = new Set<string>(COMMON_ALLERGENS as readonly string[]);
  const selected = new Set(profile?.allergens ?? []);
  const extras = (profile?.allergens ?? []).filter((a) => !common.has(a));

  // Taste prefs (may be undefined if the DB migration hasn't run yet — treat as empty).
  const commonCuisines = new Set<string>(COMMON_CUISINES as readonly string[]);
  const selectedCuisines = new Set(profile?.favorite_cuisines ?? []);
  const extraCuisines = (profile?.favorite_cuisines ?? []).filter(
    (c) => !commonCuisines.has(c),
  );
  const dislikes = (profile?.disliked_foods ?? []).join(", ");

  return (
    <main className="min-h-dvh bg-[#F8F9FA] px-4 py-10 text-[#1F2933]">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold">Your preferences</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Aegis uses these to plan meals — and to block anything with your allergens.
        </p>

        <form action={saveProfile} className="mt-6 space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={60}
              defaultValue={profile?.display_name ?? ""}
              placeholder="What should we call you?"
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#4C7B61]"
            />
          </div>

          <div>
            <label htmlFor="diet_type" className="block text-sm font-medium">
              Diet
            </label>
            <select
              id="diet_type"
              name="diet_type"
              defaultValue={profile?.diet_type ?? "omnivore"}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 capitalize outline-none focus:border-[#4C7B61]"
            >
              {DIET_TYPES.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Allergens to avoid</legend>
            <p className="text-xs text-[#6B7280]">The guardrail blocks any meal containing these.</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COMMON_ALLERGENS.map((a) => (
                <label
                  key={a}
                  className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm capitalize"
                >
                  <input
                    type="checkbox"
                    name="allergens"
                    value={a}
                    defaultChecked={selected.has(a)}
                    className="accent-[#4C7B61]"
                  />
                  {a}
                </label>
              ))}
            </div>
            <input
              name="custom_allergens"
              type="text"
              placeholder="Other allergens, comma-separated"
              defaultValue={extras.join(", ")}
              className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#4C7B61]"
            />
          </fieldset>

          <fieldset className="rounded-xl border border-dashed border-[#D8E2DB] bg-[#F6FAF7] p-4">
            <legend className="px-1 text-sm font-medium">
              Taste preferences <span className="text-[#6B7280]">(optional)</span>
            </legend>
            <p className="text-xs text-[#6B7280]">
              We&apos;ll lean toward these when planning. Taste hints only — only
              your <strong>allergens</strong> above are enforced by the safety
              guardrail.
            </p>

            <div className="mt-3">
              <span className="block text-xs font-semibold text-[#3D4653]">
                Favorite cuisines
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COMMON_CUISINES.map((c) => (
                  <label
                    key={c}
                    className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="favorite_cuisines"
                      value={c}
                      defaultChecked={selectedCuisines.has(c)}
                      className="accent-[#4C7B61]"
                    />
                    {c}
                  </label>
                ))}
              </div>
              <input
                name="custom_cuisines"
                type="text"
                placeholder="Other cuisines, comma-separated"
                defaultValue={extraCuisines.join(", ")}
                className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#4C7B61]"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="disliked_foods"
                className="block text-xs font-semibold text-[#3D4653]"
              >
                Foods to skip by choice
              </label>
              <input
                id="disliked_foods"
                name="disliked_foods"
                type="text"
                placeholder="e.g. mushrooms, olives, blue cheese"
                defaultValue={dislikes}
                className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#4C7B61]"
              />
              <p className="mt-1 text-xs text-[#6B7280]">
                Comma-separated. A dislike is a preference, not an allergy — if
                skipping it would clash with a safe, on-diet meal, safety wins.
              </p>
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="weekly_budget" className="block text-sm font-medium">
                Weekly budget <span className="text-[#6B7280]">(USD)</span>
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                  $
                </span>
                <input
                  id="weekly_budget"
                  name="weekly_budget"
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  defaultValue={profile?.weekly_budget ?? ""}
                  placeholder="120"
                  className="w-full rounded-lg border border-[#E5E7EB] py-2 pl-7 pr-3 outline-none focus:border-[#4C7B61]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="num_people" className="block text-sm font-medium">
                People
              </label>
              <input
                id="num_people"
                name="num_people"
                type="number"
                min={1}
                max={20}
                required
                defaultValue={profile?.num_people ?? 1}
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#4C7B61]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[#E03131]">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-[#4C7B61] py-2.5 font-semibold text-white hover:bg-[#3B6149]"
          >
            Save &amp; continue
          </button>
        </form>
      </div>
    </main>
  );
}
