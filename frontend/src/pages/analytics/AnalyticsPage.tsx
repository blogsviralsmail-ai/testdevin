import { useEffect, useState } from 'react';
import api from '../../services/api';
import { BarChart3, Users, MessageSquare, Send } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Overview {
  totalContacts: number;
  totalMessages: number;
  totalCampaigns: number;
  totalTemplates: number;
  messagesToday: number;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [messageStats, setMessageStats] = useState<{ date: string; sent: number; received: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, statsRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/messages?days=30'),
        ]);
        setOverview(overviewRes.data?.data || overviewRes.data);
        setMessageStats(statsRes.data?.data || statsRes.data || []);
      } catch (err) {
        console.error('Analytics load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48" /><div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />)}</div></div>;

  const cards = overview ? [
    { label: 'Total Contacts', value: overview.totalContacts, icon: Users, color: 'text-blue-500' },
    { label: 'Total Messages', value: overview.totalMessages, icon: MessageSquare, color: 'text-emerald-500' },
    { label: 'Total Campaigns', value: overview.totalCampaigns, icon: Send, color: 'text-purple-500' },
    { label: 'Messages Today', value: overview.messagesToday, icon: BarChart3, color: 'text-orange-500' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Message and engagement analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold mt-1 dark:text-white">{card.value.toLocaleString()}</p>
              </div>
              <card.icon size={32} className={card.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold dark:text-white mb-4">Message Volume (Last 30 days)</h3>
        <div className="h-72">
          {messageStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messageStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="sent" fill="#10B981" name="Sent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="received" fill="#6366F1" name="Received" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No message data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
