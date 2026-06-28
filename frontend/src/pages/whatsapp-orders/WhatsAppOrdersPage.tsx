import { useState, useEffect } from 'react';
import { Receipt, Search, Eye } from 'lucide-react';
import api from '../../services/api';

export default function WhatsAppOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/whatsapp-orders').then((r: any) => setOrders(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o =>
    (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.order_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-teal-600" /> Product Orders
          </h1>
          <p className="text-gray-500 text-sm mt-1">View and manage orders received via WhatsApp Commerce</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No orders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Order ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Items</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Total</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm">#{o.order_id || o.id}</td>
                  <td className="p-4">{o.customer_name}</td>
                  <td className="p-4 text-gray-600">{o.items_count || 0}</td>
                  <td className="p-4 font-medium">{o.currency || '$'}{o.total}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      o.status === 'completed' ? 'bg-green-100 text-green-700' :
                      o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{o.status}</span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{o.created_at}</td>
                  <td className="p-4">
                    <button className="text-blue-500 hover:text-blue-700"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
