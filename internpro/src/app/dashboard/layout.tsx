"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  { href: "/dashboard", label: "Dashboard", icon: "📊", roles: ["admin", "organization", "teamleader", "student", "agent"] },
  { href: "/dashboard/my-work", label: "My Workspace", icon: "💼", roles: ["student"] },
  { href: "/dashboard/applications", label: "Applications", icon: "📋", roles: ["admin", "organization"] },
  { href: "/dashboard/interviews", label: "Interviews", icon: "🎤", roles: ["admin", "organization", "student"] },
  { href: "/dashboard/programs", label: "Programs", icon: "📚", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/students", label: "Students", icon: "👥", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/attendance", label: "Attendance", icon: "📅", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/tasks", label: "Tasks", icon: "📝", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/reviews", label: "Review Tasks", icon: "✅", roles: ["teamleader", "admin"] },
  { href: "/dashboard/quizzes", label: "Quizzes", icon: "🧠", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/resources", label: "Study Material", icon: "🎥", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/discussions", label: "Discussions", icon: "💬", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/progress", label: "Progress Tracker", icon: "📊", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/live-sessions", label: "Live Sessions", icon: "📹", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: "🏆", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/reports", label: "Reports", icon: "📑", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/completion", label: "Completion Approval", icon: "🎓", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/letters", label: "Letters", icon: "📋", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/payments", label: "Payments", icon: "💰", roles: ["admin", "organization"] },
  { href: "/dashboard/documents", label: "My Documents", icon: "📄", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/announcements", label: "Announcements", icon: "📢", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/jobs", label: "Job Board", icon: "💼", roles: ["admin", "organization", "student"] },
  { href: "/dashboard/team-leaders", label: "Team Leaders", icon: "👔", roles: ["admin", "organization"] },
  { href: "/dashboard/agents", label: "Agents", icon: "🤝", roles: ["admin", "organization", "agent"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📈", roles: ["admin", "organization"] },
  { href: "/dashboard/attendance-analytics", label: "Attendance Analytics", icon: "📊", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/campaigns", label: "Email Campaigns", icon: "📧", roles: ["admin", "organization"] },
  { href: "/dashboard/testimonials", label: "Testimonials", icon: "⭐", roles: ["admin", "organization"] },
  { href: "/dashboard/users", label: "User Management", icon: "🔑", roles: ["admin"] },
  { href: "/dashboard/chat", label: "Chat / Support", icon: "💬", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/activity-log", label: "Activity Log", icon: "📋", roles: ["admin", "organization"] },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️", roles: ["admin", "organization"] },
];

const bottomNavItems = [
  { href: "/dashboard/profile", label: "My Profile", icon: "👤", roles: ["student"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Responsive: detect mobile and auto-close sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch notifications periodically
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      fetch("/api/notifications").then(r => r.json()).then(data => {
        if (data.notifications) setNotifications(data.notifications);
        if (typeof data.unreadCount === "number") setUnreadCount(data.unreadCount);
      }).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

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
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-[#1e1b4b] transition-all duration-300 flex flex-col ${
          isMobile ? (sidebarOpen ? 'z-50 translate-x-0' : 'z-50 -translate-x-full') : 'z-30'
        }`}
        style={{ width: isMobile ? '280px' : (sidebarOpen ? '256px' : '80px') }}
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
                onClick={() => { if (isMobile) setSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                  isActive ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                )}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {(sidebarOpen || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-indigo-800 space-y-1">
          {bottomNavItems.filter(item => item.roles.includes(user.role)).map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                  isActive ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800 hover:text-white")}>
                <span className="text-lg shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
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
        style={{ marginLeft: isMobile ? 0 : (sidebarOpen ? '256px' : '80px') }}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
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
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium capitalize">
              {user.role} Dashboard
            </Link>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b flex items-center justify-between">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>}
                  </div>
                  <div className="divide-y">
                    {notifications.slice(0, 10).map(n => (
                      <div key={n.id} className={`p-3 text-sm ${!n.isRead ? "bg-indigo-50" : ""}`}>
                        <p className="font-medium text-gray-900">{n.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                        <p className="text-gray-400 text-[10px] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">No notifications</div>}
                  </div>
                </div>
              )}
            </div>
            <Link href={user.role === "student" ? "/dashboard/profile" : "/dashboard/settings"} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
