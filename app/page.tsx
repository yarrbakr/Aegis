import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#F8F9FA] text-[#1F2933]">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <div className="text-sm font-semibold uppercase tracking-wider text-[#4C7B61]">
          Aegis · AI meal planning with a safety shield
        </div>
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
          A meal planner that <span className="text-[#4C7B61]">can’t</span> feed you
          <br />
          what you’re allergic to.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-[#6B7280]">
          Every AI-generated meal passes a deterministic allergen guardrail before you ever see
          it. Unsafe suggestions are blocked, logged, and regenerated.
        </p>
        <Link
          href="/login"
          className="mt-8 rounded-lg bg-[#FF6B6B] px-6 py-3 font-semibold text-white hover:bg-[#FA5252]"
        >
          Get started →
        </Link>
        <p className="mt-6 text-xs text-[#6B7280]">
          Aegis filters your declared allergens. It is not a medical device and does not provide
          medical advice.
        </p>
      </div>
    </main>
  );
}
