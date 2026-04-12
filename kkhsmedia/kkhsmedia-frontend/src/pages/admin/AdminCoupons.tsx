import { useState, useEffect } from 'react';
import { couponsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: 10, description: '', maxUses: 0, maxUsesPerUser: 1, minOrderAmount: 0, validFrom: '', validUntil: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const res = await couponsAPI.adminList(); setCoupons(res.data?.coupons || res.data || []); }
    catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  };

  const createCoupon = async () => {
    if (!form.code) return toast.error('Code required');
    try {
      await couponsAPI.adminCreate(form);
      toast.success('Coupon created');
      setShowAdd(false);
      setForm({ code: '', discountType: 'percentage', discountValue: 10, description: '', maxUses: 0, maxUsesPerUser: 1, minOrderAmount: 0, validFrom: '', validUntil: '' });
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const toggleActive = async (coupon: any) => {
    await couponsAPI.adminUpdate(coupon.id, { isActive: !coupon.isActive });
    loadData();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await couponsAPI.adminDelete(id);
    toast.success('Deleted');
    loadData();
  };

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ New Coupon</button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" className="w-full px-3 py-2 border rounded-lg text-sm uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
              <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (0 = unlimited)</label>
              <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
              <input type="number" value={form.maxUsesPerUser} onChange={e => setForm({ ...form, maxUsesPerUser: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input type="datetime-local" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input type="datetime-local" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Get 20% off on all plans" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={createCoupon} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Create Coupon</button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        {coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No coupons yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Discount</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Uses</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold">{c.code}</p>
                      <p className="text-xs text-gray-500">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                    <td className="px-4 py-3 text-center">{c.usedCount || 0}/{c.maxUses || '∞'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(c)} className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => deleteCoupon(c.id)} className="text-red-500 hover:underline text-xs">Delete</button>
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
