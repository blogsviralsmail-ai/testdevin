import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Radio, Video, CreditCard, User, MessageSquare,
  LogOut, Menu, Moon, Sun, ChevronDown, Search,
  Users, Settings, BarChart3, Package, ShoppingCart, MonitorPlay,
  Globe, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const isAdminOrMod = isAdmin || isModerator;
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Cmd+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(p => !p);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/live-slots', icon: Radio, label: 'Live Slots' },
    { to: '/videos', icon: Video, label: 'Videos' },
    { to: '/billing', icon: CreditCard, label: 'Billing' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Role-based admin menu: moderators see limited set
  const allAdminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'moderator'] },
    { to: '/admin/users', icon: Users, label: 'Users', roles: ['admin', 'moderator'] },
    { to: '/admin/slots', icon: Radio, label: 'Slots', roles: ['admin', 'moderator'] },
    { to: '/admin/videos', icon: MonitorPlay, label: 'Videos', roles: ['admin', 'moderator'] },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders', roles: ['admin', 'moderator'] },
    { to: '/admin/products', icon: Package, label: 'Plans', roles: ['admin'] },
    { to: '/admin/contacts', icon: MessageSquare, label: 'Messages', roles: ['admin', 'moderator'] },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin'] },
    { to: '/admin/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  ];
  const adminLinks = allAdminLinks.filter(link => link.roles.includes(user?.role || 'user'));

  const links = isAdminRoute ? adminLinks : userLinks;
  const allLinks = [...userLinks, ...adminLinks];

  const [cmdSearch, setCmdSearch] = useState('');
  const cmdFiltered = allLinks.filter(l => l.label.toLowerCase().includes(cmdSearch.toLowerCase()));

  const handleCmdNav = useCallback((to: string) => {
    navigate(to);
    setCmdOpen(false);
    setCmdSearch('');
  }, [navigate]);

  return (
    <div className="min-h-screen flex surface-base">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 sidebar-premium flex flex-col transition-all duration-200 ${
          collapsed ? 'w-[52px]' : 'w-[220px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-12 flex items-center px-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <Link to={isAdminRoute ? '/admin' : '/dashboard'} className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">S</span>
            </div>
            {!collapsed && <span className="text-sm font-semibold truncate text-primary">StreamAdda</span>}
          </Link>
        </div>

        {/* Panel switch */}
        {isAdminOrMod && !collapsed && (
          <div className="px-2 pt-2">
            <Link
              to={isAdminRoute ? '/dashboard' : '/admin'}
              className="flex items-center justify-center text-[11px] font-medium px-2 py-1.5 rounded-md text-secondary hover:text-primary"
              style={{ background: 'rgb(var(--bg-muted))' }}
            >
              {isAdminRoute ? '\u2190 User Panel' : '\u2192 Admin Panel'}
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
          <div className="space-y-0.5 px-2">
            {links.map((link) => {
              const isActive = location.pathname === link.to ||
                (link.to !== '/admin' && link.to !== '/dashboard' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? link.label : undefined}
                >
                  <link.icon size={16} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{link.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="p-2 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
          {!collapsed && (
            <button
              onClick={logout}
              className="sidebar-nav-item w-full text-left hover:!text-red-400"
            >
              <LogOut size={16} className="flex-shrink-0" />
              <span>Logout</span>
            </button>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="sidebar-nav-item w-full justify-center lg:justify-start mt-0.5 hidden lg:flex"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-12 flex items-center px-4 border-b sticky top-0 z-30 surface-base" style={{ borderColor: 'rgb(var(--border))' }}>
          <button className="lg:hidden mr-3 p-1 rounded-md btn-premium-ghost" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>

          {/* Search / Cmd+K trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-tertiary hover:text-secondary transition-colors"
            style={{ background: 'rgb(var(--bg-muted))', border: '1px solid rgb(var(--border))' }}
          >
            <Search size={13} />
            <span>Search...</span>
            <div className="flex items-center gap-0.5 ml-4">
              <span className="kbd">\u2318</span>
              <span className="kbd">K</span>
            </div>
          </button>

          <div className="flex-1" />

          {/* Language */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="p-1.5 rounded-md btn-premium-ghost text-xs font-medium"
          >
            <Globe size={15} />
          </button>

          {/* Theme */}
          <button onClick={toggleDarkMode} className="p-1.5 rounded-md btn-premium-ghost ml-0.5">
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* User menu */}
          <div className="relative ml-1.5">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-md btn-premium-ghost"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-semibold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <span className="text-xs font-medium hidden sm:block text-secondary">
                {user?.firstName}
              </span>
              <ChevronDown size={12} className="text-tertiary" />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 w-48 rounded-lg overflow-hidden z-50 card-premium"
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                      <p className="text-xs font-medium text-primary">{user?.firstName} {user?.lastName}</p>
                      <p className="text-[11px] text-tertiary">{user?.email}</p>
                    </div>
                    <Link to="/profile" className="block px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-[rgb(var(--bg-muted))] transition-colors"
                      onClick={() => setDropdownOpen(false)}>Profile</Link>
                    {isAdminOrMod && (
                      <Link to={isAdminRoute ? '/dashboard' : '/admin'}
                        className="block px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-[rgb(var(--bg-muted))] transition-colors"
                        onClick={() => setDropdownOpen(false)}>
                        {isAdminRoute ? 'User Panel' : 'Admin Panel'}
                      </Link>
                    )}
                    <button onClick={logout} className="block w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                      Log out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {cmdOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="cmd-overlay"
            onClick={() => setCmdOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15 }}
              className="cmd-dialog"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center px-4 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <Search size={16} className="text-tertiary mr-3 flex-shrink-0" />
                <input
                  autoFocus
                  value={cmdSearch}
                  onChange={e => setCmdSearch(e.target.value)}
                  placeholder="Search pages..."
                  className="flex-1 py-3.5 bg-transparent text-sm text-primary placeholder:text-tertiary outline-none"
                />
                <span className="kbd text-[10px]">ESC</span>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {cmdFiltered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-tertiary">No results found.</p>
                ) : (
                  cmdFiltered.map(link => (
                    <button
                      key={link.to}
                      onClick={() => handleCmdNav(link.to)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-secondary hover:text-primary hover:bg-[rgb(var(--bg-muted))] transition-colors text-left"
                    >
                      <link.icon size={15} className="flex-shrink-0 text-tertiary" />
                      <span>{link.label}</span>
                      <span className="ml-auto text-[10px] text-tertiary">{link.to}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
