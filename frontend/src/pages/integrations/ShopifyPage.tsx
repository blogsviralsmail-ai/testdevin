import { useState, useEffect } from 'react';
import { ShoppingBag, Save, Link, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export default function ShopifyPage() {
  const [config, setConfig] = useState({ shop_url: '', api_key: '', api_secret: '', access_token: '', connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/integrations/shopify').then((r: any) => {
      if (r.data?.data) setConfig({ ...config, ...r.data.data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-green-600" /> Shopify Integration
        </h1>
        <p className="text-gray-500 text-sm mt-1">Connect your Shopify store to sync orders and send WhatsApp notifications</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className={`p-4 rounded-lg flex items-center gap-3 ${config.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
          {config.connected ? <CheckCircle className="text-green-600" /> : <XCircle className="text-gray-400" />}
          <span className={config.connected ? 'text-green-700 font-medium' : 'text-gray-500'}>
            {config.connected ? 'Connected to Shopify' : 'Not connected'}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop URL</label>
          <input type="text" value={config.shop_url} onChange={e => setConfig({ ...config, shop_url: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="your-store.myshopify.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input type="text" value={config.api_key} onChange={e => setConfig({ ...config, api_key: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="Shopify API Key" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
          <input type="password" value={config.api_secret} onChange={e => setConfig({ ...config, api_secret: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="Shopify API Secret" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
          <input type="password" value={config.access_token} onChange={e => setConfig({ ...config, access_token: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="Admin Access Token" />
        </div>

        <button className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Save size={16} /> Save & Connect
        </button>
      </div>
    </div>
  );
}
