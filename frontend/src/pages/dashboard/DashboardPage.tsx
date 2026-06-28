import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Users, MessageSquare, Send, FileText, Building, UserCog, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminStats {
  totalVendors: number;
  activeVendors: number;
  totalUsers: number;
  totalMessages: number;
}

interface VendorStats {
  totalContacts: number;
  messagesToday: number;
  activeCampaigns: number;
  templatesCount: number;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 1;
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; sent: number; received: number }[]>([]);
  const [recentVendors, setRecentVendors] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard');
        const d = data.data || data;
        if (isAdmin) {
          setAdminStats(d.stats);
          setRecentVendors(d.recentVendors || []);
        } else {
          setVendorStats(d.stats);
        }
        try {
          const chartRes = await api.get('/dashboard/chart?period=weekly');
          setChartData(chartRes.data?.data || chartRes.data || []);
        } catch { /* chart optional */ }
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-4" />
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const adminCards = adminStats ? [
    { label: 'Total Vendors', value: adminStats.totalVendors, icon: Building, color: 'bg-blue-500' },
    { label: 'Active Vendors', value: adminStats.activeVendors, icon: Activity, color: 'bg-emerald-500' },
    { label: 'Total Users', value: adminStats.totalUsers, icon: UserCog, color: 'bg-purple-500' },
    { label: 'Total Messages', value: adminStats.totalMessages, icon: MessageSquare, color: 'bg-orange-500' },
  ] : [];

  const vendorCards = vendorStats ? [
    { label: 'Total Contacts', value: vendorStats.totalContacts, icon: Users, color: 'bg-blue-500' },
    { label: 'Messages Today', value: vendorStats.messagesToday, icon: MessageSquare, color: 'bg-emerald-500' },
    { label: 'Active Campaigns', value: vendorStats.activeCampaigns, icon: Send, color: 'bg-purple-500' },
    { label: 'Templates', value: vendorStats.templatesCount, icon: FileText, color: 'bg-orange-500' },
  ] : [];

  const statCards = isAdmin ? adminCards : vendorCards;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          {isAdmin ? `Admin Panel - Welcome, ${user?.firstName}!` : `Welcome back, ${user?.firstName}!`}
        </h1>
        <p className="mt-1 text-emerald-100">
          {isAdmin ? 'System overview and vendor management.' : "Here's what's happening with your WhatsApp business today."}
        </p>
      </div>

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
          </div>
        ))}
      </div>

      {isAdmin && recentVendors.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold dark:text-white mb-4">Recent Vendors</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentVendors.map((v) => (
                  <tr key={v.id as number} className="border-b dark:border-slate-700">
                    <td className="py-3 px-4 dark:text-gray-300">{v.id as number}</td>
                    <td className="py-3 px-4 dark:text-white font-medium">{(v.title as string) || 'Untitled'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(v.status as number) === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {(v.status as number) === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{v.created_at ? new Date(v.created_at as string).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isAdmin && (
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
      )}
    </div>
  );
}
