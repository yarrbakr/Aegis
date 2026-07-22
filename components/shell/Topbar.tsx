"use client";

// The slim top bar (Design.md D11) — a cosmetic search field plus the signed-in
// user. Search is not wired yet (a later interactive pass); it's here to match
// the reference layout. Kept minimal so page headers own the "Welcome back" line.

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function Topbar({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#ECEDF1] bg-[#F8F9FA]/80 px-4 py-3 backdrop-blur md:px-6">
      {/* Cosmetic search (not wired yet) */}
      <div className="relative w-full max-w-md">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <input
          type="text"
          disabled
          placeholder="Search your food…"
          aria-label="Search (coming soon)"
          className="w-full cursor-not-allowed rounded-full border border-[#ECEDF1] bg-white py-2 pl-9 pr-4 text-sm text-[#6B7280] placeholder:text-[#9CA3AF]"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-right sm:block">
          <span className="block text-sm font-semibold leading-tight text-[#1F2933]">
            {displayName}
          </span>
          <span className="block text-xs leading-tight text-[#9CA3AF]">
            {email}
          </span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF1EC] text-xs font-semibold text-[#3B6149]">
          {initials(displayName) || "A"}
        </span>
      </div>
    </header>
  );
}
