import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Radio, Video, CreditCard, User, MessageSquare,
  LogOut, Menu, X, Moon, Sun, ChevronDown,
  Users, Settings, BarChart3, Package, ShoppingCart, MonitorPlay
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, settings, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/live-slots', icon: Radio, label: 'Live Slots' },
    { to: '/videos', icon: Video, label: 'Videos' },
    { to: '/billing', icon: CreditCard, label: 'Billing' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/slots', icon: Radio, label: 'Slots' },
    { to: '/admin/videos', icon: MonitorPlay, label: 'Videos' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/products', icon: Package, label: 'Plans' },
    { to: '/admin/contacts', icon: MessageSquare, label: 'Messages' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const links = isAdminRoute ? adminLinks : userLinks;
  const brandName = settings?.brandName || 'KKHS Media';
  const primaryColor = settings?.primaryColor || '#6366f1';

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <Link to={isAdminRoute ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={brandName} className="h-8" />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
                {brandName.charAt(0)}
              </div>
            )}
            <span className="font-bold text-lg">{brandName}</span>
          </Link>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {isAdmin && (
            <div className="px-4 mb-3">
              <Link
                to={isAdminRoute ? '/dashboard' : '/admin'}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: primaryColor + '20', color: primaryColor }}
              >
                {isAdminRoute ? '← User Panel' : '→ Admin Panel'}
              </Link>
            </div>
          )}
          {links.map((link) => {
            const isActive = location.pathname === link.to || 
              (link.to !== '/admin' && link.to !== '/dashboard' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-r-2 text-white'
                    : darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: primaryColor + '15', borderRightColor: primaryColor, color: primaryColor } : {}}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={logout}
            className={`flex items-center gap-2 text-sm w-full px-2 py-2 rounded-lg ${
              darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className={`h-16 flex items-center px-4 lg:px-6 border-b sticky top-0 z-30 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg mr-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {user?.firstName} {user?.lastName}
              </span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border z-50 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <Link to="/profile" className={`block px-4 py-2 text-sm ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    onClick={() => setDropdownOpen(false)}>
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link to={isAdminRoute ? '/dashboard' : '/admin'}
                      className={`block px-4 py-2 text-sm ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      onClick={() => setDropdownOpen(false)}>
                      {isAdminRoute ? 'User Panel' : 'Admin Panel'}
                    </Link>
                  )}
                  <button onClick={logout} className={`block w-full text-left px-4 py-2 text-sm text-red-500 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
