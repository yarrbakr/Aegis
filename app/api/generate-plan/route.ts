// POST /api/generate-plan — the "kitchen" (D10: AI generation + the deterministic
// guardrail run in a server-side Next.js Route Handler on Vercel).
//
// Flow (matches Architecture.md §2):
//   auth → load profile
//   → 1. INPUT GUARDRAIL: screen free-text prefs for injection, log + sanitize
//   → 2. build fixed prompt (prefs as data) → Groq/Mistral (JSON) → Zod-validate (1 repair)
//   → 3. OUTPUT GUARDRAIL: deterministically screen every meal vs declared
//        allergens; block + regenerate unsafe meals (≤3), safe placeholder if
//        still unsafe — an unsafe meal is NEVER served.
//   → persist plan/meals/ingredients + log every guardrail decision to safety_events.
//
// Everything runs as the logged-in user via their Supabase session, so RLS
// enforces ownership on every insert.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON, LLMError } from "@/lib/llm/groq";
import {
  buildPlanMessages,
  buildRepairMessages,
  buildMealRegenMessages,
  type PromptPrefs,
} from "@/lib/prompt";
import {
  generatedPlanSchema,
  generatedMealSchema,
  DAY_NAMES,
  type GeneratedPlan,
  type GeneratedMeal,
  type MealType,
} from "@/lib/validation";
import { screenMeal, describeHit } from "@/lib/guardrails/allergen";
import { screenPreferences, describeFinding } from "@/lib/guardrails/injection";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";
// Generation plus (rarely) a few single-meal regenerations can take several
// seconds — give the function room so it never gets cut off on Vercel.
export const maxDuration = 60;

type SafetyStatus = "passed" | "blocked_regenerated";
type SafeMeal = GeneratedMeal & { safety_status: SafetyStatus };
type PendingEvent = {
  event_type: "meal_passed" | "meal_blocked" | "injection_detected";
  allergen: string | null;
  detail: string;
};

// Bound worst-case latency: never make more than this many regeneration calls
// for a single plan (unsafe meals beyond the budget get a safe placeholder).
const MAX_REGEN_PER_MEAL = 3;
const MAX_REGEN_PER_PLAN = 12;

// ── Validation helpers ──────────────────────────────────────────────────────

type ValidateResult =
  | { ok: true; data: GeneratedPlan }
  | { ok: false; error: string };

function validate(raw: string): ValidateResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "response was not valid JSON" };
  }
  const parsed = generatedPlanSchema.safeParse(json);
  if (!parsed.success) {
    const error = parsed.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return { ok: false, error };
  }
  return { ok: true, data: parsed.data };
}

function validateMeal(raw: string): GeneratedMeal | null {
  try {
    const parsed = generatedMealSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.meal : null;
  } catch {
    return null;
  }
}

// ── Generation ──────────────────────────────────────────────────────────────

// Generate the full week, validating output, with a single repair retry.
async function generatePlan(
  profile: Profile,
  promptPrefs: PromptPrefs,
): Promise<GeneratedPlan> {
  const messages = buildPlanMessages(profile, promptPrefs);
  const raw = await chatJSON(messages);

  const first = validate(raw);
  if (first.ok) return first.data;

  const repair = buildRepairMessages(messages, raw, first.error);
  const raw2 = await chatJSON(repair);
  const second = validate(raw2);
  if (second.ok) return second.data;

  throw new LLMError(
    `Model output failed validation after repair (${second.error}).`,
  );
}

// Ask the model for one safe replacement meal for a specific slot.
async function regenerateMeal(
  profile: Profile,
  slot: GeneratedMeal,
  leakedAllergen: string,
  promptPrefs: PromptPrefs,
): Promise<GeneratedMeal | null> {
  const messages = buildMealRegenMessages(
    profile,
    slot,
    leakedAllergen,
    promptPrefs,
  );
  const raw = await chatJSON(messages);
  const meal = validateMeal(raw);
  if (!meal) return null;
  // Pin the slot — the model can drift on day/type; the grid needs it exact.
  return { ...meal, day_of_week: slot.day_of_week, meal_type: slot.meal_type };
}

function slotLabel(m: { day_of_week: number; meal_type: string }): string {
  return `${DAY_NAMES[m.day_of_week] ?? `day ${m.day_of_week}`} ${m.meal_type}`;
}

// A deterministic, allergen-free fallback. Rice + veg + olive oil clears all
// common allergens; we still screen it so even an exotic custom allergen can't
// slip through. Named generically so no staple word trips the meal-text scan.
function safePlaceholder(
  day: number,
  mealType: MealType,
  declared: string[],
): GeneratedMeal {
  const base: GeneratedMeal = {
    day_of_week: day,
    meal_type: mealType,
    name: "Chef's safe plate",
    description: "A plain, allergen-free option while we prepare something better.",
    cost: 3,
    calories: 420,
    protein_g: 10,
    carbs_g: 78,
    fat_g: 7,
    ingredients: [
      { name: "White rice", quantity: "150g", allergen_tags: [] },
      { name: "Steamed mixed vegetables", quantity: "200g", allergen_tags: [] },
      { name: "Olive oil", quantity: "1 tbsp", allergen_tags: [] },
    ],
  };
  base.ingredients = base.ingredients.filter(
    (ing) =>
      screenMeal({ name: base.name, description: "", ingredients: [ing] }, declared)
        .safe,
  );
  if (base.ingredients.length === 0) {
    base.ingredients = [
      { name: "Seasonal vegetables", quantity: "250g", allergen_tags: [] },
    ];
  }
  return base;
}

// THE GUARDRAIL. Screen every meal against the user's ORIGINAL declared
// allergens (safety uses the real list, not the injection-sanitized one),
// regenerate the unsafe ones, and record every decision as a safety_event.
async function enforceSafety(
  profile: Profile,
  meals: GeneratedMeal[],
  promptPrefs: PromptPrefs,
): Promise<{ meals: SafeMeal[]; events: PendingEvent[] }> {
  const declared = profile.allergens;
  const events: PendingEvent[] = [];
  const out: SafeMeal[] = [];
  let planRegens = 0;

  for (const meal of meals) {
    let current = meal;
    let verdict = screenMeal(current, declared);

    // Safe on the first try — serve as-is, one clean "passed" line.
    if (verdict.safe) {
      events.push({
        event_type: "meal_passed",
        allergen: null,
        detail: `${slotLabel(current)}: "${current.name}" passed the allergen guardrail.`,
      });
      out.push({ ...current, safety_status: "passed" });
      continue;
    }

    // Unsafe: capture WHY once (for a single, clear audit line), then quietly
    // regenerate up to the retry budget — we do NOT log each attempt (that read
    // like the model was stuck; the user only cares that it was caught + fixed).
    const originalName = current.name;
    const firstHit = verdict.hits[0];
    const reason = firstHit ? describeHit(firstHit) : "a declared allergen";
    let regens = 0;

    while (
      !verdict.safe &&
      regens < MAX_REGEN_PER_MEAL &&
      planRegens < MAX_REGEN_PER_PLAN
    ) {
      regens++;
      planRegens++;
      const replacement = await regenerateMeal(
        profile,
        current,
        verdict.hits[0]?.allergen ?? firstHit?.allergen ?? "",
        promptPrefs,
      ).catch(() => null);
      if (!replacement) break; // fall through to the safe placeholder
      current = replacement;
      verdict = screenMeal(current, declared);
    }

    if (verdict.safe) {
      // Regenerated into a safe meal — ONE event describing the save.
      events.push({
        event_type: "meal_blocked",
        allergen: firstHit?.allergen ?? null,
        detail: `${slotLabel(meal)}: original suggestion "${originalName}" was blocked (${reason}) and replaced with a safe meal, "${current.name}".`,
      });
      out.push({ ...current, safety_status: "blocked_regenerated" });
    } else {
      // Couldn't produce a safe version within the user's restrictions — serve a
      // guaranteed-safe fallback, never the unsafe meal.
      const placeholder = safePlaceholder(meal.day_of_week, meal.meal_type, declared);
      events.push({
        event_type: "meal_blocked",
        allergen: firstHit?.allergen ?? null,
        detail: `${slotLabel(meal)}: original suggestion "${originalName}" was blocked (${reason}); no safe version could be generated within your restrictions, so a safe fallback plate ("${placeholder.name}") was served.`,
      });
      out.push({ ...placeholder, safety_status: "blocked_regenerated" });
    }
  }

  return { meals: out, events };
}

// ── Misc ────────────────────────────────────────────────────────────────────

// Monday of the current week, as YYYY-MM-DD (matches meals' 0=Monday indexing).
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}

// ── Handler ───────────────────────────────────────────────────────────────

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as Profile | null;
  if (!profile) {
    return NextResponse.json(
      { error: "Set up your preferences first." },
      { status: 400 },
    );
  }

  // 1) INPUT GUARDRAIL — screen the user's free-text prefs for injection
  //    (allergens AND taste prefs — all of it reaches the model as data).
  const { promptAllergens, promptCuisines, promptDislikes, findings } =
    screenPreferences(profile);
  const promptPrefs: PromptPrefs = {
    allergens: promptAllergens,
    cuisines: promptCuisines,
    dislikes: promptDislikes,
  };
  const events: PendingEvent[] = findings.map((f) => ({
    event_type: "injection_detected" as const,
    allergen: null,
    detail: describeFinding(f),
  }));

  // 2) Generate + validate (the AI step) using the sanitized prefs.
  let plan: GeneratedPlan;
  try {
    plan = await generatePlan(profile, promptPrefs);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[generate-plan] generation failed:", detail);
    return NextResponse.json(
      { error: "Couldn't generate a plan right now. Please try again." },
      { status: 502 },
    );
  }

  // 3) OUTPUT GUARDRAIL — screen + regenerate. Never serve an unsafe meal.
  let safeMeals: SafeMeal[];
  try {
    const enforced = await enforceSafety(profile, plan.meals, promptPrefs);
    safeMeals = enforced.meals;
    events.push(...enforced.events);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[generate-plan] guardrail failed:", detail);
    return NextResponse.json(
      { error: "Couldn't safety-check your plan. Please try again." },
      { status: 502 },
    );
  }

  // 4) Persist plan → meals → ingredients (RLS-enforced via the user's session).
  const totalCost = safeMeals.reduce((sum, m) => sum + (m.cost ?? 0), 0);

  const { data: planRow, error: planErr } = await supabase
    .from("meal_plans")
    .insert({
      user_id: user.id,
      week_start: currentWeekStart(),
      total_cost: Number(totalCost.toFixed(2)),
      status: "ready",
    })
    .select("id")
    .single();

  if (planErr || !planRow) {
    console.error("[generate-plan] plan insert failed:", planErr?.message);
    return NextResponse.json(
      { error: "Couldn't save your plan. Please try again." },
      { status: 500 },
    );
  }
  const planId = planRow.id as string;

  const mealRows = safeMeals.map((m) => ({
    plan_id: planId,
    day_of_week: m.day_of_week,
    meal_type: m.meal_type,
    name: m.name,
    description: m.description || null,
    cost: m.cost ?? null,
    calories: m.calories ?? null,
    protein_g: m.protein_g ?? null,
    carbs_g: m.carbs_g ?? null,
    fat_g: m.fat_g ?? null,
    safety_status: m.safety_status,
  }));

  const { data: insertedMeals, error: mealsErr } = await supabase
    .from("meals")
    .insert(mealRows)
    .select("id, day_of_week, meal_type");

  if (mealsErr || !insertedMeals) {
    console.error("[generate-plan] meals insert failed:", mealsErr?.message);
    await supabase.from("meal_plans").delete().eq("id", planId);
    return NextResponse.json(
      { error: "Couldn't save your plan. Please try again." },
      { status: 500 },
    );
  }

  const idByKey = new Map<string, string>();
  for (const row of insertedMeals) {
    idByKey.set(`${row.day_of_week}-${row.meal_type}`, row.id as string);
  }

  const ingredientRows = safeMeals.flatMap((m) => {
    const mealId = idByKey.get(`${m.day_of_week}-${m.meal_type}`);
    if (!mealId) return [];
    return m.ingredients.map((ing) => ({
      meal_id: mealId,
      name: ing.name,
      quantity: ing.quantity || null,
      allergen_tags: ing.allergen_tags ?? [],
    }));
  });

  if (ingredientRows.length > 0) {
    const { error: ingErr } = await supabase
      .from("ingredients")
      .insert(ingredientRows);
    if (ingErr) {
      console.error("[generate-plan] ingredients insert failed:", ingErr.message);
      await supabase.from("meal_plans").delete().eq("id", planId);
      return NextResponse.json(
        { error: "Couldn't save your plan. Please try again." },
        { status: 500 },
      );
    }
  }

  // 5) Persist the audit trail. Best-effort: a logging failure must not sink an
  // otherwise-safe, saved plan — but we surface it in the server logs.
  if (events.length > 0) {
    const eventRows = events.map((e) => ({
      user_id: user.id,
      plan_id: planId,
      event_type: e.event_type,
      allergen: e.allergen,
      detail: e.detail,
    }));
    const { error: evErr } = await supabase.from("safety_events").insert(eventRows);
    if (evErr) {
      console.error("[generate-plan] safety_events insert failed:", evErr.message);
    }
  }

  const blocked = events.filter((e) => e.event_type === "meal_blocked").length;
  return NextResponse.json({ planId, screened: safeMeals.length, blocked }, { status: 200 });
}
