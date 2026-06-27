import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Globe, Save, Upload } from 'lucide-react';

interface SiteSettings {
  site_name: string; site_title: string; site_description: string; site_url: string;
  support_email: string; support_phone: string; logo_url: string; favicon_url: string;
  currency: string; currency_symbol: string; timezone: string;
  meta_pixel_id: string; google_analytics_id: string;
  terms_url: string; privacy_url: string; refund_url: string;
}

const defaultSettings: SiteSettings = {
  site_name: '', site_title: '', site_description: '', site_url: '',
  support_email: '', support_phone: '', logo_url: '', favicon_url: '',
  currency: 'INR', currency_symbol: '₹', timezone: 'Asia/Kolkata',
  meta_pixel_id: '', google_analytics_id: '',
  terms_url: '', privacy_url: '', refund_url: '',
};

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/site-settings'); setSettings({ ...defaultSettings, ...(data.data || data) }); }
      catch { /* */ } finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await api.put('/site-settings', settings); toast.success('Settings saved'); }
    catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const updateField = (field: keyof SiteSettings, value: string) => setSettings({ ...settings, [field]: value });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
      <h3 className="text-lg font-semibold dark:text-white mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const Field = ({ label, field, type = 'text' }: { label: string; field: keyof SiteSettings; type?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input type={type} value={settings[field]} onChange={(e) => updateField(field, e.target.value)}
        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Globe className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Site Settings</h1></div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50">
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <Section title="General">
        <Field label="Site Name" field="site_name" />
        <Field label="Site Title" field="site_title" />
        <div className="md:col-span-2"><Field label="Site Description" field="site_description" /></div>
        <Field label="Site URL" field="site_url" />
        <Field label="Support Email" field="support_email" type="email" />
        <Field label="Support Phone" field="support_phone" />
        <Field label="Timezone" field="timezone" />
      </Section>
      <Section title="Currency">
        <Field label="Currency Code" field="currency" />
        <Field label="Currency Symbol" field="currency_symbol" />
      </Section>
      <Section title="Branding">
        <Field label="Logo URL" field="logo_url" />
        <Field label="Favicon URL" field="favicon_url" />
      </Section>
      <Section title="Analytics & Tracking">
        <Field label="Meta Pixel ID" field="meta_pixel_id" />
        <Field label="Google Analytics ID" field="google_analytics_id" />
      </Section>
      <Section title="Legal Pages">
        <Field label="Terms & Conditions URL" field="terms_url" />
        <Field label="Privacy Policy URL" field="privacy_url" />
        <Field label="Refund Policy URL" field="refund_url" />
      </Section>
    </div>
  );
}
