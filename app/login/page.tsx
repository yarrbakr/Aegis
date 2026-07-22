import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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

        <form className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 mb-4 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#4C7B61]"
          />

          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#4C7B61]"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#E03131]">
              {error}
            </p>
          )}

          <button
            formAction={login}
            className="mt-5 w-full rounded-lg bg-[#4C7B61] py-2.5 font-semibold text-white hover:bg-[#3B6149]"
          >
            Sign in
          </button>
          <button
            formAction={signup}
            className="mt-2 w-full rounded-lg border border-[#4C7B61] py-2.5 font-semibold text-[#4C7B61] hover:bg-[#EAF1EC]"
          >
            Create account
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[#6B7280]">
          Aegis filters your declared allergens. It is not a medical device.
        </p>
      </div>
    </main>
  );
}
