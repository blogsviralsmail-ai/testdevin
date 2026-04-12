import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, publicAPI } from '../../services/api';
import { CreditCard, Check, Clock, XCircle, ExternalLink } from 'lucide-react';

interface Product {
  id: string; name: string; durationType: string; price: Record<string, number>;
  features: string[]; streamQuality: string; durationValue: number;
}
interface Order {
  id: string; productName: string; amount: number; gstAmount: number; totalAmount: number;
  status: string; paymentGateway: string; createdAt: string; paymentUrl?: string;
}

export default function BillingPage() {
  const { settings } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [gateway, setGateway] = useState('cashfree');
  const primary = settings?.primaryColor || '#6366f1';
  const gstRate = settings?.gstRate || 18;

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, oRes] = await Promise.all([publicAPI.getProducts(), ordersAPI.getAll()]);
        setProducts(pRes.data);
        setOrders(oRes.data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const handlePurchase = async (productId: string) => {
    setPurchasing(productId);
    try {
      const res = await ordersAPI.create({ productId, paymentGateway: gateway });
      if (res.data.paymentUrl) {
        window.open(res.data.paymentUrl, '_blank');
      }
    } catch { /* ignore */ }
    setPurchasing(null);
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'paid': return <Check size={14} className="text-green-600" />;
      case 'pending': return <Clock size={14} className="text-yellow-600" />;
      default: return <XCircle size={14} className="text-red-600" />;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-red-100 text-red-700';
    }
  };

  const getDurationLabel = (type: string) => {
    switch (type) { case 'day': return '/day'; case 'week': return '/week'; case 'month': return '/month'; default: return ''; }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* Gateway Selection */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <label className="text-sm font-medium text-gray-700 mr-4">Payment Gateway:</label>
        <select value={gateway} onChange={e => setGateway(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm">
          <option value="cashfree">Cashfree</option>
          <option value="razorpay">Razorpay</option>
        </select>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {products.map((product, i) => (
          <div key={product.id} className={`bg-white rounded-xl border-2 p-6 relative ${i === 1 ? 'shadow-lg' : ''}`}
            style={{ borderColor: i === 1 ? primary : '#e5e7eb' }}>
            {i === 1 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: primary }}>
                POPULAR
              </div>
            )}
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{product.streamQuality} Quality</p>
            <div className="mb-1">
              <span className="text-3xl font-bold">₹{product.price.INR}</span>
              <span className="text-gray-500 text-sm">{getDurationLabel(product.durationType)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">+ {gstRate}% GST = ₹{(product.price.INR * (1 + gstRate / 100)).toFixed(2)}</p>
            <ul className="space-y-1.5 mb-4">
              {product.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={14} style={{ color: primary }} /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handlePurchase(product.id)} disabled={purchasing === product.id}
              className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-50" style={{ backgroundColor: primary }}>
              {purchasing === product.id ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Order History */}
      <h2 className="text-xl font-bold mb-4">Order History</h2>
      {orders.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border">
          <CreditCard size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Plan</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Gateway</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium">{order.productName}</td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell">₹{order.totalAmount}</td>
                  <td className="px-4 py-3 text-sm capitalize hidden md:table-cell">{order.paymentGateway}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {order.status === 'pending' && order.paymentUrl && (
                      <a href={order.paymentUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm flex items-center gap-1 justify-end" style={{ color: primary }}>
                        Pay <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
