import type { DietType, MealType } from "@/lib/validation";

// Mirrors the `profiles` table (see supabase/schema.sql).
export type Profile = {
  id: string;
  display_name: string | null;
  diet_type: DietType;
  allergens: string[];
  weekly_budget: number | null;
  num_people: number;
  created_at: string;
  updated_at: string;
};

// Mirrors the `meal_plans` table.
export type MealPlan = {
  id: string;
  user_id: string;
  week_start: string | null;
  total_cost: number | null;
  status: "generating" | "ready" | "failed";
  created_at: string;
};

// Mirrors the `ingredients` table.
export type Ingredient = {
  id: string;
  meal_id: string;
  name: string;
  quantity: string | null;
  allergen_tags: string[];
};

// Mirrors the `meals` table.
export type Meal = {
  id: string;
  plan_id: string;
  day_of_week: number;
  meal_type: MealType;
  name: string;
  description: string | null;
  cost: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  safety_status: "passed" | "blocked_regenerated";
  created_at: string;
};

// A meal joined with its ingredients — what the plan grid renders.
export type MealWithIngredients = Meal & { ingredients: Ingredient[] };
