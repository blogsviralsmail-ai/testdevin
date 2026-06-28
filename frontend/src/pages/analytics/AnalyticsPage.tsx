import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, TrendingUp, Users, MessageSquare, Send, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Stats { totalMessages: number; sentMessages: number; receivedMessages: number; totalContacts: number; activeCampaigns: number; messagesByDay: { date: string; count: number }[]; }

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 1;
  const [stats, setStats] = useState<Stats>({ totalMessages: 0, sentMessages: 0, receivedMessages: 0, totalContacts: 0, activeCampaigns: 0, messagesByDay: [] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/analytics/overview?period=${period}`);
        const d = data.data || data;
        setStats(d);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchAnalytics();
  }, [period]);

  const statCards = [
    { label: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: 'text-blue-500 bg-blue-50' },
    { label: 'Sent Messages', value: stats.sentMessages, icon: Send, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Received', value: stats.receivedMessages, icon: TrendingUp, color: 'text-purple-500 bg-purple-50' },
    { label: 'Total Contacts', value: stats.totalContacts, icon: Users, color: 'text-orange-500 bg-orange-50' },
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Send, color: 'text-pink-500 bg-pink-50' },
  ];

  const maxCount = Math.max(...(stats.messagesByDay || []).map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Analytics</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{isAdmin ? 'Platform-wide analytics' : 'Your messaging analytics'}</p></div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm ${period === p ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-gray-300'}`}>{p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}</button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {statCards.map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold dark:text-white mt-1">{s.value}</p></div>
                <div className={`p-3 rounded-xl ${s.color}`}><s.icon size={20} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
        <h3 className="font-semibold dark:text-white mb-4">Messages Over Time</h3>
        {(stats.messagesByDay || []).length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400"><BarChart3 size={48} className="opacity-30" /><p className="ml-4">No data for selected period</p></div>
        ) : (
          <div className="flex items-end gap-1 h-48">
            {stats.messagesByDay.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-emerald-500 rounded-t min-h-[2px] transition-all hover:bg-emerald-400" style={{ height: `${(d.count / maxCount) * 100}%` }} title={`${d.date}: ${d.count} messages`} />
                <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">{new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <h3 className="font-semibold dark:text-white mb-4">Message Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Sent', value: stats.sentMessages, pct: stats.totalMessages > 0 ? (stats.sentMessages / stats.totalMessages * 100).toFixed(1) : '0', color: 'bg-emerald-500' },
              { label: 'Received', value: stats.receivedMessages, pct: stats.totalMessages > 0 ? (stats.receivedMessages / stats.totalMessages * 100).toFixed(1) : '0', color: 'bg-blue-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1"><span className="text-sm dark:text-gray-300">{item.label}</span><span className="text-sm dark:text-white">{item.value} ({item.pct}%)</span></div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2"><div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <h3 className="font-semibold dark:text-white mb-4">Quick Stats</h3>
          <div className="space-y-3">
            {[
              { label: 'Avg. Messages/Day', value: stats.messagesByDay?.length > 0 ? Math.round(stats.totalMessages / stats.messagesByDay.length) : 0 },
              { label: 'Contacts Reached', value: stats.totalContacts },
              { label: 'Active Campaigns', value: stats.activeCampaigns },
              { label: 'Response Rate', value: stats.sentMessages > 0 ? `${((stats.receivedMessages / stats.sentMessages) * 100).toFixed(1)}%` : '0%' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b dark:border-slate-700"><span className="text-sm text-gray-500">{item.label}</span><span className="text-sm font-semibold dark:text-white">{item.value}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
