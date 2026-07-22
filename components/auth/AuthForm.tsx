"use client";

import { useState } from "react";
import { login, signup } from "@/app/login/actions";

// Auth form with two clear modes. "Sign in" asks only for email + password;
// "Create account" additionally requires a Name (so Aegis can address the user)
// — so the two flows no longer look identical, and each posts to its own action.
export function AuthForm({
  initialMode = "signin",
  error,
}: {
  initialMode?: "signin" | "signup";
  error?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const isSignup = mode === "signup";

  const tabBase =
    "flex-1 rounded-lg py-2 text-sm font-semibold transition";
  const tabActive = "bg-[#4C7B61] text-white";
  const tabIdle = "text-[#4C7B61] hover:bg-[#EAF1EC]";

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      {/* Mode toggle */}
      <div className="mb-5 flex gap-1 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`${tabBase} ${isSignup ? tabIdle : tabActive}`}
          aria-pressed={!isSignup}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`${tabBase} ${isSignup ? tabActive : tabIdle}`}
          aria-pressed={isSignup}
        >
          Create account
        </button>
      </div>

      <form>
        {isSignup ? (
          <>
            <label htmlFor="display_name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={60}
              autoComplete="name"
              placeholder="What should we call you?"
              className="mt-1 mb-4 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#4C7B61]"
            />
          </>
        ) : null}

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
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "At least 6 characters" : undefined}
          className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#4C7B61]"
        />

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#E03131]">
            {error}
          </p>
        ) : null}

        {isSignup ? (
          <button
            formAction={signup}
            className="mt-5 w-full rounded-lg bg-[#FF6B6B] py-2.5 font-semibold text-white hover:bg-[#FA5252]"
          >
            Create account
          </button>
        ) : (
          <button
            formAction={login}
            className="mt-5 w-full rounded-lg bg-[#4C7B61] py-2.5 font-semibold text-white hover:bg-[#3B6149]"
          >
            Sign in
          </button>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-[#6B7280]">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="font-medium text-[#4C7B61] hover:underline"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            New to Aegis?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="font-medium text-[#4C7B61] hover:underline"
            >
              Create an account
            </button>
          </>
        )}
      </p>
    </div>
  );
}
