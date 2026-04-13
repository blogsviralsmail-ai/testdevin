import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, Radio, Video, ShoppingCart, CreditCard, TrendingUp, Activity, ArrowUpRight, Zap, Package, BarChart3, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentUsers, setRecentUsers] = useState<Array<Record<string, string>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(res => {
      setStats(res.data.stats || res.data);
      setRecentUsers(res.data.recentUsers || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Users', key: 'totalUsers', icon: Users, color: 'from-indigo-500 to-indigo-600', trend: '+12%' },
    { label: 'Active Slots', key: 'activeSlots', icon: Radio, color: 'from-emerald-500 to-emerald-600', trend: '+8%' },
    { label: 'Streaming Now', key: 'streamingSlots', icon: Activity, color: 'from-rose-500 to-rose-600', trend: 'Live' },
    { label: 'Total Videos', key: 'totalVideos', icon: Video, color: 'from-purple-500 to-purple-600', trend: '+5%' },
    { label: 'Total Orders', key: 'totalOrders', icon: ShoppingCart, color: 'from-amber-500 to-amber-600', trend: '+15%' },
    { label: 'Revenue', key: 'totalRevenue', icon: CreditCard, color: 'from-cyan-500 to-cyan-600', trend: '+22%', isCurrency: true },
    { label: 'Paid Orders', key: 'paidOrders', icon: TrendingUp, color: 'from-teal-500 to-teal-600', trend: '+18%' },
    { label: 'Products', key: 'totalProducts', icon: Package, color: 'from-orange-500 to-orange-600', trend: 'Total' },
  ];

  return (
    <div className="space-y-8">
      {/* Header with gradient text */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-sm text-tertiary mt-1">Real-time platform overview and analytics</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
          <motion.div
            key={i}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[rgb(var(--bg-elevated))] to-[rgb(var(--bg-muted))] p-5 cursor-pointer group"
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-60 group-hover:opacity-100 transition-opacity`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-tertiary flex items-center gap-1">
                  {card.trend === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                  {card.trend}
                  {card.trend !== 'Live' && card.trend !== 'Total' && <ArrowUpRight size={10} />}
                </span>
              </div>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="skeleton h-8 w-20 mb-1 rounded-lg" />
                ) : (
                  <motion.div key="value" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                    className="text-2xl font-bold text-primary tracking-tight">
                    {card.isCurrency ? `\u20B9${(stats[card.key] || 0).toLocaleString()}` : (stats[card.key] || 0).toLocaleString()}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="text-xs text-tertiary mt-1 font-medium">{card.label}</div>
            </div>
          </motion.div>
        );})}
      </motion.div>

      {/* Bottom section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="surface-elevated rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Zap size={16} className="text-amber-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Users', icon: Users, href: '/admin/users', color: 'from-indigo-500/20 to-indigo-600/10' },
              { label: 'View Orders', icon: ShoppingCart, href: '/admin/orders', color: 'from-amber-500/20 to-amber-600/10' },
              { label: 'Live Slots', icon: Radio, href: '/admin/slots', color: 'from-emerald-500/20 to-emerald-600/10' },
              { label: 'Products', icon: Package, href: '/admin/products', color: 'from-purple-500/20 to-purple-600/10' },
              { label: 'Analytics', icon: BarChart3, href: '/admin/analytics', color: 'from-cyan-500/20 to-cyan-600/10' },
              { label: 'Settings', icon: Server, href: '/admin/settings', color: 'from-rose-500/20 to-rose-600/10' },
            ].map((action, i) => {
              const AIcon = action.icon;
              return (
              <motion.a key={i} href={action.href} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${action.color} border border-white/5 hover:border-white/10 transition-colors`}>
                <AIcon size={16} className="text-secondary" />
                <span className="text-xs font-medium text-secondary">{action.label}</span>
              </motion.a>
            );})}
          </div>
        </motion.div>

        {/* Recent Users */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="surface-elevated rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users size={16} className="text-indigo-400" /> Recent Users
          </h2>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1"><div className="skeleton h-3 w-24 mb-1.5 rounded" /><div className="skeleton h-2.5 w-32 rounded" /></div>
                </div>
              ))
            ) : recentUsers.length > 0 ? (
              recentUsers.slice(0, 5).map((u, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                    {(u.firstName || '?').charAt(0)}{(u.lastName || '').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-primary truncate">{u.firstName} {u.lastName}</div>
                    <div className="text-[10px] text-tertiary truncate">{u.email}</div>
                  </div>
                  <div className="text-[10px] text-tertiary">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-xs text-tertiary text-center py-4">No recent users</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
