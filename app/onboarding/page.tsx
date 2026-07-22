import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { COMMON_ALLERGENS, DIET_TYPES } from "@/lib/validation";
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
              Name <span className="text-[#6B7280]">(optional)</span>
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              maxLength={60}
              defaultValue={profile?.display_name ?? ""}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="weekly_budget" className="block text-sm font-medium">
                Weekly budget <span className="text-[#6B7280]">(optional)</span>
              </label>
              <input
                id="weekly_budget"
                name="weekly_budget"
                type="number"
                min={1}
                step="0.01"
                defaultValue={profile?.weekly_budget ?? ""}
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#4C7B61]"
              />
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
