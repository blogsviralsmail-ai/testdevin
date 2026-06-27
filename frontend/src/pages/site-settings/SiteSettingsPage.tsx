import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Globe, Save } from 'lucide-react';

const TABS = [
  'General', 'Home Page', 'Features Page', 'Pricing Page', 'About Us',
  'Contact Us', 'Login Page', 'Footer', 'SEO & Analytics', 'Social Media',
  'WhatsApp', 'AI Chatbot', 'Policies', 'Branding',
];

type TabKey = string;

const TAB_FIELDS: Record<TabKey, { key: string; label: string; type?: string; rows?: number; placeholder?: string }[]> = {
  'General': [
    { key: 'company_name', label: 'Business/Company Name', placeholder: 'WabaPanel' },
    { key: 'site_description', label: 'Tagline / Description', placeholder: 'WhatsApp Business API Platform' },
    { key: 'contact_email', label: 'Contact Email', type: 'email' },
    { key: 'contact_phone', label: 'Contact Phone' },
    { key: 'contact_address', label: 'Address', type: 'textarea', rows: 2 },
    { key: 'timezone', label: 'Timezone', placeholder: 'Asia/Kolkata' },
    { key: 'default_language', label: 'Default Language', placeholder: 'en' },
  ],
  'Home Page': [
    { key: 'hero_title', label: 'Hero Title', placeholder: 'Grow Your Business with WhatsApp' },
    { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea', rows: 2, placeholder: 'Engage customers on WhatsApp with automation...' },
    { key: 'hero_cta_text', label: 'CTA Button Text', placeholder: 'Get Started Free' },
    { key: 'hero_cta_url', label: 'CTA Button URL', placeholder: '/register' },
    { key: 'hero_image_url', label: 'Hero Image URL' },
    { key: 'features_section_title', label: 'Features Section Title', placeholder: 'Powerful Features' },
    { key: 'testimonials_section_title', label: 'Testimonials Section Title' },
  ],
  'Features Page': [
    { key: 'features_page_title', label: 'Page Title', placeholder: 'Our Features' },
    { key: 'features_page_description', label: 'Page Description', type: 'textarea', rows: 3 },
    { key: 'features_page_meta_title', label: 'Meta Title' },
    { key: 'features_page_meta_description', label: 'Meta Description' },
  ],
  'Pricing Page': [
    { key: 'pricing_page_title', label: 'Page Title', placeholder: 'Pricing Plans' },
    { key: 'pricing_page_description', label: 'Page Description', type: 'textarea', rows: 2 },
    { key: 'pricing_page_meta_title', label: 'Meta Title' },
    { key: 'pricing_page_meta_description', label: 'Meta Description' },
    { key: 'pricing_currency_symbol', label: 'Currency Symbol', placeholder: '₹' },
    { key: 'pricing_annual_discount', label: 'Annual Discount %', placeholder: '20' },
  ],
  'About Us': [
    { key: 'about_page_title', label: 'Page Title', placeholder: 'About Us' },
    { key: 'about_page_content', label: 'Page Content', type: 'textarea', rows: 6 },
    { key: 'about_page_meta_title', label: 'Meta Title' },
    { key: 'about_page_meta_description', label: 'Meta Description' },
  ],
  'Contact Us': [
    { key: 'contact_page_title', label: 'Page Title', placeholder: 'Contact Us' },
    { key: 'contact_page_description', label: 'Page Description', type: 'textarea', rows: 2 },
    { key: 'contact_form_email', label: 'Form Email Recipient' },
    { key: 'contact_google_maps_embed', label: 'Google Maps Embed URL' },
    { key: 'contact_page_meta_title', label: 'Meta Title' },
  ],
  'Login Page': [
    { key: 'login_page_title', label: 'Login Title', placeholder: 'Welcome Back' },
    { key: 'login_page_description', label: 'Login Description' },
    { key: 'register_page_title', label: 'Register Title', placeholder: 'Create Account' },
    { key: 'register_page_description', label: 'Register Description' },
    { key: 'login_bg_image_url', label: 'Background Image URL' },
  ],
  'Footer': [
    { key: 'footer_text', label: 'Footer Text', placeholder: '© 2024 WabaPanel. All rights reserved.' },
    { key: 'footer_description', label: 'Footer Description', type: 'textarea', rows: 2 },
    { key: 'footer_link_1_text', label: 'Footer Link 1 Text' },
    { key: 'footer_link_1_url', label: 'Footer Link 1 URL' },
    { key: 'footer_link_2_text', label: 'Footer Link 2 Text' },
    { key: 'footer_link_2_url', label: 'Footer Link 2 URL' },
  ],
  'SEO & Analytics': [
    { key: 'meta_title', label: 'Default Meta Title' },
    { key: 'meta_description', label: 'Default Meta Description', type: 'textarea', rows: 2 },
    { key: 'meta_keywords', label: 'Meta Keywords' },
    { key: 'google_analytics_id', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX' },
    { key: 'meta_pixel_id', label: 'Meta Pixel ID' },
    { key: 'google_tag_manager_id', label: 'Google Tag Manager ID', placeholder: 'GTM-XXXXXXX' },
    { key: 'custom_head_script', label: 'Custom Head Script', type: 'textarea', rows: 4 },
  ],
  'Social Media': [
    { key: 'social_facebook', label: 'Facebook URL' },
    { key: 'social_twitter', label: 'Twitter/X URL' },
    { key: 'social_instagram', label: 'Instagram URL' },
    { key: 'social_linkedin', label: 'LinkedIn URL' },
    { key: 'social_youtube', label: 'YouTube URL' },
    { key: 'social_whatsapp', label: 'WhatsApp Number' },
  ],
  'WhatsApp': [
    { key: 'whatsapp_widget_enabled', label: 'Enable WhatsApp Widget (1/0)', placeholder: '1' },
    { key: 'whatsapp_widget_number', label: 'WhatsApp Number', placeholder: '+91XXXXXXXXXX' },
    { key: 'whatsapp_widget_message', label: 'Default Message', placeholder: 'Hi! I need help' },
    { key: 'whatsapp_widget_position', label: 'Widget Position', placeholder: 'bottom-right' },
  ],
  'AI Chatbot': [
    { key: 'chatbot_enabled', label: 'Enable AI Chatbot (1/0)', placeholder: '0' },
    { key: 'chatbot_name', label: 'Bot Name', placeholder: 'WabaBot' },
    { key: 'chatbot_welcome_message', label: 'Welcome Message', type: 'textarea', rows: 2 },
    { key: 'chatbot_api_key', label: 'OpenAI API Key', type: 'password' },
    { key: 'chatbot_model', label: 'AI Model', placeholder: 'gpt-3.5-turbo' },
  ],
  'Policies': [
    { key: 'terms_content', label: 'Terms & Conditions', type: 'textarea', rows: 8 },
    { key: 'privacy_content', label: 'Privacy Policy', type: 'textarea', rows: 8 },
    { key: 'refund_content', label: 'Refund Policy', type: 'textarea', rows: 8 },
  ],
  'Branding': [
    { key: 'logo_image_url', label: 'Logo URL' },
    { key: 'small_logo_image_url', label: 'Small Logo URL' },
    { key: 'favicon_url', label: 'Favicon URL' },
    { key: 'dark_logo_image_url', label: 'Dark Theme Logo URL' },
    { key: 'primary_color', label: 'Primary Color', placeholder: '#667eea' },
    { key: 'secondary_color', label: 'Secondary Color', placeholder: '#764ba2' },
  ],
};

export default function SiteSettingsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/site-settings');
        setSettings(data.data || data || {});
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/site-settings', settings);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  const fields = TAB_FIELDS[activeTab] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="text-indigo-600" /> Site Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Customize your entire website from one place — content, design, SEO, and more</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold">
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  value={settings[field.key] || ''}
                  onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  rows={field.rows || 3}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={settings[field.key] || ''}
                  onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
