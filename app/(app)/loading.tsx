// Shown instantly while a page in the app shell loads (tab switches, first paint).
// The sidebar lives in the layout so it stays put; only this content area swaps to
// a skeleton — so navigation never feels "stuck" waiting on the server fetch.
export default function AppLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-7 w-56 rounded-lg bg-[#ECEDF1]" />
          <div className="mt-2 h-4 w-40 rounded bg-[#F1F2F4]" />
        </div>
        <div className="h-9 w-36 rounded-[10px] bg-[#ECEDF1]" />
      </div>

      {/* strip */}
      <div className="mt-6 h-16 rounded-2xl border border-[#EEF0F3] bg-[#F7F8FA]" />

      {/* stat cards */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#F1F2F4]" />
        ))}
      </div>

      {/* panels */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-2xl border border-[#EEF0F3] bg-[#F7F8FA] lg:col-span-2" />
        <div className="h-64 rounded-2xl border border-[#EEF0F3] bg-[#F7F8FA]" />
      </div>
    </div>
  );
}
