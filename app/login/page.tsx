import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const { error, mode } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="grid min-h-dvh place-items-center bg-[#F8F9FA] px-4 text-[#1F2933]">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold">🛡️ Aegis</div>
          <p className="mt-1 text-sm text-[#6B7280]">
            The meal planner that can’t feed you what you’re allergic to.
          </p>
        </div>

        <AuthForm
          initialMode={mode === "signup" ? "signup" : "signin"}
          error={error}
        />

        <p className="mt-4 text-center text-xs text-[#6B7280]">
          Aegis filters your declared allergens. It is not a medical device.
        </p>
      </div>
    </main>
  );
}
