import { useState, useEffect } from 'react';
import { ShoppingBag, Save, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export default function WooCommercePage() {
  const [config, setConfig] = useState({ store_url: '', consumer_key: '', consumer_secret: '', connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/integrations/woocommerce').then((r: any) => {
      if (r.data?.data) setConfig({ ...config, ...r.data.data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-purple-600" /> WooCommerce Integration
        </h1>
        <p className="text-gray-500 text-sm mt-1">Connect your WooCommerce store to sync orders and send WhatsApp notifications</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className={`p-4 rounded-lg flex items-center gap-3 ${config.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
          {config.connected ? <CheckCircle className="text-green-600" /> : <XCircle className="text-gray-400" />}
          <span className={config.connected ? 'text-green-700 font-medium' : 'text-gray-500'}>
            {config.connected ? 'Connected to WooCommerce' : 'Not connected'}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
          <input type="url" value={config.store_url} onChange={e => setConfig({ ...config, store_url: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="https://your-store.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Key</label>
          <input type="text" value={config.consumer_key} onChange={e => setConfig({ ...config, consumer_key: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="ck_..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Secret</label>
          <input type="password" value={config.consumer_secret} onChange={e => setConfig({ ...config, consumer_secret: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="cs_..." />
        </div>

        <button className="bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700">
          <Save size={16} /> Save & Connect
        </button>
      </div>
    </div>
  );
}
