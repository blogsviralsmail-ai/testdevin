import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Trash2, Eye, Search, Package } from 'lucide-react';

interface Order { id: number; order_id: string; customer_name: string; customer_phone: string; total: number; status: string; items_count: number; created_at: string; }

export default function EcommercePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  const fetchOrders = async () => { setLoading(true); try { const { data } = await api.get(`/ecommerce/orders?search=${search}`); setOrders((data.data || data)?.data || data.data || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchOrders(); }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><ShoppingCart className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">E-Commerce</h1></div>
      </div>
      <div className="flex gap-2 border-b dark:border-slate-700">
        {(['orders', 'products'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}>{tab}</button>))}
      </div>
      <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
         orders.length === 0 ? (
          <div className="p-12 text-center"><Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold dark:text-white">No Orders Yet</h3>
            <p className="text-gray-500 mt-2">WhatsApp orders will appear here when customers place them.</p></div>
        ) : (
          <table className="w-full"><thead className="bg-gray-50 dark:bg-slate-700"><tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Order ID</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Customer</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Items</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Total</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Date</th>
          </tr></thead><tbody className="divide-y dark:divide-slate-700">
            {orders.map((o) => (
              <tr key={o.id}><td className="px-4 py-3 text-sm dark:text-white font-mono">#{o.order_id}</td>
                <td className="px-4 py-3 text-sm dark:text-white">{o.customer_name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{o.items_count}</td>
                <td className="px-4 py-3 text-sm dark:text-white font-medium">₹{o.total}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{o.status}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</td>
              </tr>))}
          </tbody></table>)}
      </div>
    </div>
  );
}
