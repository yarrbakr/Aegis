import type { SafetyEventRow } from "@/lib/plan-stats";

// The Safety Dashboard — a mini security console (Design.md §4). Dark by design,
// mono metrics, sage for "passed", danger-red for "blocked". It turns the audit
// trail in `safety_events` into the at-a-glance proof that the guardrail runs.
// Server-renderable (no interactivity) — just styled data.

type Props = {
  title: string;
  subtitle?: string;
  served: number; // meals served (every one passed the guardrail)
  regenerated: number; // distinct meals whose unsafe first draft was caught + replaced
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

function dotColor(type: string): string {
  if (type === "meal_blocked") return "#F87171"; // danger
  if (type === "injection_detected") return "#FBBF24"; // amber
  return "#4ADE80"; // safe/passed
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#1E293B] bg-[#0B1220] px-3 py-2.5">
      <div className="font-mono text-2xl font-semibold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-[0.08em] text-slate-400">
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
  // Surface the interesting events (catches + injections) first — a single block
  // among 20 passes should never be buried below the fold.
  const priority = (t: string) => (t === "meal_passed" ? 1 : 0);
  const recent = [...events]
    .sort(
      (a, b) =>
        priority(a.event_type) - priority(b.event_type) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 6);

  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-5 text-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
            Aegis · Safety Monitor
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
          deterministic guardrail · active
        </span>
      </header>

      <h2 className="mt-3 text-lg font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Meals served · all safe" value={served} color="#4ADE80" />
        <Stat
          label="Caught + regenerated"
          value={regenerated}
          color={regenerated > 0 ? "#FBBF24" : "#64748B"}
        />
        <Stat
          label="Injections caught"
          value={injections}
          color={injections > 0 ? "#FBBF24" : "#64748B"}
        />
        <Stat
          label="Allergens watched"
          value={allergensWatched.length}
          color="#FFFFFF"
        />
      </div>

      <div className="mt-3 rounded-lg border border-[#1E293B] bg-[#0B1220] px-3 py-2.5">
        <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
          Screening for
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {allergensWatched.length ? (
            allergensWatched.map((a) => (
              <span
                key={a}
                className="rounded-full border border-[#1E293B] bg-[#111c33] px-2 py-0.5 font-mono text-[11px] capitalize text-slate-300"
              >
                {a}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-500">none declared</span>
          )}
        </div>
      </div>

      {/* Live log */}
      <div className="mt-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
          Recent events
        </div>
        {recent.length ? (
          <ul className="space-y-1.5">
            {recent.map((e, i) => (
              <li key={i} className="flex items-start gap-2 font-mono text-[11px] leading-relaxed">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor(e.event_type) }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-slate-300" title={e.detail}>
                  {e.detail}
                </span>
                <span className="shrink-0 text-slate-500">{timeAgo(e.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-mono text-[11px] text-slate-500">
            No safety events yet — generate a plan to see the guardrail at work.
          </p>
        )}
      </div>
    </section>
  );
}
