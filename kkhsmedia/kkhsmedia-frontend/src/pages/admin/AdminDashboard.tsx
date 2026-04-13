import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, Radio, Video, ShoppingCart, CreditCard, Server, BarChart3, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(res => { setStats(res.data.stats || res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Users', key: 'totalUsers', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Active Slots', key: 'activeSlots', icon: Radio, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Total Videos', key: 'totalVideos', icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Orders', key: 'totalOrders', icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Revenue', key: 'totalRevenue', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Servers', key: 'totalServers', icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Products', key: 'totalProducts', icon: Package, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Coupons', key: 'totalCoupons', icon: BarChart3, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-primary">Admin Dashboard</h1>
        <p className="text-xs text-tertiary mt-0.5">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {cards.map((card, i) => (
          <motion.div key={i}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="metric-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
            </div>
            {loading ? (
              <div className="skeleton h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-primary tracking-tight">
                {card.key === 'totalRevenue' ? `\u20B9${(stats[card.key] || 0).toLocaleString()}` : (stats[card.key] || 0)}
              </div>
            )}
            <div className="text-[11px] text-tertiary mt-0.5">{card.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
