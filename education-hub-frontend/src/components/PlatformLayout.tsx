import { useState } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Building2, Server, LogOut, Menu, X, GraduationCap, ChevronDown } from "lucide-react";

function getPlatformUser() {
  const u = localStorage.getItem("platform_user");
  return u ? JSON.parse(u) : null;
}

function platformLogout() {
  localStorage.removeItem("platform_token");
  localStorage.removeItem("platform_user");
  window.location.href = "/platform/login";
}

const menuItems = [
  { path: "/platform", label: "Dashboard", icon: LayoutDashboard },
  { path: "/platform/tenants", label: "Tenants", icon: Building2 },
  { path: "/platform/installations", label: "Remote Servers", icon: Server },
];

export default function PlatformLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const user = getPlatformUser();

  if (!user || !localStorage.getItem("platform_token")) {
    return <Navigate to="/platform/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-16 px-4 bg-slate-800">
          <Link to="/platform" className="flex items-center gap-2">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold block leading-tight">EduHub SaaS</span>
              <span className="text-xs text-blue-300">Platform Admin</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-gray-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
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
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.[0] || "A"}
              </div>
              <span className="hidden sm:block">{user?.name || "Admin"}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <button onClick={platformLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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
