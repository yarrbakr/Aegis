"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Merge checkbox allergens + free-text custom allergens into one tag list.
  const checked = formData.getAll("allergens").map((a) => String(a));
  const custom = String(formData.get("custom_allergens") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const allergens = Array.from(new Set([...checked, ...custom]));

  // Taste prefs: checkbox cuisines + free-text extras; dislikes are free-text.
  const checkedCuisines = formData.getAll("favorite_cuisines").map((c) => String(c));
  const customCuisines = String(formData.get("custom_cuisines") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const favorite_cuisines = Array.from(
    new Set([...checkedCuisines, ...customCuisines]),
  );
  const disliked_foods = Array.from(
    new Set(
      String(formData.get("disliked_foods") ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const parsed = onboardingSchema.safeParse({
    display_name: formData.get("display_name"),
    diet_type: formData.get("diet_type"),
    allergens,
    favorite_cuisines,
    disliked_foods,
    weekly_budget: formData.get("weekly_budget"),
    num_people: formData.get("num_people"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/onboarding?error=${encodeURIComponent(msg)}`);
  }

  const v = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: v.display_name,
      diet_type: v.diet_type,
      allergens: v.allergens,
      favorite_cuisines: v.favorite_cuisines,
      disliked_foods: v.disliked_foods,
      weekly_budget: v.weekly_budget,
      num_people: v.num_people,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
