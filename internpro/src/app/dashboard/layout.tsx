"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import PaymentWall from "@/components/PaymentWall";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

const navItems = [
  // Core
  { href: "/dashboard", label: "Dashboard", icon: "📊", roles: ["admin", "organization", "teamleader", "student", "agent"] },
  { href: "/dashboard/my-work", label: "My Workspace", icon: "💼", roles: ["student"] },

  // Recruitment
  { href: "/dashboard/applications", label: "Applications", icon: "📋", roles: ["admin", "organization"] },
  { href: "/dashboard/interviews", label: "Interviews", icon: "🎤", roles: ["admin", "organization", "student"] },
  { href: "/dashboard/students", label: "Students", icon: "👥", roles: ["admin", "organization", "teamleader"] },

  // Academics
  { href: "/dashboard/programs", label: "Programs", icon: "📚", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/course-content", label: "Course Content", icon: "📖", roles: ["admin", "organization", "teamleader"] },
  { href: "/dashboard/reviews", label: "Reviews", icon: "✅", roles: ["teamleader", "admin"] },
  { href: "/dashboard/live-sessions", label: "Live Sessions", icon: "📹", roles: ["admin", "organization", "teamleader", "student"] },

  // Tracking
  { href: "/dashboard/attendance", label: "Attendance", icon: "📅", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/progress", label: "Progress", icon: "📈", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/reports", label: "Reports", icon: "📑", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: "🏆", roles: ["admin", "organization", "teamleader", "student"] },

  // Documents & Letters
  { href: "/dashboard/letters", label: "Letters", icon: "📄", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/documents", label: "Documents", icon: "📎", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/completion", label: "Completion", icon: "🎓", roles: ["admin", "organization", "teamleader"] },

  // HR & Finance
  { href: "/dashboard/salary", label: "Salary Management", icon: "💵", roles: ["admin", "organization"] },
  { href: "/dashboard/my-payslips", label: "My Payslips", icon: "💵", roles: ["student"] },
  { href: "/dashboard/leaves", label: "Leave Management", icon: "🏖️", roles: ["admin", "organization"] },
  { href: "/dashboard/my-leaves", label: "Leaves & Holidays", icon: "🏖️", roles: ["student"] },
  { href: "/dashboard/holidays", label: "Holiday Calendar", icon: "📅", roles: ["admin", "organization"] },
  { href: "/dashboard/payments", label: "Payments", icon: "💰", roles: ["admin", "organization"] },
  { href: "/dashboard/agents", label: "Agents", icon: "🤝", roles: ["admin", "organization", "agent"] },

  // Communication
  { href: "/dashboard/chat", label: "Live Chat", icon: "🗨️", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/discussions", label: "Discussions", icon: "💬", roles: ["admin", "organization", "teamleader", "student"] },
  { href: "/dashboard/announcements", label: "Announcements", icon: "📢", roles: ["admin", "organization", "teamleader", "student"] },

  // Analytics & Management
  { href: "/dashboard/analytics", label: "Analytics", icon: "📈", roles: ["admin", "organization"] },
  { href: "/dashboard/team-leaders", label: "Team Leaders", icon: "👔", roles: ["admin", "organization"] },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: "📧", roles: ["admin", "organization"] },
  { href: "/dashboard/jobs", label: "Job Board", icon: "💼", roles: ["admin", "organization", "student"] },
  { href: "/dashboard/testimonials", label: "Testimonials", icon: "⭐", roles: ["admin", "organization"] },
  { href: "/dashboard/activity-log", label: "Activity Log", icon: "🕐", roles: ["admin", "organization"] },
  { href: "/dashboard/users", label: "Users", icon: "🔑", roles: ["admin"] },
  { href: "/dashboard/role-management", label: "Role Management", icon: "🛡️", roles: ["admin"] },
  { href: "/dashboard/team-members", label: "Team Members", icon: "👥", roles: ["admin"] },
  { href: "/dashboard/inquiries", label: "Contact Inquiries", icon: "📩", roles: ["admin"] },
  { href: "/dashboard/site-content", label: "Site Content", icon: "🌐", roles: ["admin"] },
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
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      setUser(data.user);
      // Fetch user permissions
      const permRes = await fetch("/api/my-permissions");
      if (permRes.ok) {
        const permData = await permRes.json();
        setUserPermissions(permData.permissions || []);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [pathname]);

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

  // Auto attendance for students
  useEffect(() => {
    if (user?.role === "student") {
      const today = new Date().toISOString().split("T")[0];
      const key = `auto_attendance_${today}`;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      if (!sessionStorage.getItem(key)) {
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: today, status: "present", method: "auto", checkIn: timeStr }),
        }).then(() => sessionStorage.setItem(key, timeStr)).catch(() => {});
      }

      const updateCheckout = () => {
        const n = new Date();
        const co = `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: today, status: "present", method: "auto", checkOut: co }),
        }).catch(() => {});
      };
      updateCheckout();
      const onVisibility = () => { if (document.visibilityState === "hidden") updateCheckout(); };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("beforeunload", updateCheckout);
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 animate-pulse" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>IP</div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Permission-based nav filtering
  const navPermMap: Record<string, string> = {
    "/dashboard/applications": "applications.view",
    "/dashboard/interviews": "interviews.view",
    "/dashboard/students": "students.view",
    "/dashboard/programs": "programs.view",
    "/dashboard/course-content": "course_content.view",
    "/dashboard/reviews": "reviews.view",
    "/dashboard/live-sessions": "live_sessions.view",
    "/dashboard/attendance": "attendance.view",
    "/dashboard/progress": "progress.view",
    "/dashboard/reports": "reports.view",
    "/dashboard/leaderboard": "leaderboard.view",
    "/dashboard/letters": "letters.view",
    "/dashboard/documents": "documents.view",
    "/dashboard/completion": "completion.view",
    "/dashboard/salary": "salary.view",
    "/dashboard/leaves": "leaves.view",
    "/dashboard/holidays": "holidays.view",
    "/dashboard/payments": "payments.view",
    "/dashboard/agents": "agents.view",
    "/dashboard/chat": "chat.view",
    "/dashboard/discussions": "discussions.view",
    "/dashboard/announcements": "announcements.view",
    "/dashboard/analytics": "analytics.view",
    "/dashboard/team-leaders": "team_leaders.view",
    "/dashboard/campaigns": "campaigns.view",
    "/dashboard/jobs": "jobs.view",
    "/dashboard/testimonials": "testimonials.view",
    "/dashboard/activity-log": "activity_log.view",
    "/dashboard/users": "users.view",
    "/dashboard/role-management": "roles.view",
    "/dashboard/team-members": "site_content.manage",
    "/dashboard/inquiries": "site_content.manage",
    "/dashboard/site-content": "site_content.manage",
    "/dashboard/settings": "settings.view",
  };

  const hasPerm = (perm: string) => userPermissions.includes("*") || userPermissions.includes(perm);

  const filteredNav = navItems.filter((item) => {
    // Always show by role first (backward compatible)
    if (!item.roles.includes(user.role)) return false;
    // If permissions loaded, also check permission
    if (userPermissions.length > 0) {
      const requiredPerm = navPermMap[item.href];
      if (requiredPerm && !hasPerm(requiredPerm)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 transition-all duration-300 flex flex-col ${
          isMobile ? (sidebarOpen ? 'z-50 translate-x-0' : 'z-50 -translate-x-full') : 'z-30'
        }`}
        style={{
          width: isMobile ? '280px' : (sidebarOpen ? '260px' : '80px'),
          background: 'rgba(10,14,26,0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>IP</div>
          {(sidebarOpen || isMobile) && <span className="text-xl font-bold bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent">InternPro</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { if (isMobile) setSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white"
                )}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(14,165,184,0.2), rgba(167,139,250,0.1))',
                  border: '1px solid rgba(14,165,184,0.3)',
                  boxShadow: '0 4px 15px rgba(14,165,184,0.15), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                  transform: 'translateX(4px)',
                } : {
                  border: '1px solid transparent',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {(sidebarOpen || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Nav */}
        <div className="p-3 space-y-1" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
          {bottomNavItems.filter(item => item.roles.includes(user.role)).map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
                  isActive ? "text-white" : "text-slate-400 hover:text-white")}
                style={isActive ? {background: 'rgba(14,165,184,0.15)', border: '1px solid rgba(14,165,184,0.2)'} : {border: '1px solid transparent'}}>
                <span className="text-lg shrink-0">{item.icon}</span>
                {(sidebarOpen || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 transition-all text-sm w-full"
            style={{border: '1px solid transparent'}}
          >
            <span className="text-lg">🚪</span>
            {(sidebarOpen || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : (sidebarOpen ? '260px' : '80px') }}
      >
        {/* Top Bar */}
        <header className="px-3 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20" style={{background: 'rgba(10,14,26,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-sm font-medium text-white">{user.name}</h2>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-all" style={{background: 'rgba(14,165,184,0.1)', color: '#22d3ee', border: '1px solid rgba(14,165,184,0.2)'}}>
              {user.role} Dashboard
            </Link>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 text-white text-[10px] rounded-full flex items-center justify-center" style={{background: '#FF6B6B', boxShadow: '0 0 10px rgba(255,107,107,0.5)'}}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl z-50 max-h-96 overflow-y-auto" style={{background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
                  <div className="p-3 flex items-center justify-between" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                    <span className="font-semibold text-sm text-white">Notifications</span>
                    {unreadCount > 0 && <button onClick={markAllRead} className="text-xs hover:underline" style={{color: '#22d3ee'}}>Mark all read</button>}
                  </div>
                  <div>
                    {notifications.slice(0, 10).map(n => (
                      <div key={n.id} className="p-3 text-sm transition-colors" style={{borderBottom: '1px solid rgba(255,255,255,0.04)', background: !n.isRead ? 'rgba(14,165,184,0.05)' : 'transparent'}}>
                        <p className="font-medium text-white">{n.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{n.message}</p>
                        <p className="text-slate-600 text-[10px] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No notifications</div>}
                  </div>
                </div>
              )}
            </div>
            <Link href={user.role === "student" ? "/dashboard/profile" : "/dashboard/settings"} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>
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

      {/* Payment Wall for unpaid students */}
      {user.role === "student" && pathname !== "/dashboard/pay" && <PaymentWall />}
    </div>
  );
}
