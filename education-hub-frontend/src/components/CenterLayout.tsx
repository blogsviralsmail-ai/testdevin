import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { logout, getUser } from "../lib/api";
import api from "../lib/api";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";
import {
  LayoutDashboard, Users, FileText, Wallet, Building2,
  Menu, X, LogOut, ChevronDown, GraduationCap, BarChart3, ChevronRight, Search, CreditCard, MessageSquare, Bell, Calendar, Settings, PhoneCall
} from "lucide-react";

interface MenuItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Overview",
    items: [
      { path: "/center", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Student Management",
    items: [
      { path: "/center/students", label: "Students", icon: Users },
      { path: "/center/counselor-leads", label: "Counselor Leads", icon: PhoneCall },
      { path: "/center/documents", label: "Documents", icon: FileText },
      { path: "/center/fees", label: "Fees", icon: Wallet },
      { path: "/center/payment-settings", label: "Payment Settings", icon: CreditCard },
    ],
  },
  {
    title: "Network",
    items: [
      { path: "/center/sub-centers", label: "Sub-centers", icon: Building2 },
    ],
  },
  {
    title: "Commission",
    items: [
      { path: "/center/deal-fees", label: "Deal Fees", icon: Wallet },
      { path: "/center/commission", label: "Commission Report", icon: BarChart3 },
      { path: "/center/fees-chain", label: "Fees Chain", icon: Building2 },
    ],
  },
  {
    title: "Communication",
    items: [
      { path: "/center/announcements", label: "Announcements", icon: Bell },
    ],
  },
  {
    title: "Exams",
    items: [
      { path: "/center/exam-timetable", label: "Exam Timetable", icon: Calendar },
    ],
  },
  {
    title: "Support",
    items: [
      { path: "/center/support", label: "Support Tickets", icon: MessageSquare },
    ],
  },
  {
    title: "Settings",
    items: [
      { path: "/center/roles", label: "Roles & Team", icon: Users },
      { path: "/center/settings", label: "Center Settings", icon: Settings },
    ],
  },
];

export default function CenterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [popups, setPopups] = useState<any[]>([]);
  const [activePopup, setActivePopup] = useState<any | null>(null);
  const location = useLocation();
  const user = getUser();

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(r => {
      setSiteSettings(r.data || {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/api/popups").then(r => {
      const list = Array.isArray(r.data) ? r.data : [];
      setPopups(list);
      setActivePopup(list[0] || null);
    }).catch(() => {});
  }, []);

  const dismissPopup = async () => {
    if (!activePopup) return;
    const pid = activePopup.id;
    try {
      await api.post(`/api/popups/${pid}/dismiss`, {});
    } catch (e) {
      // ignore
    }
    const next = popups.filter(p => p.id !== pid);
    setPopups(next);
    setActivePopup(next[0] || null);
  };

  const filteredGroups = searchQuery.trim()
    ? menuGroups
        .map(group => ({
          ...group,
          items: group.items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())),
        }))
        .filter(group => group.items.length > 0)
    : menuGroups;

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full overflow-x-hidden">
      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={dismissPopup} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{activePopup.title || "Announcement"}</h2>
              </div>
              <button onClick={dismissPopup} className="p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {activePopup.image_url && (
              <img
                src={(activePopup.image_url || "").startsWith("/") ? API + activePopup.image_url : activePopup.image_url}
                alt={activePopup.title || "Popup"}
                className="mt-3 w-full max-h-64 object-contain rounded-lg border"
              />
            )}

            {activePopup.content && (
              <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{activePopup.content}</div>
            )}

            {activePopup.link_url && (
              <a
                href={activePopup.link_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-900"
              >
                {activePopup.link_text || "Open link"}
              </a>
            )}

            <div className="mt-5 flex justify-end">
              <button onClick={dismissPopup} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-64 bg-emerald-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:relative lg:inset-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-16 px-4 bg-emerald-800">
          <Link to="/center" className="flex flex-wrap items-center gap-2">
            {siteSettings.navbar_logo_url || siteSettings.logo_url ? (
              <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 p-0.5">
                <img src={(siteSettings.navbar_logo_url || siteSettings.logo_url || "").startsWith("/") ? API + (siteSettings.navbar_logo_url || siteSettings.logo_url) : (siteSettings.navbar_logo_url || siteSettings.logo_url)} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <GraduationCap className="h-8 w-8 text-emerald-400" />
            )}
            <div>
              <span className="text-base font-bold block leading-tight">Center Panel</span>
              <span className="text-xs text-emerald-300 block leading-tight">{user?.center?.name || user?.name || ""}</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-emerald-800 border border-emerald-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="mt-2 px-2 overflow-y-auto h-[calc(100vh-8.5rem)] pb-4">
          {filteredGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.title] && !searchQuery;
            return (
              <div key={group.title} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider hover:text-emerald-100 transition-colors"
                >
                  {group.title}
                  {!searchQuery && (
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`} />
                  )}
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                              : "text-gray-300 hover:bg-emerald-800 hover:text-white"
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                {user?.name?.[0] || "C"}
              </div>
              <span className="hidden sm:block max-w-[150px] truncate">{user?.name || "Center"}</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.center?.name || "Center"}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.center?.mobile || user?.phone}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
