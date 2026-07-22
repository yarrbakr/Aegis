"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Kicks off POST /api/generate-plan, shows a loading state while the model works
// (generation takes a few seconds), then navigates to the new plan. On error it
// surfaces the server's friendly message inline — never a white screen.
export function GenerateButton({
  variant = "primary",
  label = "Generate my week",
}: {
  variant?: "primary" | "secondary";
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-plan", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        planId?: string;
        error?: string;
      };
      if (!res.ok || !data.planId) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push(`/plan/${data.planId}`);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  const base =
    "inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-[#FF6B6B] text-white hover:bg-[#FA5252]"
      : "border border-[#4C7B61] text-[#4C7B61] hover:bg-[#EAF1EC]";

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`${base} ${styles}`}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            <span className="animate-pulse">Planning your week…</span>
          </>
        ) : (
          label
        )}
      </button>
      {loading ? (
        <p className="mt-2 text-xs text-[#6B7280]">
          Aegis is generating 21 meals and screening ingredients — this takes a
          few seconds.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs font-medium text-[#E03131]">{error}</p>
      ) : null}
    </div>
  );
}
