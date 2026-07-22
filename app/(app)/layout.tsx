import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import type { Profile } from "@/lib/types";

// Shared shell for the signed-in app (route group `(app)` — the parens keep the
// URLs clean: /dashboard, /meal-plans, /security, /profile). Does the auth gate
// once here so every page inside is protected; the pastel content lives in each
// page. First-run /onboarding and /login stay OUTSIDE this group (no shell).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const profile = data as Pick<Profile, "display_name"> | null;
  const displayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "there";

  return (
    <div className="flex min-h-dvh w-full bg-[#F8F9FA] text-[#1F2933]">
      <Sidebar displayName={displayName} email={user.email ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar displayName={displayName} email={user.email ?? ""} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
