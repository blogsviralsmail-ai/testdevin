import { useState, useEffect } from 'react';
import { resellerAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminResellers() {
  const [resellers, setResellers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ userId: '', brandName: '', commissionRate: 15, maxClients: 50 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const res = await resellerAPI.adminListResellers(); setResellers(res.data?.resellers || res.data || []); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const createReseller = async () => {
    if (!form.userId) return toast.error('User ID required');
    try {
      await resellerAPI.adminCreateReseller(form);
      toast.success('Reseller created');
      setShowAdd(false);
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const removeReseller = async (id: string) => {
    if (!confirm('Remove reseller access?')) return;
    await resellerAPI.adminRemoveReseller(id);
    toast.success('Removed');
    loadData();
  };

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reseller Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Reseller</button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID *</label>
              <input type="text" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} placeholder="Enter user ID to promote" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <input type="text" value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} placeholder="White-label brand name" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <input type="number" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 15 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Clients</label>
              <input type="number" value={form.maxClients} onChange={e => setForm({ ...form, maxClients: parseInt(e.target.value) || 50 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createReseller} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Create</button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        {resellers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No resellers yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Reseller</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Brand</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Commission</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Clients</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {resellers.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.name || r.email}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">{r.brandName || '-'}</td>
                    <td className="px-4 py-3 text-center">{r.commissionRate}%</td>
                    <td className="px-4 py-3 text-center">{r.clientCount || 0}/{r.maxClients}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => removeReseller(r.id)} className="text-red-500 hover:underline text-xs">Remove</button>
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
