import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Settings, Save, Globe, Mail, CreditCard, Shield, Bell, Palette, Key } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 1;
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [vendorSettings, setVendorSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const { data } = await api.get('/configuration/site');
          const d = data.data || data;
          const map: Record<string, string> = {};
          (Array.isArray(d) ? d : d.items || d.data || []).forEach((s: { name: string; value: string }) => { map[s.name] = s.value || ''; });
          setSettings(map);
        }
        try {
          const { data: vs } = await api.get('/configuration/site');
          const vd = vs.data || vs;
          const vmap: Record<string, string> = {};
          (Array.isArray(vd) ? vd : vd.items || vd.data || []).forEach((s: { name: string; value: string }) => { vmap[s.name] = s.value || ''; });
          setVendorSettings(vmap);
        } catch { /* vendor settings may not exist */ }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, [isAdmin]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      if (isAdmin && activeTab !== 'whatsapp') {
        const entries = Object.entries(settings).map(([name, value]) => ({ name, value }));
        await api.post('/configuration/site', { settings: entries });
      }
      if (activeTab === 'whatsapp') {
        const entries = Object.entries(vendorSettings).map(([name, value]) => ({ name, value }));
        await api.post('/configuration/site', { settings: entries });
      }
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const adminTabs = [
    { key: 'general', label: 'General', icon: Globe },
    { key: 'email', label: 'Email (SMTP)', icon: Mail },
    { key: 'payment', label: 'Payment Gateways', icon: CreditCard },
    { key: 'whatsapp', label: 'WhatsApp API', icon: Key },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const vendorTabs = [
    { key: 'whatsapp', label: 'WhatsApp API', icon: Key },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const tabs = isAdmin ? adminTabs : vendorTabs;

  const generalFields = [
    { key: 'site_name', label: 'Site Name' },
    { key: 'site_url', label: 'Site URL' },
    { key: 'site_logo', label: 'Logo URL' },
    { key: 'site_favicon', label: 'Favicon URL' },
    { key: 'footer_text', label: 'Footer Text' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'select', options: ['0', '1'] },
  ];

  const emailFields = [
    { key: 'smtp_host', label: 'SMTP Host' },
    { key: 'smtp_port', label: 'SMTP Port' },
    { key: 'smtp_username', label: 'SMTP Username' },
    { key: 'smtp_password', label: 'SMTP Password', type: 'password' },
    { key: 'smtp_encryption', label: 'Encryption', type: 'select', options: ['tls', 'ssl', 'none'] },
    { key: 'mail_from_address', label: 'From Address' },
    { key: 'mail_from_name', label: 'From Name' },
  ];

  const paymentFields = [
    { key: 'razorpay_key_id', label: 'Razorpay Key ID' },
    { key: 'razorpay_key_secret', label: 'Razorpay Key Secret', type: 'password' },
    { key: 'stripe_publishable_key', label: 'Stripe Publishable Key' },
    { key: 'stripe_secret_key', label: 'Stripe Secret Key', type: 'password' },
    { key: 'paypal_client_id', label: 'PayPal Client ID' },
    { key: 'paypal_client_secret', label: 'PayPal Client Secret', type: 'password' },
    { key: 'paystack_public_key', label: 'Paystack Public Key' },
    { key: 'paystack_secret_key', label: 'Paystack Secret Key', type: 'password' },
    { key: 'phonepe_merchant_id', label: 'PhonePe Merchant ID' },
    { key: 'phonepe_salt_key', label: 'PhonePe Salt Key', type: 'password' },
    { key: 'yoomoney_shop_id', label: 'YooMoney Shop ID' },
    { key: 'yoomoney_secret_key', label: 'YooMoney Secret Key', type: 'password' },
  ];

  const whatsappFields = [
    { key: 'whatsapp_access_token', label: 'Access Token', type: 'password' },
    { key: 'whatsapp_phone_number_id', label: 'Phone Number ID' },
    { key: 'whatsapp_business_account_id', label: 'Business Account ID' },
    { key: 'webhook_verify_token', label: 'Webhook Verify Token' },
    { key: 'meta_app_id', label: 'Meta App ID' },
    { key: 'meta_app_secret', label: 'Meta App Secret', type: 'password' },
  ];

  const securityFields = [
    { key: 'login_attempts_limit', label: 'Max Login Attempts' },
    { key: 'session_timeout_minutes', label: 'Session Timeout (min)' },
    { key: 'enable_2fa', label: 'Enable 2FA', type: 'select', options: ['0', '1'] },
    { key: 'allowed_origins', label: 'Allowed Origins (CORS)' },
  ];

  const renderFields = (fields: { key: string; label: string; type?: string; options?: string[] }[]) => {
    const store = activeTab === 'whatsapp' && !isAdmin ? vendorSettings : settings;
    const setStore = activeTab === 'whatsapp' && !isAdmin ? setVendorSettings : setSettings;
    return fields.map(f => (
      <div key={f.key}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
        {f.type === 'select' ? (
          <select value={store[f.key] || ''} onChange={e => setStore({ ...store, [f.key]: e.target.value })} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
            {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={f.type || 'text'} value={store[f.key] || ''} onChange={e => setStore({ ...store, [f.key]: e.target.value })} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" />
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Settings</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{isAdmin ? 'Platform configuration' : 'Your settings'}</p></div>
        <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"><Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}</button>
      </div>

      <div className="flex gap-6">
        {/* Tab Sidebar */}
        <div className="w-48 space-y-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${activeTab === tab.key ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800'}`}><tab.icon size={16} /> {tab.label}</button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          {loading ? (
            <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-4 max-w-xl">
              {activeTab === 'general' && renderFields(generalFields)}
              {activeTab === 'email' && renderFields(emailFields)}
              {activeTab === 'payment' && renderFields(paymentFields)}
              {activeTab === 'whatsapp' && renderFields(whatsappFields)}
              {activeTab === 'security' && renderFields(securityFields)}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Notification preferences</p>
                  {['email_on_new_message', 'email_on_new_contact', 'push_notifications', 'sound_notifications'].map(key => (
                    <div key={key} className="flex items-center justify-between py-2 border-b dark:border-slate-700">
                      <span className="text-sm dark:text-gray-300">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                      <select value={settings[key] || vendorSettings[key] || '1'} onChange={e => { if (isAdmin) setSettings({...settings, [key]: e.target.value}); else setVendorSettings({...vendorSettings, [key]: e.target.value}); }} className="px-2 py-1 border dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white">
                        <option value="1">Enabled</option><option value="0">Disabled</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
