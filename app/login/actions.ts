"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function creds(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(creds(formData));

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const { email, password } = creds(formData);
  const displayName = String(formData.get("display_name") ?? "").trim();

  // Name is required at signup so Aegis can address the user by it. Passed as
  // auth metadata → the handle_new_user DB trigger writes it to profiles.
  if (!displayName) {
    redirect(`/login?mode=signup&error=${encodeURIComponent("Please enter your name.")}`);
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  }
  // Email confirmation is off, so the user is signed in immediately.
  revalidatePath("/", "layout");
  redirect("/onboarding");
}
