import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Users, Radio, Video, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const { settings } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const primary = settings?.primaryColor || '#6366f1';

  useEffect(() => {
    adminAPI.getDashboard().then(res => { setStats(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: '#6366f1', bg: '#eef2ff' },
    { label: 'Active Slots', value: stats.activeSlots || 0, icon: Radio, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Total Videos', value: stats.totalVideos || 0, icon: Video, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Total Orders', value: stats.totalOrders || 0, icon: ShoppingCart, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Revenue', value: stats.totalRevenue || 0, icon: DollarSign, color: '#10b981', bg: '#ecfdf5', prefix: '₹' },
    { label: 'Active Streams', value: stats.activeStreams || 0, icon: TrendingUp, color: '#ef4444', bg: '#fef2f2' },
  ];

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold">{card.prefix || ''}{card.value.toLocaleString()}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users', href: '/admin/users', color: primary },
            { label: 'Manage Slots', href: '/admin/slots', color: '#22c55e' },
            { label: 'View Orders', href: '/admin/orders', color: '#3b82f6' },
            { label: 'Site Settings', href: '/admin/settings', color: '#f59e0b' },
          ].map((action, i) => (
            <a key={i} href={action.href} className="p-4 rounded-xl border text-center hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: action.color + '15' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: action.color }} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
