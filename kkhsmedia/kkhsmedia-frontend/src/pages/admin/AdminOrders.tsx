import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Search, RefreshCw } from 'lucide-react';

interface OrderItem {
  id: string; productName: string; amount: number; gstAmount: number; totalAmount: number;
  status: string; paymentGateway: string; userId: string; userEmail?: string; createdAt: string;
}

export default function AdminOrders() {

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try { const res = await adminAPI.getOrders(); setOrders(res.data.orders || res.data); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const getStatusColor = (s: string) => {
    switch (s) { case 'paid': return 'bg-green-100 text-green-700'; case 'pending': return 'bg-yellow-100 text-yellow-700'; default: return 'bg-red-100 text-red-700'; }
  };

  const filtered = orders.filter(o =>
    o.productName.toLowerCase().includes(search.toLowerCase()) ||
    (o.userEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders ({orders.length})</h1>
        <button onClick={loadOrders} className="px-3 py-2 rounded-lg border hover:bg-[rgb(var(--bg-muted))]"><RefreshCw size={18} /></button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="surface-base rounded-xl border p-4">
          <div className="text-sm text-tertiary">Total Orders</div>
          <div className="text-lg font-semibold text-primary">{orders.length}</div>
        </div>
        <div className="surface-base rounded-xl border p-4">
          <div className="text-sm text-tertiary">Paid Orders</div>
          <div className="text-lg font-semibold text-primary text-green-600">{orders.filter(o => o.status === 'paid').length}</div>
        </div>
        <div className="surface-base rounded-xl border p-4">
          <div className="text-sm text-tertiary">Total Revenue</div>
          <div className="text-lg font-semibold text-primary">₹{totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-tertiary">Loading...</div>
      ) : (
        <div className="surface-base rounded-xl border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b surface-subtle">
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary">Plan</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary hidden md:table-cell">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary hidden sm:table-cell">Gateway</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} className="border-b last:border-b-0 hover:bg-[rgb(var(--bg-muted))]">
                  <td className="px-4 py-3 text-sm font-medium">{order.productName}</td>
                  <td className="px-4 py-3 text-sm text-tertiary hidden md:table-cell">{order.userEmail || order.userId}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>₹{order.totalAmount}</div>
                    <div className="text-xs text-tertiary">GST: ₹{order.gstAmount}</div>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize hidden sm:table-cell">{order.paymentGateway}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-tertiary hidden lg:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
