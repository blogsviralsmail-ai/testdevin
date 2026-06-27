import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, MessageSquare, Users, Send, Bot, Workflow, FileText,
  MessageCircle, FormInput, GitBranch, Building, CreditCard, Receipt,
  ShoppingBag, Facebook, Instagram, FileCode, BookOpen, Settings, UserCog,
  TrendingUp, BarChart3, Link2, Package, ChevronLeft, ChevronRight, Phone
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { section: 'Main', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
  ]},
  { section: 'Messaging', items: [
    { to: '/campaigns', icon: Send, label: 'Campaigns' },
    { to: '/bot-reply', icon: Bot, label: 'Bot Reply' },
    { to: '/bot-flow', icon: Workflow, label: 'Bot Flow' },
    { to: '/templates', icon: FileText, label: 'Templates' },
    { to: '/preset-messages', icon: MessageCircle, label: 'Preset Messages' },
  ]},
  { section: 'Automation', items: [
    { to: '/forms', icon: FormInput, label: 'Forms' },
    { to: '/flows', icon: GitBranch, label: 'WhatsApp Flows' },
    { to: '/marketing', icon: TrendingUp, label: 'Marketing' },
  ]},
  { section: 'Business', items: [
    { to: '/vendors', icon: Building, label: 'Vendors', adminOnly: true },
    { to: '/subscription', icon: CreditCard, label: 'Subscription' },
    { to: '/invoices', icon: Receipt, label: 'Invoices' },
    { to: '/payment-links', icon: Link2, label: 'Payment Links' },
    { to: '/product-catalog', icon: Package, label: 'Products' },
    { to: '/integrations', icon: ShoppingBag, label: 'Integrations' },
  ]},
  { section: 'Channels', items: [
    { to: '/facebook', icon: Facebook, label: 'Facebook' },
    { to: '/instagram', icon: Instagram, label: 'Instagram' },
  ]},
  { section: 'Content', items: [
    { to: '/pages', icon: FileCode, label: 'Pages' },
    { to: '/blog', icon: BookOpen, label: 'Blog' },
  ]},
  { section: 'System', items: [
    { to: '/users', icon: UserCog, label: 'Users', adminOnly: true },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 1;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-white transition-all duration-250
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!collapsed && <span className="text-xl font-bold text-emerald-400">WabaPanel</span>}
        {collapsed && <span className="text-xl font-bold text-emerald-400 mx-auto">W</span>}
        <button onClick={onToggle} className="hidden lg:block text-white/60 hover:text-white p-1">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((section) => (
          <div key={section.section} className="mb-4">
            {!collapsed && (
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                {section.section}
              </span>
            )}
            <div className="mt-2 space-y-0.5">
              {section.items
                .filter((item) => !('adminOnly' in item && item.adminOnly) || isAdmin)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                      ${isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-l-3 border-emerald-400'
                        : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
                      }
                      ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    <item.icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
