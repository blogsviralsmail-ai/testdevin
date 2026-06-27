import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, MessageSquare, Users, Send, Bot, Workflow, FileText,
  MessageCircle, FormInput, GitBranch, Building, CreditCard, Receipt,
  ShoppingBag, Facebook, Instagram, FileCode, BookOpen, Settings, UserCog,
  TrendingUp, BarChart3, Link2, Package, ChevronLeft, ChevronRight, Phone,
  Languages, Mail, Puzzle, Globe, RefreshCw, ShoppingCart, ClipboardList,
  Cake, UsersRound, ScrollText, Droplets, QrCode, ChevronDown,
  Megaphone, PiggyBank, Rocket, Zap, Brain, Tag, Table2, Key,
  Smartphone, ArrowUpCircle, DollarSign, Share2, MoreHorizontal, Wrench,
  Crown, Inbox, MousePointerClick, FileBarChart, Bell, Code, Store, Shuffle
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavChild {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface NavItem {
  to?: string;
  icon: LucideIcon;
  label: string;
  adminOnly?: boolean;
  vendorOnly?: boolean;
  children?: NavChild[];
  external?: boolean;
}

function SubMenu({ item, collapsed, onMobileClose }: { item: NavItem; collapsed: boolean; onMobileClose: () => void }) {
  const location = useLocation();
  const isChildActive = item.children?.some(c => location.pathname.startsWith(c.to)) ?? false;
  const [open, setOpen] = useState(isChildActive);

  if (!item.children) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
          ${isChildActive ? 'text-emerald-400' : 'text-white/70 hover:bg-sidebar-hover hover:text-white'}
          ${collapsed ? 'justify-center' : ''}`}
      >
        <item.icon size={18} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="ml-4 pl-3 border-l border-white/10 mt-1 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors
                ${isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-white/60 hover:bg-sidebar-hover hover:text-white'}`
              }
            >
              <child.icon size={14} />
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

const adminItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendors', icon: Building, label: 'Vendors' },
  { icon: CreditCard, label: 'Subscriptions', children: [
    { to: '/subscription/auto', icon: RefreshCw, label: 'Auto' },
    { to: '/subscription/manual', icon: DollarSign, label: 'Manual' },
    { to: '/subscription', icon: Tag, label: 'Plans & Pricing' },
  ]},
  { to: '/translations', icon: Languages, label: 'Translations' },
  { to: '/blog', icon: BookOpen, label: 'Blog' },
  { to: '/contact-inquiries', icon: Mail, label: 'Contact Inquiries' },
  { to: '/invoices', icon: Receipt, label: 'Billing & Invoices' },
  { to: '/addons', icon: Puzzle, label: 'Addons' },
  { to: '/mobile-app', icon: Smartphone, label: 'Mobile App' },
  { to: '/update-panel', icon: ArrowUpCircle, label: 'Update Panel' },
  { to: '/one-click-signup', icon: MousePointerClick, label: 'One-Click Signup' },
  { to: '/site-settings', icon: Globe, label: 'Site Settings' },
  { icon: Settings, label: 'Configuration', children: [
    { to: '/config/user-vendor', icon: UserCog, label: 'User & Vendor' },
    { to: '/config/currency', icon: DollarSign, label: 'Currency' },
    { to: '/config/payment', icon: CreditCard, label: 'Payment' },
    { to: '/config/email', icon: Mail, label: 'Email' },
    { to: '/config/social-login', icon: Share2, label: 'Social Login' },
    { to: '/config/other', icon: MoreHorizontal, label: 'Other' },
    { to: '/config/misc', icon: Wrench, label: 'Misc' },
  ]},
  { to: '/api-docs', icon: Code, label: 'API Documentation' },
  { to: '/licence', icon: Key, label: 'Licence' },
];

const vendorItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Inbox, label: 'Inbox', children: [
    { to: '/chat', icon: MessageSquare, label: 'WhatsApp Messages' },
    { to: '/facebook', icon: Facebook, label: 'Facebook Messages' },
    { to: '/instagram', icon: Instagram, label: 'Instagram Messages' },
  ]},
  { icon: Megaphone, label: 'Marketing & Campaigns', children: [
    { to: '/campaigns', icon: Send, label: 'Campaign Manager' },
    { to: '/drip-campaigns', icon: Droplets, label: 'Drip Campaigns' },
    { to: '/templates', icon: FileText, label: 'Message Templates' },
    { to: '/forms', icon: FormInput, label: 'WhatsApp Forms' },
  ]},
  { icon: PiggyBank, label: 'Save Money Free Campaign', children: [
    { to: '/preset-campaigns', icon: Rocket, label: 'Preset Campaigns' },
    { to: '/preset-messages', icon: MessageCircle, label: 'Preset Template' },
  ]},
  { to: '/auto-followup', icon: RefreshCw, label: 'Auto Follow-up' },
  { to: '/ecommerce', icon: ShoppingCart, label: 'E-Commerce' },
  { to: '/payment-links', icon: Link2, label: 'Payment Links' },
  { to: '/feedback', icon: ClipboardList, label: 'Feedback/Survey' },
  { to: '/birthday-wishes', icon: Cake, label: 'Birthday Wishes' },
  { icon: TrendingUp, label: 'Marketing', children: [
    { to: '/marketing/ctwa', icon: MousePointerClick, label: 'Click To WhatsApp Ads' },
    { to: '/marketing/lead-forms', icon: FileBarChart, label: 'Lead Generation Forms' },
    { to: '/marketing/catalogs', icon: Package, label: 'Product Catalogs' },
    { to: '/marketing/events', icon: Bell, label: 'Event Notifications' },
    { to: '/marketing/api', icon: Code, label: 'API Integration' },
  ]},
  { icon: Brain, label: 'AI & Automation', children: [
    { to: '/ai-call', icon: Phone, label: 'AI Call Assistant' },
    { to: '/bot-reply', icon: Bot, label: 'Chatbot Rules' },
    { to: '/bot-flow', icon: Workflow, label: 'Flows Builder' },
    { to: '/auto-followup', icon: Shuffle, label: 'Automation Flows' },
  ]},
  { icon: Store, label: 'Store & Orders', children: [
    { to: '/product-catalog', icon: Package, label: 'Product Catalog' },
    { to: '/whatsapp-orders', icon: Receipt, label: 'Product Orders' },
    { to: '/integrations/shopify', icon: ShoppingBag, label: 'Shopify Integration' },
    { to: '/integrations/woocommerce', icon: ShoppingBag, label: 'WooCommerce' },
  ]},
  { icon: Users, label: 'Contacts & Labels', children: [
    { to: '/contacts', icon: Users, label: 'Contact List' },
    { to: '/contact-groups', icon: UsersRound, label: 'Contact Groups' },
    { to: '/contact-fields', icon: FileText, label: 'Custom Attributes' },
    { to: '/labels', icon: Tag, label: 'Labels' },
  ]},
  { icon: GitBranch, label: 'Integrations', children: [
    { to: '/integrations/google-sheets', icon: Table2, label: 'Google Sheets' },
    { to: '/integrations/api-access', icon: Key, label: 'API Access' },
  ]},
  { to: '/team', icon: UsersRound, label: 'Team Management' },
  { to: '/message-logs', icon: ScrollText, label: 'Message Logs' },
  { to: '/invoices', icon: Receipt, label: 'Billing & My Invoices' },
  { icon: Settings, label: 'Settings', children: [
    { to: '/settings/general', icon: Settings, label: 'General Settings' },
    { to: '/settings/whatsapp', icon: MessageSquare, label: 'WhatsApp Configuration' },
    { to: '/settings/facebook', icon: Facebook, label: 'Facebook Configuration' },
    { to: '/settings/instagram', icon: Instagram, label: 'Instagram Configuration' },
    { to: '/settings/ai-bot', icon: Brain, label: 'AI Bot Settings' },
    { to: '/api-docs', icon: Code, label: 'API Documentation' },
  ]},
  { to: '/subscription', icon: Crown, label: 'My Subscription' },
  { to: '/qr-code', icon: QrCode, label: 'QR Code' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 1;
  const items = isAdmin ? adminItems : vendorItems;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-white transition-all duration-250
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!collapsed && <span className="text-xl font-bold text-emerald-400">WabaPanel</span>}
        {collapsed && <span className="text-xl font-bold text-emerald-400 mx-auto">W</span>}
        <button onClick={onToggle} className="hidden lg:block text-white/60 hover:text-white p-1">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          if (item.children) {
            return <SubMenu key={item.label} item={item} collapsed={collapsed} onMobileClose={onMobileClose} />;
          }
          return (
            <NavLink
              key={item.to! + item.label}
              to={item.to!}
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
          );
        })}
      </nav>
    </aside>
  );
}
