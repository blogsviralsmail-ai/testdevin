import { useState, useEffect } from 'react';
import { Smartphone, Save, Upload, Palette } from 'lucide-react';
import api from '../../services/api';

export default function MobileAppPage() {
  const [config, setConfig] = useState({
    app_name: '',
    package_name: '',
    app_version: '',
    primary_color: '#25D366',
    secondary_color: '#128C7E',
    splash_screen_text: '',
    push_notification_key: '',
    onesignal_app_id: '',
    onesignal_rest_api_key: '',
    google_services_json: '',
    android_enabled: true,
    ios_enabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mobile-app-configuration').then((r: any) => {
      if (r.data?.data) setConfig({ ...config, ...r.data.data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Smartphone className="text-pink-600" /> Mobile App Configuration
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure mobile app settings for Android and iOS builds</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                <input type="text" value={config.app_name} onChange={e => setConfig({ ...config, app_name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="WabaPanel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                <input type="text" value={config.package_name} onChange={e => setConfig({ ...config, package_name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="com.wabapanel.app" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Version</label>
                <input type="text" value={config.app_version} onChange={e => setConfig({ ...config, app_version: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="1.0.0" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2"><Palette size={18} /> Theme Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.primary_color} onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer" />
                    <input type="text" value={config.primary_color} onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                      className="border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.secondary_color} onChange={e => setConfig({ ...config, secondary_color: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer" />
                    <input type="text" value={config.secondary_color} onChange={e => setConfig({ ...config, secondary_color: e.target.value })}
                      className="border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-800 mb-3">Push Notifications (OneSignal)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OneSignal App ID</label>
                  <input type="text" value={config.onesignal_app_id} onChange={e => setConfig({ ...config, onesignal_app_id: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="OneSignal App ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OneSignal REST API Key</label>
                  <input type="password" value={config.onesignal_rest_api_key} onChange={e => setConfig({ ...config, onesignal_rest_api_key: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="REST API Key" />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-800 mb-3">Platform Settings</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={config.android_enabled} onChange={e => setConfig({ ...config, android_enabled: e.target.checked })}
                    className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Android</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={config.ios_enabled} onChange={e => setConfig({ ...config, ios_enabled: e.target.checked })}
                    className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">iOS</span>
                </label>
              </div>
            </div>

            <button className="bg-pink-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-700">
              <Save size={16} /> Save Configuration
            </button>
          </>
        )}
      </div>
    </div>
  );
}
