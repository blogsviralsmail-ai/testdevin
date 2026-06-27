import { useState, useEffect } from 'react';
import { DollarSign, Search, Eye, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';
import api from '../../services/api';

interface ManualSubscription {
  id: number;
  _uid: string;
  vendor_name: string;
  plan_id: string;
  plan_name: string;
  charges: number;
  currency: string;
  status: string;
  payment_method: string;
  txn_reference: string;
  remarks: string;
  created_at: string;
  ends_at: string;
}

export default function ManualSubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<ManualSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/subscriptions/manual').then((r: any) => {
      setSubscriptions(r.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = subscriptions.filter(s =>
    (s.vendor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.txn_reference || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} className="text-green-500" />;
      case 'pending': return <Clock size={14} className="text-yellow-500" />;
      case 'rejected':
      case 'expired': return <XCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="text-amber-600" /> Manual / Prepaid Subscriptions
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage manual and prepaid vendor subscription requests</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by vendor name or transaction reference..."
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
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No manual subscription requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Vendor</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Plan</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Charges</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Payment Method</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Txn Reference</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Created</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Expiry</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{sub.vendor_name || 'N/A'}</td>
                    <td className="p-4 text-sm">{sub.plan_name || sub.plan_id}</td>
                    <td className="p-4 text-sm font-medium">{sub.currency || 'INR'} {sub.charges}</td>
                    <td className="p-4 text-sm text-gray-600">{sub.payment_method || '-'}</td>
                    <td className="p-4 font-mono text-xs text-gray-500">{sub.txn_reference || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' :
                        sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {statusIcon(sub.status)} {sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{sub.created_at}</td>
                    <td className="p-4 text-sm text-gray-500">{sub.ends_at || 'N/A'}</td>
                    <td className="p-4 flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700" title="Edit"><Edit size={16} /></button>
                      <button className="text-gray-500 hover:text-gray-700" title="View"><Eye size={16} /></button>
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
