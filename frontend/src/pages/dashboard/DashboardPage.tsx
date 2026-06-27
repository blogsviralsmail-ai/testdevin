import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Users, MessageSquare, Send, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalContacts: number;
  messagesToday: number;
  activeCampaigns: number;
  templatesCount: number;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; sent: number; received: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setStats(data.data?.stats || data.stats);

        const chartRes = await api.get('/dashboard/chart?period=weekly');
        setChartData(chartRes.data?.data || chartRes.data || []);
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const statCards = [
    { label: 'Total Contacts', value: stats?.totalContacts || 0, icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Messages Today', value: stats?.messagesToday || 0, icon: MessageSquare, color: 'bg-emerald-500', change: '+8%' },
    { label: 'Active Campaigns', value: stats?.activeCampaigns || 0, icon: Send, color: 'bg-purple-500', change: '+3%' },
    { label: 'Templates', value: stats?.templatesCount || 0, icon: FileText, color: 'bg-orange-500', change: '0%' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="mt-1 text-emerald-100">Here's what's happening with your WhatsApp business today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold mt-1 dark:text-white">{card.value.toLocaleString()}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon size={24} className="text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {card.change.startsWith('+') ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />}
              <span className={`text-xs font-medium ${card.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{card.change}</span>
              <span className="text-xs text-gray-400">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold dark:text-white mb-4">Message Analytics</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="sent" stroke="#10B981" fill="#10B98130" name="Sent" />
              <Area type="monotone" dataKey="received" stroke="#6366F1" fill="#6366F130" name="Received" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
