import Link from "next/link";
import SoftBlurIn from "@/components/ui/soft-blur-in";

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#F8F9FA] text-[#1F2933]">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <div className="text-sm font-semibold uppercase tracking-wider text-[#4C7B61]">
          Aegis · AI meal planning with a safety shield
        </div>

        {/* Animated hero title — per-character soft blur-in reveal. */}
        <h1 className="mt-4 flex flex-col items-center gap-1">
          <SoftBlurIn className="font-display text-4xl font-bold leading-tight tracking-tight text-[#1F2933] sm:text-6xl">
            Eat Healthy,
          </SoftBlurIn>
          <SoftBlurIn
            className="font-display text-4xl font-bold leading-tight tracking-tight text-[#4C7B61] sm:text-6xl"
            delay={350}
          >
            Stay Healthy
          </SoftBlurIn>
        </h1>
        <SoftBlurIn
          className="mt-3 font-display text-lg font-medium italic text-[#6B7280] sm:text-xl"
          delay={800}
        >
          yours truly, Aegis
        </SoftBlurIn>

        <p className="mt-6 max-w-xl text-lg text-[#4B5563]">
          The meal planner that can’t feed you what you’re allergic to — every
          AI-generated meal passes a deterministic allergen guardrail before you
          ever see it. Unsafe suggestions are blocked, logged, and regenerated.
        </p>
        <Link
          href="/login"
          className="mt-8 rounded-lg bg-[#4C7B61] px-6 py-3 font-semibold text-white transition hover:bg-[#3B6149]"
        >
          Get started →
        </Link>
        <p className="mt-6 text-xs text-[#6B7280]">
          Aegis filters your declared allergens. It is not a medical device and does
          not provide medical advice.
        </p>
      </div>
    </main>
  );
}
