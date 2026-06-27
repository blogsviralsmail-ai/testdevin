import { useState, useEffect } from 'react';
import { MousePointerClick, Save, ExternalLink } from 'lucide-react';
import api from '../../services/api';

export default function OneClickSignupPage() {
  const [settings, setSettings] = useState({
    enabled: false,
    embedded_signup_app_id: '',
    embedded_signup_config_id: '',
    signup_redirect_url: '',
    auto_create_vendor: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/config/whatsapp-onboarding').then((r: any) => {
      if (r.data?.data) setSettings({ ...settings, ...r.data.data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MousePointerClick className="text-green-600" /> One-Click Signup (WhatsApp Onboarding)
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure embedded signup for vendors to connect their WhatsApp Business Account</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div>
            <h3 className="font-medium text-green-800">WhatsApp Embedded Signup</h3>
            <p className="text-sm text-green-600">Allow vendors to connect their WABA with one click</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook App ID (Embedded Signup)</label>
          <input
            type="text"
            value={settings.embedded_signup_app_id}
            onChange={e => setSettings({ ...settings, embedded_signup_app_id: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm"
            placeholder="Enter Facebook App ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Configuration ID</label>
          <input
            type="text"
            value={settings.embedded_signup_config_id}
            onChange={e => setSettings({ ...settings, embedded_signup_config_id: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm"
            placeholder="Enter Configuration ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL after Signup</label>
          <input
            type="url"
            value={settings.signup_redirect_url}
            onChange={e => setSettings({ ...settings, signup_redirect_url: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm"
            placeholder="https://your-domain.com/onboarding-complete"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.auto_create_vendor}
            onChange={e => setSettings({ ...settings, auto_create_vendor: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label className="text-sm text-gray-700">Auto-create vendor account after successful onboarding</label>
        </div>

        <div className="border-t pt-4">
          <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup" target="_blank" rel="noreferrer"
            className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
            <ExternalLink size={14} /> Meta Embedded Signup Documentation
          </a>
        </div>

        <button className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Save size={16} /> Save Settings
        </button>
      </div>
    </div>
  );
}
