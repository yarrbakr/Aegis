import type { DietType } from "@/lib/validation";

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
