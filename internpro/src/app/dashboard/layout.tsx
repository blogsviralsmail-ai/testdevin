"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/applications", label: "Applications", icon: "📋", roles: ["admin", "organization"] },
  { href: "/dashboard/interviews", label: "Interviews", icon: "🎤", roles: ["admin", "organization"] },
  { href: "/dashboard/programs", label: "Programs", icon: "📚", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/students", label: "Students", icon: "👥", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/attendance", label: "Attendance", icon: "📅", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/tasks", label: "Tasks", icon: "📝", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/reviews", label: "Review Tasks", icon: "✅", roles: ["teamleader", "admin"] },
  { href: "/dashboard/resources", label: "Study Material", icon: "🎥", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/reports", label: "Reports", icon: "📑", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/completion", label: "Completion Approval", icon: "🎓", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/letters", label: "Letters", icon: "📋", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/payments", label: "Payments", icon: "💰", roles: ["admin", "organization"] },
  { href: "/dashboard/profile", label: "My Profile", icon: "👤", roles: ["student"] },
  { href: "/dashboard/documents", label: "My Documents", icon: "📄", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/team-leaders", label: "Team Leaders", icon: "👔", roles: ["admin", "organization"] },
  { href: "/dashboard/users", label: "User Management", icon: "🔑", roles: ["admin"] },

  { href: "/dashboard/support", label: "Support", icon: "💬", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️", roles: ["admin", "organization"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto attendance for students — login time = checkIn, last activity = checkOut
  useEffect(() => {
    if (user?.role === "student") {
      const today = new Date().toISOString().split("T")[0];
      const key = `auto_attendance_${today}`;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      if (!sessionStorage.getItem(key)) {
        // First visit today = login time (checkIn)
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: today, status: "present", method: "auto", checkIn: timeStr }),
        }).then(() => sessionStorage.setItem(key, timeStr)).catch(() => {});
      }

      // Update checkOut on every page load/navigation (last activity time)
      const updateCheckout = () => {
        const n = new Date();
        const co = `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: today, status: "present", method: "auto", checkOut: co }),
        }).catch(() => {});
      };
      // Update checkout immediately (current page load = activity)
      updateCheckout();
      // Also update on tab visibility change and before leaving
      const onVisibility = () => { if (document.visibilityState === "hidden") updateCheckout(); };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("beforeunload", updateCheckout);
      // Periodic update every 2 minutes
      const interval = setInterval(updateCheckout, 2 * 60 * 1000);
      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("beforeunload", updateCheckout);
      };
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 animate-pulse">IP</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 bg-[#1e1b4b] transition-all duration-300 flex flex-col"
        style={{ width: sidebarOpen ? '256px' : '80px' }}
      >
        <div className="p-4 flex items-center gap-3 border-b border-indigo-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">IP</div>
          {sidebarOpen && <span className="text-xl font-bold text-white">InternPro</span>}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                  isActive ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                )}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-indigo-200 hover:bg-red-600 hover:text-white transition-all text-sm w-full"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '256px' : '80px' }}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-sm font-medium text-gray-900">{user.name}</h2>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium capitalize">
              {user.role} Dashboard
            </Link>
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
