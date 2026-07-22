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
