import type { SafetyEventRow } from "@/lib/plan-stats";

// The Safety Monitor (Design.md §4, softened per Session 8 feedback). Was a dark
// terminal console; now a light, on-brand card so it doesn't read as "scary" or
// out of place on a white page. It still turns the `safety_events` audit trail
// into at-a-glance proof the guardrail runs — but the raw log lines are now
// humanized into friendly "here's what we caught for you" cards.
// Server-renderable (no interactivity).

type Props = {
  title: string;
  subtitle?: string;
  served: number; // meals served (every one passed the guardrail)
  regenerated: number; // meals whose unsafe first draft was caught + replaced
  injections: number; // injection patterns caught
  allergensWatched: string[]; // the user's declared allergens
  events?: SafetyEventRow[]; // recent log lines (newest first)
};

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Tone = "sage" | "amber" | "green";
const TONE: Record<Tone, { bg: string; fg: string; chip: string }> = {
  sage: { bg: "bg-[#EAF1EC]", fg: "text-[#3B6149]", chip: "#3B6149" },
  amber: { bg: "bg-[#FEF3E2]", fg: "text-[#B45309]", chip: "#B45309" },
  green: { bg: "bg-[#E7F6EC]", fg: "text-[#2F9E44]", chip: "#2F9E44" },
};

function ShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function Alert() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01M10.3 4.3L2.6 18a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z" />
    </svg>
  );
}
function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// Turn a stored event into a friendly, plain-language card — no raw model logs.
function humanize(e: SafetyEventRow): {
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  desc: string;
} {
  if (e.event_type === "injection_detected") {
    return {
      tone: "amber",
      icon: <Alert />,
      title: "Injection attempt blocked",
      desc: "A suspicious instruction in your preferences was ignored — your allergens stayed enforced.",
    };
  }
  if (e.event_type === "meal_blocked") {
    return {
      tone: "sage",
      icon: <ShieldCheck />,
      title: "Unsafe meal caught & replaced",
      desc: e.allergen
        ? `A dish containing ${e.allergen} was blocked and swapped for a safe one.`
        : "An unsafe dish was blocked and swapped for a safe one.",
    };
  }
  return {
    tone: "green",
    icon: <Check />,
    title: "Meal cleared",
    desc: "Passed the deterministic allergen check.",
  };
}

function Stat({
  label,
  value,
  bg,
  fg,
}: {
  label: string;
  value: string | number;
  bg: string;
  fg: string;
}) {
  return (
    <div className={`rounded-xl ${bg} px-3 py-2.5`}>
      <div className={`font-display text-2xl font-bold leading-none ${fg}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[#6B7280]">
        {label}
      </div>
    </div>
  );
}

export function SafetyDashboard({
  title,
  subtitle,
  served,
  regenerated,
  injections,
  allergensWatched,
  events = [],
}: Props) {
  // Interesting events (catches + injections) first — a catch should never be
  // buried below a run of passes.
  const priority = (t: string) => (t === "meal_passed" ? 1 : 0);
  const recent = [...events]
    .sort(
      (a, b) =>
        priority(a.event_type) - priority(b.event_type) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 6);

  return (
    <section className="rounded-2xl border border-[#E7E8EC] bg-white p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4C7B61] opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4C7B61]" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#3B6149]">
            Aegis · Safety Monitor
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9CA3AF]">
          deterministic guardrail · active
        </span>
      </header>

      <h2 className="mt-3 font-display text-lg font-bold text-[#1F2933]">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-sm text-[#6B7280]">{subtitle}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Meals served · all safe" value={served} bg="bg-[#EAF1EC]" fg="text-[#2F9E44]" />
        <Stat
          label="Caught + regenerated"
          value={regenerated}
          bg="bg-[#FEF3E2]"
          fg={regenerated > 0 ? "text-[#B45309]" : "text-[#9CA3AF]"}
        />
        <Stat
          label="Injections caught"
          value={injections}
          bg="bg-[#FEF3E2]"
          fg={injections > 0 ? "text-[#B45309]" : "text-[#9CA3AF]"}
        />
        <Stat label="Allergens watched" value={allergensWatched.length} bg="bg-[#F3F1FB]" fg="text-[#6D5AE6]" />
      </div>

      <div className="mt-3 rounded-xl border border-[#EEF0F3] bg-[#FAFBFC] px-3 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]">
          Screening for
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {allergensWatched.length ? (
            allergensWatched.map((a) => (
              <span
                key={a}
                className="rounded-full bg-[#EAF1EC] px-2.5 py-0.5 text-[11px] font-medium capitalize text-[#3B6149]"
              >
                {a}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[#9CA3AF]">none declared</span>
          )}
        </div>
      </div>

      {/* Humanized activity */}
      <div className="mt-4">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">
          Recent activity
        </div>
        {recent.length ? (
          <ul className="space-y-2">
            {recent.map((e, i) => {
              const h = humanize(e);
              const tone = TONE[h.tone];
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-[#F1F2F4] px-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.bg} ${tone.fg}`}
                  >
                    {h.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#1F2933]">
                      {h.title}
                    </span>
                    <span className="block text-xs text-[#6B7280]">{h.desc}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-[#9CA3AF]">
                    {timeAgo(e.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-[#EEF0F3] px-3 py-4 text-center text-sm text-[#9CA3AF]">
            No safety events yet — generate a plan to see the guardrail at work.
          </p>
        )}
      </div>
    </section>
  );
}
