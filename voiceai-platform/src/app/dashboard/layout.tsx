"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot, Phone, BarChart3, Plug, MessageSquare, Settings,
  PhoneOutgoing, ChevronLeft, ChevronRight, LogOut,
  Home, FileText, Key, CreditCard, User, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { icon: Home, label: "Overview", href: "/dashboard" },
  { icon: Bot, label: "Agents", href: "/dashboard/agents" },
  { icon: Phone, label: "Phone Numbers", href: "/dashboard/numbers" },
  { icon: PhoneOutgoing, label: "Campaigns", href: "/dashboard/campaigns" },
  { icon: FileText, label: "Recent Calls", href: "/dashboard/calls" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Plug, label: "Integrations", href: "/dashboard/integrations" },
  { icon: MessageSquare, label: "Chat Widget", href: "/dashboard/chat-widget" },
  { icon: FileText, label: "Knowledge Base", href: "/dashboard/knowledge" },
  { icon: Key, label: "API Keys", href: "/dashboard/api-keys" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0f1a]">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col border-r border-white/10 bg-[#0d1117] transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          {!collapsed && (
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-[#00d4aa]">VOICE</span>
              <span className="text-xl font-bold text-white">AI</span>
              <span className="ml-1 text-[8px] font-medium text-[#00d4aa] uppercase tracking-wider">Pro</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#00d4aa]/10 text-[#00d4aa]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                } ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-2">
          <Link
            href="/login"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/10 bg-[#0d1117] z-50">
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-[#00d4aa]">VOICE</span>
                <span className="text-xl font-bold text-white">AI</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-2 space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive ? "bg-[#00d4aa]/10 text-[#00d4aa]" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0d1117]/50 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-400"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/agents/new">
              <Button size="sm" className="bg-[#00d4aa] text-black hover:bg-[#00b894] font-medium">
                + New Agent
              </Button>
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00d4aa]/20 text-[#00d4aa]">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
