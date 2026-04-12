import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function AdminAnalytics() {
  const { settings } = useAuth();
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const primary = settings?.primaryColor || '#6366f1';

  useEffect(() => {
    adminAPI.getAnalytics().then(res => { setAnalytics(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading analytics...</div>;

  const revenueByMonth = (analytics.revenueByMonth || []) as Array<{ month: string; amount: number }>;
  const usersByMonth = (analytics.usersByMonth || []) as Array<{ month: string; count: number }>;
  const topPlans = (analytics.topPlans || []) as Array<{ name: string; count: number; revenue: number }>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: `₹${((analytics.totalRevenue as number) || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
          { label: 'Total Users', value: ((analytics.totalUsers as number) || 0).toString(), icon: Users, color: primary },
          { label: 'Avg Order Value', value: `₹${((analytics.avgOrderValue as number) || 0).toFixed(0)}`, icon: TrendingUp, color: '#f59e0b' },
          { label: 'Conversion Rate', value: `${((analytics.conversionRate as number) || 0).toFixed(1)}%`, icon: BarChart3, color: '#3b82f6' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border p-5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: card.color + '15' }}>
              <card.icon size={20} style={{ color: card.color }} />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue by Month */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Revenue by Month</h2>
          {revenueByMonth.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No revenue data yet</p>
          ) : (
            <div className="space-y-3">
              {revenueByMonth.map((item, i) => {
                const max = Math.max(...revenueByMonth.map(r => r.amount));
                const width = max > 0 ? (item.amount / max) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${width}%`, backgroundColor: primary }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Users by Month</h2>
          {usersByMonth.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No user data yet</p>
          ) : (
            <div className="space-y-3">
              {usersByMonth.map((item, i) => {
                const max = Math.max(...usersByMonth.map(u => u.count));
                const width = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-medium">{item.count} users</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${width}%`, backgroundColor: '#3b82f6' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Plans */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Top Plans</h2>
        {topPlans.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No plan data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Plan</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Orders</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topPlans.map((plan, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="py-2 text-sm font-medium">{plan.name}</td>
                    <td className="py-2 text-sm text-gray-600">{plan.count}</td>
                    <td className="py-2 text-sm font-medium" style={{ color: primary }}>₹{plan.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
