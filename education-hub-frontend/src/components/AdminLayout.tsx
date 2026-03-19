import { useState, useEffect, useMemo } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { logout, getUser } from "../lib/api";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";
import {
  LayoutDashboard, GraduationCap, Building2, FolderOpen, Users,
  ClipboardList, Wallet, LifeBuoy, FileText, GitBranch,
  Settings, MessageSquare, Menu, X, LogOut, ChevronDown, UsersRound, Star, Shield,
  Upload, Tag, Search,
  FileText as BlogIcon, Image, Briefcase, Target, BarChart3, Megaphone, Bell, ChevronRight
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

// Map menu paths to permission module names
const pathToPermission: Record<string, string> = {
  "/admin": "dashboard",
  "/admin/analytics": "dashboard",
  "/admin/universities": "universities",
  "/admin/categories": "categories",
  "/admin/exams": "exams",
  "/admin/students": "students",
  "/admin/student-status": "students",
  "/admin/leads": "enquiries",
  "/admin/enquiries": "enquiries",
  "/admin/bulk-upload": "students",
  "/admin/accounts": "accounts",
  "/admin/communication": "support",
  "/admin/support": "support",
  "/admin/notices": "support",
  "/admin/popups": "support",
  "/admin/blog": "testimonials",
  "/admin/gallery": "testimonials",
  "/admin/testimonials": "testimonials",
  "/admin/placements": "students",
  "/admin/careers": "students",
  "/admin/team": "team",
  "/admin/documents": "documents",
  "/admin/branches": "branches",
  "/admin/roles": "roles",
  "/admin/settings": "settings",
  "/admin/centers": "dashboard",
  "/admin/commission-slabs": "dashboard",
};

const menuGroups: MenuGroup[] = [
  {
    title: "Overview",
    items: [
      { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Academics",
    items: [
      { path: "/admin/universities", label: "Universities", icon: Building2 },
      { path: "/admin/categories", label: "Courses / Categories", icon: FolderOpen },
      { path: "/admin/exams", label: "Exams", icon: ClipboardList },
    ],
  },
  {
    title: "Students & CRM",
    items: [
      { path: "/admin/students", label: "Students", icon: Users },
      { path: "/admin/student-status", label: "Student Status", icon: Tag },
      { path: "/admin/leads", label: "Leads / CRM", icon: Target },
      { path: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
      { path: "/admin/bulk-upload", label: "Bulk Upload", icon: Upload },
    ],
  },
  {
    title: "Finance",
    items: [
      { path: "/admin/accounts", label: "Accounts", icon: Wallet },
    ],
  },
  {
    title: "Communication",
    items: [
      { path: "/admin/communication", label: "Messages & Channels", icon: Megaphone },
      { path: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
      { path: "/admin/notices", label: "Notice Board", icon: Megaphone },
      { path: "/admin/popups", label: "Pop-up Notifications", icon: Bell },
    ],
  },
  {
    title: "Content",
    items: [
      { path: "/admin/blog", label: "Blog", icon: BlogIcon },
      { path: "/admin/gallery", label: "Gallery", icon: Image },
      { path: "/admin/testimonials", label: "Testimonials", icon: Star },
      { path: "/admin/placements", label: "Placements", icon: Briefcase },
      { path: "/admin/careers", label: "Careers", icon: Briefcase },
      { path: "/admin/team", label: "Team", icon: UsersRound },
    ],
  },
  {
    title: "Centers",
    items: [
      { path: "/admin/centers", label: "Centers Management", icon: Building2 },
      { path: "/admin/commission-slabs", label: "Deal Fees", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { path: "/admin/documents", label: "Documents", icon: FileText },
      { path: "/admin/branches", label: "Branches", icon: GitBranch },
      { path: "/admin/roles", label: "Roles & Permissions", icon: Shield },
      { path: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const user = getUser();

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(r => {
      setSiteSettings(r.data || {});
    }).catch(() => {});
  }, []);

  // Filter menu based on user's role permissions
  const permissionFilteredGroups = useMemo(() => {
    const perms = user?.permissions as Record<string, boolean> | undefined;
    const role = user?.role as string | undefined;
    // super_admin and admin get full access; only filter for custom roles with permissions
    if (!perms || role === "super_admin" || role === "admin") return menuGroups;
    return menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          const perm = pathToPermission[item.path];
          if (!perm) return true; // no mapping = always show
          return perms[perm] === true;
        }),
      }))
      .filter(group => group.items.length > 0);
  }, [user]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return permissionFilteredGroups;
    const q = searchQuery.toLowerCase();
    return permissionFilteredGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.label.toLowerCase().includes(q)),
      }))
      .filter(group => group.items.length > 0);
  }, [searchQuery, permissionFilteredGroups]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-16 px-4 bg-slate-800">
          <Link to="/admin" className="flex items-center gap-2">
            {siteSettings.navbar_logo_url || siteSettings.logo_url ? (
              <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 p-0.5">
                <img src={(siteSettings.navbar_logo_url || siteSettings.logo_url || "").startsWith("/") ? API + (siteSettings.navbar_logo_url || siteSettings.logo_url) : (siteSettings.navbar_logo_url || siteSettings.logo_url)} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <GraduationCap className="h-8 w-8 text-blue-400" />
            )}
            <span className="text-lg font-bold">{(siteSettings.site_name || "Education Hub").split(" - ")[0]}</span>
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
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
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
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                              : "text-gray-300 hover:bg-slate-800 hover:text-white"
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
          {filteredGroups.length === 0 && searchQuery && (
            <div className="px-3 py-8 text-center">
              <Search className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No menu items found</p>
              <p className="text-xs text-gray-600 mt-1">Try a different search term</p>
            </div>
          )}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
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
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                {user?.name?.[0] || "A"}
              </div>
              <span className="hidden sm:block max-w-[150px] truncate">{user?.name || "Admin"}</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || user?.role}</p>
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
