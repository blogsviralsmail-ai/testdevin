import { useState, useEffect } from 'react';
import { Key, Copy, RefreshCw, Eye, EyeOff, Save } from 'lucide-react';
import api from '../../services/api';

export default function ApiAccessPage() {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendor-settings/api-access').then((r: any) => {
      setApiKey(r.data?.data?.api_key || '');
      setWebhookUrl(r.data?.data?.webhook_url || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="text-violet-600" /> API Access
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your API keys and webhook configuration</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your API Key</label>
          <div className="flex items-center gap-2">
            <input type={showKey ? 'text' : 'password'} value={apiKey || 'No API key generated'} readOnly
              className="flex-1 border rounded-lg px-4 py-2 bg-gray-50 text-sm font-mono" />
            <button onClick={() => setShowKey(!showKey)} className="p-2 text-gray-500 hover:text-gray-700">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={() => navigator.clipboard.writeText(apiKey)} className="p-2 text-blue-500 hover:text-blue-700">
              <Copy size={16} />
            </button>
            <button className="p-2 text-orange-500 hover:text-orange-700" title="Regenerate">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
          <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="https://your-server.com/webhook" />
          <p className="text-xs text-gray-400 mt-1">Incoming messages and status updates will be forwarded to this URL</p>
        </div>

        <button className="bg-violet-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-violet-700">
          <Save size={16} /> Save Settings
        </button>
      </div>
    </div>
  );
}
