import { useState, useEffect } from 'react';
import { Code, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

export default function ApiIntegrationPage() {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/marketing/api-settings').then((r: any) => {
      setApiKey(r.data?.data?.api_key || '');
      setWebhookUrl(r.data?.data?.webhook_url || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Code className="text-indigo-600" /> API Integration
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure API access for external integrations</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <div className="flex items-center gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey || 'Generate an API key to get started'}
              readOnly
              className="flex-1 border rounded-lg px-4 py-2 bg-gray-50 text-sm"
            />
            <button onClick={() => setShowKey(!showKey)} className="p-2 text-gray-500 hover:text-gray-700">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={() => copyToClipboard(apiKey)} className="p-2 text-blue-500 hover:text-blue-700">
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="w-full border rounded-lg px-4 py-2 text-sm"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-3">API Endpoints</h3>
          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 rounded p-3 font-mono">
              <span className="text-green-600 font-bold">POST</span> /api/v1/messages/send
            </div>
            <div className="bg-gray-50 rounded p-3 font-mono">
              <span className="text-blue-600 font-bold">GET</span> /api/v1/contacts
            </div>
            <div className="bg-gray-50 rounded p-3 font-mono">
              <span className="text-blue-600 font-bold">GET</span> /api/v1/templates
            </div>
            <div className="bg-gray-50 rounded p-3 font-mono">
              <span className="text-yellow-600 font-bold">PUT</span> /api/v1/contacts/:id
            </div>
          </div>
        </div>

        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          Save Settings
        </button>
      </div>
    </div>
  );
}
