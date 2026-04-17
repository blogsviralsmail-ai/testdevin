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

  if (loading) return <div className="text-center py-12 text-tertiary">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* Gateway Selection */}
      <div className="surface-base rounded-xl border p-4 mb-6">
        <label className="text-sm font-medium text-secondary mr-4">Payment Gateway:</label>
        <select value={gateway} onChange={e => setGateway(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm">
          <option value="cashfree">Cashfree</option>
          <option value="razorpay">Razorpay</option>
        </select>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {products.map((product, i) => (
          <div key={product.id} className={`surface-base rounded-xl border-2 p-6 relative ${i === 1 ? 'shadow-lg' : ''}`}
            style={{ borderColor: i === 1 ? 'rgb(99,102,241)' : '#e5e7eb' }}>
            {i === 1 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold">
                POPULAR
              </div>
            )}
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-sm text-tertiary mb-3">{product.streamQuality} Quality</p>
            <div className="mb-1">
              <span className="text-3xl font-bold">₹{product.price.INR}</span>
              <span className="text-tertiary text-sm">{getDurationLabel(product.durationType)}</span>
            </div>
            <p className="text-xs text-tertiary mb-4">+ {gstRate}% GST = ₹{(product.price.INR * (1 + gstRate / 100)).toFixed(2)}</p>
            <ul className="space-y-1.5 mb-4">
              {product.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-secondary">
                  <Check size={14} /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handlePurchase(product.id)} disabled={purchasing === product.id}
              className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-50">
              {purchasing === product.id ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Order History */}
      <h2 className="text-lg font-semibold text-primary mb-4">Order History</h2>
      {orders.length === 0 ? (
        <div className="text-center py-8 surface-base rounded-xl border">
          <CreditCard size={40} className="mx-auto mb-3 text-secondary" />
          <p className="text-tertiary">No orders yet</p>
        </div>
      ) : (
        <div className="surface-base rounded-xl border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b surface-subtle">
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary">Plan</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary hidden sm:table-cell">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary hidden md:table-cell">Gateway</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-tertiary hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-tertiary">Action</th>
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
                  <td className="px-4 py-3 text-sm text-tertiary hidden md:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {order.status === 'pending' && order.paymentUrl && (
                      <a href={order.paymentUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm flex items-center gap-1 justify-end">
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
