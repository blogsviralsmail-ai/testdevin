import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Settings, MessageSquare, Facebook, Instagram, Brain, Save } from 'lucide-react';
import api from '../../services/api';

const PAGE_META: Record<string, { title: string; description: string; icon: any; fields: { key: string; label: string; type: string; placeholder: string }[] }> = {
  general: {
    title: 'General Settings',
    description: 'Configure your vendor account general settings',
    icon: Settings,
    fields: [
      { key: 'business_name', label: 'Business Name', type: 'text', placeholder: 'Your Business Name' },
      { key: 'business_email', label: 'Business Email', type: 'email', placeholder: 'contact@business.com' },
      { key: 'business_phone', label: 'Business Phone', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
      { key: 'business_website', label: 'Website', type: 'url', placeholder: 'https://your-business.com' },
      { key: 'business_address', label: 'Business Address', type: 'text', placeholder: 'Full address' },
      { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'Asia/Kolkata' },
    ]
  },
  whatsapp: {
    title: 'WhatsApp Configuration',
    description: 'Configure WhatsApp Cloud API settings',
    icon: MessageSquare,
    fields: [
      { key: 'facebook_app_id', label: 'Facebook App ID', type: 'text', placeholder: 'Enter Facebook App ID' },
      { key: 'facebook_app_secret', label: 'Facebook App Secret', type: 'password', placeholder: 'Enter App Secret' },
      { key: 'whatsapp_business_account_id', label: 'WhatsApp Business Account ID', type: 'text', placeholder: 'WABA ID' },
      { key: 'whatsapp_access_token', label: 'Permanent Access Token', type: 'password', placeholder: 'Enter Access Token' },
      { key: 'current_phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: 'Phone Number ID from Meta' },
      { key: 'current_phone_number_number', label: 'Phone Number', type: 'text', placeholder: '+91XXXXXXXXXX' },
      { key: 'webhook_verify_token', label: 'Webhook Verify Token', type: 'text', placeholder: 'Custom verify token' },
    ]
  },
  facebook: {
    title: 'Facebook Configuration',
    description: 'Configure Facebook Messenger integration',
    icon: Facebook,
    fields: [
      { key: 'facebook_page_id', label: 'Facebook Page ID', type: 'text', placeholder: 'Page ID' },
      { key: 'facebook_page_access_token', label: 'Page Access Token', type: 'password', placeholder: 'Enter Page Access Token' },
    ]
  },
  instagram: {
    title: 'Instagram Configuration',
    description: 'Configure Instagram messaging integration',
    icon: Instagram,
    fields: [
      { key: 'instagram_account_id', label: 'Instagram Account ID', type: 'text', placeholder: 'Account ID' },
      { key: 'instagram_access_token', label: 'Access Token', type: 'password', placeholder: 'Enter Access Token' },
    ]
  },
  'ai-bot': {
    title: 'AI Bot Settings',
    description: 'Configure AI chatbot and auto-reply settings',
    icon: Brain,
    fields: [
      { key: 'ai_enabled', label: 'Enable AI Auto Reply', type: 'checkbox', placeholder: '' },
      { key: 'openai_api_key', label: 'OpenAI API Key', type: 'password', placeholder: 'sk-...' },
      { key: 'ai_model', label: 'AI Model', type: 'text', placeholder: 'gpt-3.5-turbo' },
      { key: 'ai_system_prompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful customer support assistant...' },
      { key: 'ai_temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
      { key: 'ai_max_tokens', label: 'Max Tokens', type: 'text', placeholder: '500' },
    ]
  },
};

export default function VendorSettingsPage() {
  const { pageType } = useParams<{ pageType: string }>();
  const meta = PAGE_META[pageType || 'general'] || PAGE_META.general;
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/vendor-settings/${pageType || 'general'}`).then((r: any) => {
      if (r.data?.data) setFormData(r.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [pageType]);

  const handleSave = async () => {
    try {
      await api.post(`/vendor-settings/${pageType || 'general'}`, formData);
    } catch {}
  };

  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Icon className="text-gray-600" /> {meta.title}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{meta.description}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {meta.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 text-sm"
                    rows={4}
                    placeholder={field.placeholder}
                  />
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData[field.key] === '1' || formData[field.key] === 'true'}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.checked ? '1' : '0' })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Enabled</span>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 text-sm"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 mt-4">
              <Save size={16} /> Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
