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

  const parsed = onboardingSchema.safeParse({
    display_name: formData.get("display_name"),
    diet_type: formData.get("diet_type"),
    allergens,
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
