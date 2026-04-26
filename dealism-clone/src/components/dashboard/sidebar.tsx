"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Bot, BookOpen, MessageSquare, Smartphone,
  Settings, LogOut, ShieldCheck, Users, CreditCard, Sliders
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";

interface SidebarProps {
  isAdmin?: boolean;
  userEmail?: string;
}

export function DashboardSidebar({ isAdmin, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useT();
  const links = [
    { href: "/dashboard", label: t("dashboard.sidebar.overview"), icon: LayoutDashboard },
    { href: "/dashboard/agents", label: t("dashboard.sidebar.agents"), icon: Bot },
    { href: "/dashboard/knowledge", label: t("dashboard.sidebar.knowledge"), icon: BookOpen },
    { href: "/dashboard/channels", label: t("dashboard.sidebar.channels"), icon: Smartphone },
    { href: "/dashboard/conversations", label: t("dashboard.sidebar.conversations"), icon: MessageSquare },
    { href: "/dashboard/team", label: t("dashboard.sidebar.team"), icon: Users },
    { href: "/dashboard/billing", label: t("dashboard.sidebar.billing"), icon: CreditCard },
    { href: "/dashboard/settings", label: t("dashboard.sidebar.settings"), icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin", label: t("admin.sidebar.dashboard"), icon: ShieldCheck },
    { href: "/admin/users", label: t("admin.sidebar.users"), icon: Users },
    { href: "/admin/plans", label: t("admin.sidebar.plans"), icon: CreditCard },
    { href: "/admin/settings", label: t("admin.sidebar.settings"), icon: Sliders },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-neutral-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold">D</div>
          <span className="text-xl font-bold">Dealism</span>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold uppercase text-neutral-400 px-3 mb-2">Workspace</div>
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/dashboard" && pathname?.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-orange-50 text-orange-700" : "text-neutral-700 hover:bg-neutral-100"
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="text-xs font-semibold uppercase text-neutral-400 px-3 mt-6 mb-2">Admin</div>
            {adminLinks.map((l) => {
              const active = pathname === l.href || (l.href !== "/admin" && pathname?.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-orange-50 text-orange-700" : "text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <div className="text-xs text-neutral-500 mb-2 truncate">{userEmail}</div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 text-sm text-neutral-700 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          {t("common.signout")}
        </button>
      </div>
    </aside>
  );
}
