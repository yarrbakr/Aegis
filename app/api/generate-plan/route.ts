// POST /api/generate-plan — the "kitchen" (D10: AI generation runs in a
// server-side Next.js Route Handler on Vercel).
//
// Flow:  auth → load profile → build fixed prompt (prefs as data) → Groq (JSON)
//        → Zod-validate with one repair retry → persist plan/meals/ingredients.
//
// Everything runs as the logged-in user via their Supabase session, so RLS
// enforces ownership on every insert. The deterministic allergen GUARDRAIL slots
// in right before persistence in Phase 3 — this phase just proves the pipeline.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON, LLMError } from "@/lib/llm/groq";
import { buildPlanMessages, buildRepairMessages } from "@/lib/prompt";
import { generatedPlanSchema, type GeneratedPlan } from "@/lib/validation";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";
// Groq is fast, but a full week of 21 meals can take a few seconds — give the
// function room so it never gets cut off mid-generation on Vercel.
export const maxDuration = 60;

type ValidateResult =
  | { ok: true; data: GeneratedPlan }
  | { ok: false; error: string };

// Parse + Zod-validate the model's raw string. Never trust it blind.
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

// Generate, validating the output, with a single repair retry on failure.
async function generatePlan(profile: Profile): Promise<GeneratedPlan> {
  const messages = buildPlanMessages(profile);
  const raw = await chatJSON(messages);

  const first = validate(raw);
  if (first.ok) return first.data;

  // One repair pass: hand the bad output + the error back and ask for a fix.
  const repair = buildRepairMessages(messages, raw, first.error);
  const raw2 = await chatJSON(repair);
  const second = validate(raw2);
  if (second.ok) return second.data;

  throw new LLMError(
    `Model output failed validation after repair (${second.error}).`,
  );
}

// Monday of the current week, as YYYY-MM-DD (matches meals' 0=Monday indexing).
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Load the household's preferences — these drive the whole prompt.
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

  // 1) Generate + validate (the AI step).
  let plan: GeneratedPlan;
  try {
    plan = await generatePlan(profile);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[generate-plan] generation failed:", detail);
    return NextResponse.json(
      { error: "Couldn't generate a plan right now. Please try again." },
      { status: 502 },
    );
  }

  // 2) Persist plan → meals → ingredients (RLS-enforced via the user's session).
  const totalCost = plan.meals.reduce((sum, m) => sum + (m.cost ?? 0), 0);

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

  // Insert meals, returning their ids so we can attach ingredients.
  const mealRows = plan.meals.map((m) => ({
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
    safety_status: "passed" as const, // Phase 3: set by the guardrail
  }));

  const { data: insertedMeals, error: mealsErr } = await supabase
    .from("meals")
    .insert(mealRows)
    .select("id, day_of_week, meal_type");

  if (mealsErr || !insertedMeals) {
    console.error("[generate-plan] meals insert failed:", mealsErr?.message);
    await supabase.from("meal_plans").delete().eq("id", planId); // cascade cleanup
    return NextResponse.json(
      { error: "Couldn't save your plan. Please try again." },
      { status: 500 },
    );
  }

  // Map each saved meal back to its generated ingredients by (day, meal_type),
  // which is unique within a plan.
  const idByKey = new Map<string, string>();
  for (const row of insertedMeals) {
    idByKey.set(`${row.day_of_week}-${row.meal_type}`, row.id as string);
  }

  const ingredientRows = plan.meals.flatMap((m) => {
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

  return NextResponse.json({ planId }, { status: 200 });
}
