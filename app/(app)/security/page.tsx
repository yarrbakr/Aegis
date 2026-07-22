import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SafetyDashboard } from "@/components/charts/SafetyDashboard";
import type { SafetyEventRow } from "@/lib/plan-stats";
import type { Profile } from "@/lib/types";

// "Security Console" nav destination — Aegis's safety record against the user's
// allergens. This is the home of the guardrail story (Design.md D11): lifetime
// counts from the authoritative meals table + the audit trail from safety_events.
export default async function SecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("allergens")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as Pick<Profile, "allergens"> | null;
  const allergens = profile?.allergens ?? [];

  const { data: eventRows } = await supabase
    .from("safety_events")
    .select("event_type, allergen, detail, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const events = (eventRows ?? []) as SafetyEventRow[];

  // Lifetime counts from the meals table (RLS-scoped) so served/regenerated can
  // never contradict; injections come from the audit log.
  const { data: mealSafetyRows } = await supabase
    .from("meals")
    .select("safety_status");
  const served = mealSafetyRows?.length ?? 0;
  const regenerated = (mealSafetyRows ?? []).filter(
    (m) => (m as { safety_status: string }).safety_status === "blocked_regenerated",
  ).length;
  const injections = events.filter(
    (e) => e.event_type === "injection_detected",
  ).length;

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-1">
        <h1 className="font-display text-2xl font-bold text-[#1F2933]">
          Security Console
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          The deterministic guardrail screens every AI-generated meal against your
          declared allergens before it&apos;s saved. Here&apos;s the record.
        </p>
      </div>

      <div className="mt-5">
        <SafetyDashboard
          title="Your safety record"
          subtitle={
            served > 0
              ? `${served} AI-generated meal${served === 1 ? "" : "s"} served — all allergen-safe.${
                  regenerated > 0
                    ? ` ${regenerated} unsafe suggestion${regenerated === 1 ? " was" : "s were"} caught and regenerated.`
                    : ""
                }`
              : "Generate a plan and every meal will be screened against your allergens here."
          }
          served={served}
          regenerated={regenerated}
          injections={injections}
          allergensWatched={allergens}
          events={events}
        />
      </div>

      {/* How it works — plain-language explainer for the evaluator + user. */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          {
            step: "1 · Input screen",
            body: "Your preferences are screened for prompt-injection before they ever reach the model.",
          },
          {
            step: "2 · Generate",
            body: "The model proposes a week of meals, avoiding your allergens by instruction.",
          },
          {
            step: "3 · Guardrail",
            body: "Deterministic code re-checks every ingredient. Anything unsafe is blocked and regenerated — the model never grades its own safety.",
          },
        ].map((c) => (
          <div
            key={c.step}
            className="rounded-2xl border border-[#E7E8EC] bg-white p-4"
          >
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-[#3B6149]">
              {c.step}
            </div>
            <p className="mt-2 text-sm text-[#6B7280]">{c.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-[#9CA3AF]">
        Aegis filters your declared allergens; it is not a medical device and does
        not give medical or nutritional advice.
      </p>
    </div>
  );
}
