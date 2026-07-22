"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The left navigation rail (Design.md D11). Light surface, sage active pill —
// the "hint of Aegis" over the pastel dashboard. Icon-only on small screens,
// full labels on md+. usePathname drives the active state, so this is a client
// component; everything else on the page stays server-rendered.

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...stroke}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/meal-plans",
    label: "Meal Plans",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...stroke}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    ),
  },
  {
    href: "/security",
    label: "Security Console",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...stroke}>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...stroke}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function Sidebar({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-dvh w-[68px] shrink-0 flex-col border-r border-[#ECEDF1] bg-white px-2 py-4 md:w-64 md:px-4">
      {/* Brand */}
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2 px-1 md:px-2"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4C7B61] text-white">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...stroke}>
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <span className="hidden font-display text-lg font-bold text-[#1F2933] md:inline">
          Aegis
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition md:px-3 ${
                active
                  ? "bg-[#4C7B61] text-white shadow-sm"
                  : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2933]"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="mt-4 border-t border-[#ECEDF1] pt-3">
        <div className="flex items-center gap-2.5 px-1 md:px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF1EC] text-xs font-semibold text-[#3B6149]">
            {initials(displayName) || "A"}
          </span>
          <div className="hidden min-w-0 md:block">
            <div className="truncate text-sm font-semibold text-[#1F2933]">
              {displayName}
            </div>
            <div className="truncate text-xs text-[#9CA3AF]">{email}</div>
          </div>
        </div>
        <form action="/auth/signout" method="post" className="mt-2">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#ECEDF1] px-2 py-2 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] md:justify-start md:px-3">
            <svg viewBox="0 0 24 24" className="h-4 w-4" {...stroke}>
              <path d="M15 12H4M8 8l-4 4 4 4M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
            </svg>
            <span className="hidden md:inline">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
