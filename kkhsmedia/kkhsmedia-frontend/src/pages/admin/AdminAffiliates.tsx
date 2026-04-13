import { useState, useEffect } from 'react';
import { affiliatesAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminAffiliates() {
  const [stats, setStats] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [settings, setSettings] = useState({ commission: 10, minPayout: 500 });
  const [tab, setTab] = useState<'overview' | 'earnings' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, earningsRes] = await Promise.all([
        affiliatesAPI.adminStats(),
        affiliatesAPI.adminEarnings(),
      ]);
      setStats(statsRes.data);
      setEarnings(earningsRes.data?.earnings || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const markPaid = async (id: string) => {
    await affiliatesAPI.adminMarkPaid(id);
    toast.success('Marked as paid');
    loadData();
  };

  const saveSettings = async () => {
    try {
      await affiliatesAPI.adminUpdateSettings(settings);
      toast.success('Settings saved');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Affiliate Program</h1>
        <div className="flex gap-2">
          {['overview', 'earnings', 'settings'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-blue-600 text-white' : 'surface-muted'}`}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Affiliates', value: stats.totalAffiliates || 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Total Referrals', value: stats.totalReferred || 0, color: 'bg-green-50 text-green-700' },
            { label: 'Total Paid', value: `₹${stats.totalPaid || 0}`, color: 'bg-purple-50 text-purple-700' },
            { label: 'Pending Payouts', value: `₹${stats.totalPending || 0}`, color: 'bg-orange-50 text-orange-700' },
          ].map((card, i) => (
            <div key={i} className={`rounded-lg p-4 ${card.color}`}>
              <p className="text-sm font-medium opacity-75">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'earnings' && (
        <div className="surface-base rounded-lg border">
          {earnings.length === 0 ? (
            <div className="p-8 text-center text-tertiary">No earnings yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="surface-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-tertiary">Affiliate</th>
                    <th className="px-4 py-3 text-left font-medium text-tertiary">Referred User</th>
                    <th className="px-4 py-3 text-center font-medium text-tertiary">Order</th>
                    <th className="px-4 py-3 text-center font-medium text-tertiary">Commission</th>
                    <th className="px-4 py-3 text-center font-medium text-tertiary">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-tertiary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {earnings.map((e: any) => (
                    <tr key={e.id} className="hover:bg-[rgb(var(--bg-muted))]">
                      <td className="px-4 py-3">{e.affiliateName || e.affiliateEmail}</td>
                      <td className="px-4 py-3">{e.referredUserName || e.referredUserEmail}</td>
                      <td className="px-4 py-3 text-center">₹{e.orderAmount}</td>
                      <td className="px-4 py-3 text-center font-medium">₹{e.amount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${e.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {e.status !== 'paid' && (
                          <button onClick={() => markPaid(e.id)} className="text-blue-600 hover:underline text-xs">Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="surface-base rounded-lg border p-6 space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <input type="number" value={settings.commission} onChange={e => setSettings({ ...settings, commission: parseFloat(e.target.value) || 10 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout (₹)</label>
            <input type="number" value={settings.minPayout} onChange={e => setSettings({ ...settings, minPayout: parseFloat(e.target.value) || 500 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={saveSettings} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Save Settings</button>
        </div>
      )}
    </div>
  );
}
