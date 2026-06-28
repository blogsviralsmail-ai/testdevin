import { useState, useEffect } from 'react';
import { RefreshCw, Search, Eye } from 'lucide-react';
import api from '../../services/api';

interface AutoSubscription {
  id: number;
  vendor_name: string;
  vendor_uid: string;
  plan_type: string;
  stripe_id: string;
  stripe_status: string;
  stripe_price: string;
  created_at: string;
  ends_at: string;
}

export default function AutoSubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<AutoSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/subscriptions/auto').then((r: any) => {
      setSubscriptions(r.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = subscriptions.filter(s =>
    (s.vendor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.stripe_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw className="text-purple-600" /> Auto Subscriptions
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage automatic/recurring vendor subscriptions (Stripe, Razorpay, etc.)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by vendor name or payment ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading subscriptions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No auto subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Vendor</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Plan</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Payment ID</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Price Plan</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Created</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Ends At</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <a href={`/vendors`} className="text-blue-600 hover:underline font-medium">{sub.vendor_name || 'N/A'}</a>
                    </td>
                    <td className="p-4 text-sm">{sub.plan_type}</td>
                    <td className="p-4 font-mono text-xs text-gray-500">{sub.stripe_id || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sub.stripe_status === 'active' ? 'bg-green-100 text-green-700' :
                        sub.stripe_status === 'canceled' ? 'bg-red-100 text-red-700' :
                        sub.stripe_status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{sub.stripe_status}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{sub.stripe_price || '-'}</td>
                    <td className="p-4 text-sm text-gray-500">{sub.created_at}</td>
                    <td className="p-4 text-sm text-gray-500">{sub.ends_at || 'N/A'}</td>
                    <td className="p-4">
                      <button className="text-blue-500 hover:text-blue-700"><Eye size={16} /></button>
                    </td>
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
