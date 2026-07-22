"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// The left navigation rail (Design.md D11). Light surface, sage active pill.
// Collapsible on desktop (a toggle minimizes it to an icon rail); the choice is
// remembered in localStorage. On mobile it is always the compact icon rail.

type NavItem = { href: string; label: string; icon: React.ReactNode };

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

const STORAGE_KEY = "aegis-sidebar-collapsed";

export function Sidebar({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
      setCollapsed(true);
    }
  }, []);

  const toggle = () =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });

  // On mobile the rail is always compact; `collapsed` only drives md+ width.
  const labelCls = collapsed ? "hidden" : "hidden md:inline";

  return (
    <aside
      className={`sticky top-0 flex h-dvh shrink-0 flex-col border-r border-[#ECEDF1] bg-white px-2 py-4 transition-[width] duration-200 md:px-3 ${
        collapsed ? "w-[76px]" : "w-[76px] md:w-64"
      }`}
    >
      {/* Brand + collapse toggle */}
      <div
        className={`mb-6 flex ${
          collapsed ? "flex-col items-center gap-3" : "items-center justify-between"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4C7B61] text-white">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...stroke}>
              <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          <span
            className={`font-display text-lg font-bold text-[#1F2933] ${
              collapsed ? "hidden" : "hidden md:inline"
            }`}
          >
            Aegis
          </span>
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-8 w-8 items-center justify-center rounded-lg border border-[#ECEDF1] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2933] md:flex"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            {...stroke}
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

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
                collapsed ? "md:justify-center" : ""
              } ${
                active
                  ? "bg-[#4C7B61] text-white shadow-sm"
                  : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2933]"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={labelCls}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="mt-4 border-t border-[#ECEDF1] pt-3">
        <div
          className={`flex items-center gap-2.5 px-1 ${collapsed ? "md:justify-center" : ""}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF1EC] text-xs font-semibold text-[#3B6149]">
            {initials(displayName) || "A"}
          </span>
          <div className={`min-w-0 ${collapsed ? "hidden" : "hidden md:block"}`}>
            <div className="truncate text-sm font-semibold text-[#1F2933]">
              {displayName}
            </div>
            <div className="truncate text-xs text-[#9CA3AF]">{email}</div>
          </div>
        </div>
        <form action="/auth/signout" method="post" className="mt-2">
          <button
            className={`flex w-full items-center gap-2 rounded-lg border border-[#ECEDF1] px-2 py-2 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] ${
              collapsed ? "md:justify-center" : "justify-center md:justify-start md:px-3"
            }`}
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stroke}>
              <path d="M15 12H4M8 8l-4 4 4 4M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
            </svg>
            <span className={labelCls}>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
