import { z } from "zod";

// Diet types and common allergens used by the onboarding form.
export const DIET_TYPES = [
  "omnivore",
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "halal",
] as const;
export type DietType = (typeof DIET_TYPES)[number];

export const COMMON_ALLERGENS = [
  "peanuts",
  "tree nuts",
  "milk",
  "eggs",
  "fish",
  "shellfish",
  "soy",
  "wheat",
  "gluten",
  "sesame",
] as const;

// Validated shape of the onboarding form. Never trust raw form input.
export const onboardingSchema = z.object({
  display_name: z.string().trim().max(60).optional(),
  diet_type: z.enum(DIET_TYPES),
  allergens: z.array(z.string().trim().min(1)).max(30),
  weekly_budget: z.coerce.number().positive().max(1_000_000).optional(),
  num_people: z.coerce.number().int().min(1).max(20),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Meal-plan generation (Phase 2)
//
// These schemas validate the LLM's output before we trust it — never render or
// persist unvalidated model output (Rules.md §5.3). The `allergen_tags` on each
// ingredient are what the Phase 3 deterministic guardrail scans against the
// user's declared allergens.
// ────────────────────────────────────────────────────────────────────────────

export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

// Mon..Sun as 0..6 (matches meals.day_of_week in the schema).
export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// Canonical allergen vocabulary the model tags ingredients with. Kept aligned
// with COMMON_ALLERGENS so the guardrail can match declared allergens directly.
export const ALLERGEN_TAGS = COMMON_ALLERGENS;

const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(60).optional().default(""),
  // Free-form on purpose: the model may tag with canonical allergens OR a user's
  // custom allergen word. We lowercase + keep it permissive; the guardrail
  // normalizes at match time.
  allergen_tags: z
    .array(z.string().trim().toLowerCase().min(1).max(40))
    .max(20)
    .default([]),
});
export type GeneratedIngredient = z.infer<typeof ingredientSchema>;

const mealSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  meal_type: z.enum(MEAL_TYPES),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).optional().default(""),
  cost: z.coerce.number().min(0).max(100_000).optional().default(0),
  calories: z.coerce.number().int().min(0).max(10_000).optional().default(0),
  protein_g: z.coerce.number().int().min(0).max(1_000).optional().default(0),
  carbs_g: z.coerce.number().int().min(0).max(1_000).optional().default(0),
  fat_g: z.coerce.number().int().min(0).max(1_000).optional().default(0),
  ingredients: z.array(ingredientSchema).min(1).max(30),
});
export type GeneratedMeal = z.infer<typeof mealSchema>;

// Top-level object the model must return: { "meals": [...] }.
export const generatedPlanSchema = z.object({
  meals: z.array(mealSchema).min(1).max(40),
});
export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;
