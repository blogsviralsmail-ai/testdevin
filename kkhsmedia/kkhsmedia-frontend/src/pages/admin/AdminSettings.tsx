import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Save, Palette, Globe, Mail, Building, FileText, Share2, Youtube } from 'lucide-react';

export default function AdminSettings() {
  const { settings: currentSettings, refreshSettings } = useAuth();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('branding');
  const primary = currentSettings?.primaryColor || '#6366f1';

  useEffect(() => {
    adminAPI.getSettings().then(res => {
      setForm(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await adminAPI.updateSettings(form);
      setMsg('Settings saved successfully!');
      refreshSettings();
    } catch { setMsg('Failed to save settings.'); }
    setSaving(false);
  };

  const updateField = (key: string, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateSocialLink = (platform: string, url: string) => {
    const socialLinks = (form.socialLinks || {}) as Record<string, string>;
    setForm(prev => ({ ...prev, socialLinks: { ...socialLinks, [platform]: url } }));
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'email', label: 'Email & Payment', icon: Mail },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'youtube', label: 'YouTube API', icon: Youtube },
  ];

  if (loading) return <div className="text-center py-12 text-gray-500">Loading settings...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: primary }}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
              activeTab === tab.id ? 'text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
            style={activeTab === tab.id ? { backgroundColor: primary } : {}}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Branding Settings</h2>
          <p className="text-sm text-gray-500 mb-4">Customize your brand appearance across the entire platform.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand Name</label>
              <input type="text" value={(form.brandName as string) || ''} onChange={e => updateField('brandName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="KKHS Media" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input type="text" value={(form.companyName as string) || ''} onChange={e => updateField('companyName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="KKHS Media Private Limited" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input type="url" value={(form.logoUrl as string) || ''} onChange={e => updateField('logoUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="https://example.com/logo.png" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Favicon URL</label>
              <input type="url" value={(form.faviconUrl as string) || ''} onChange={e => updateField('faviconUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="https://example.com/favicon.ico" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input type="color" value={(form.primaryColor as string) || '#6366f1'} onChange={e => updateField('primaryColor', e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer" />
                <input type="text" value={(form.primaryColor as string) || '#6366f1'} onChange={e => updateField('primaryColor', e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secondary Color</label>
              <div className="flex gap-2">
                <input type="color" value={(form.secondaryColor as string) || '#8b5cf6'} onChange={e => updateField('secondaryColor', e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer" />
                <input type="text" value={(form.secondaryColor as string) || '#8b5cf6'} onChange={e => updateField('secondaryColor', e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 font-mono text-sm" />
              </div>
            </div>
          </div>
          {(form.logoUrl as string) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium mb-2">Logo Preview:</p>
              <img src={form.logoUrl as string} alt="Logo" className="h-12" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Company Information</h2>
          <p className="text-sm text-gray-500 mb-4">Update your company contact details displayed on the website.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input type="email" value={(form.contactEmail as string) || ''} onChange={e => updateField('contactEmail', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Support Email</label>
              <input type="email" value={(form.supportEmail as string) || ''} onChange={e => updateField('supportEmail', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input type="text" value={(form.phone as string) || ''} onChange={e => updateField('phone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GST Number</label>
              <input type="text" value={(form.gstNumber as string) || ''} onChange={e => updateField('gstNumber', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GST Rate (%)</label>
              <input type="number" value={(form.gstRate as number) || 18} onChange={e => updateField('gstRate', parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input type="text" value={(form.currency as string) || 'INR'} onChange={e => updateField('currency', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea value={(form.address as string) || ''} onChange={e => updateField('address', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-none" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(form.maintenanceMode as boolean) || false}
                onChange={e => updateField('maintenanceMode', e.target.checked)}
                className="w-4 h-4 rounded" />
              <span className="text-sm font-medium">Maintenance Mode</span>
            </label>
            <span className="text-xs text-gray-400">(Disables public access when enabled)</span>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Website Content</h2>
          <p className="text-sm text-gray-500 mb-4">Customize the text content displayed on your landing page.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Hero Title</label>
            <input type="text" value={(form.heroTitle as string) || ''} onChange={e => updateField('heroTitle', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="Stream Live 24/7" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hero Subtitle</label>
            <textarea value={(form.heroSubtitle as string) || ''} onChange={e => updateField('heroSubtitle', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-none"
              placeholder="Stream your Pre-Recorded videos 24x7..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Footer Text</label>
            <input type="text" value={(form.footerText as string) || ''} onChange={e => updateField('footerText', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
              placeholder="The Best Professional Pre-Recorded Video Live Streaming Platform." />
          </div>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Social Media Links</h2>
          <p className="text-sm text-gray-500 mb-4">Add your social media profile URLs.</p>
          {['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'telegram'].map(platform => (
            <div key={platform}>
              <label className="block text-sm font-medium mb-1 capitalize">{platform}</label>
              <input type="url"
                value={((form.socialLinks as Record<string, string>) || {})[platform] || ''}
                onChange={e => updateSocialLink(platform, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                placeholder={`https://${platform}.com/yourpage`} />
            </div>
          ))}
        </div>
      )}

      {/* Email & Payment Tab */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Email & Payment Configuration</h2>
          <p className="text-sm text-gray-500 mb-4">These settings are configured via environment variables on the server for security. Update them in the backend .env file.</p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Environment Variables</h3>
            <div className="text-sm text-yellow-700 space-y-1 font-mono">
              <p>SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS</p>
              <p>CASHFREE_APP_ID, CASHFREE_SECRET_KEY</p>
              <p>RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET</p>
              <p>AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-blue-800 mb-2">Current Configuration Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Payment Gateways: Cashfree + Razorpay (both supported)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Email: SMTP configured for OTP & notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Storage: AWS S3 for video uploads</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">SEO Settings</h2>
          <p className="text-sm text-gray-500 mb-4">Optimize your website for search engines.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Title</label>
            <input type="text" value={(form.metaTitle as string) || ''} onChange={e => updateField('metaTitle', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
              placeholder="KKHS Media - 24/7 Live Streaming Platform" />
            <p className="text-xs text-gray-400 mt-1">{((form.metaTitle as string) || '').length}/60 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea value={(form.metaDescription as string) || ''} onChange={e => updateField('metaDescription', e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-none"
              placeholder="Stream your pre-recorded videos 24/7 on YouTube, Facebook, Twitch & more..." />
            <p className="text-xs text-gray-400 mt-1">{((form.metaDescription as string) || '').length}/160 characters</p>
          </div>
        </div>
      )}
      {/* YouTube API Tab */}
      {activeTab === 'youtube' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">YouTube API Integration</h2>
          <p className="text-sm text-gray-500 mb-4">Configure Google OAuth2 credentials to allow users to connect their YouTube channels for custom thumbnail uploads on live streams.</p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h3 className="font-medium text-blue-800 mb-2">Setup Instructions</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Create a project (or select existing)</li>
              <li>Enable "YouTube Data API v3"</li>
              <li>Go to Credentials → Create OAuth 2.0 Client ID</li>
              <li>Set Authorized redirect URI to: <code className="bg-blue-100 px-1 rounded">https://api.kkhsmedia.com/api/youtube/callback</code></li>
              <li>Copy Client ID and Client Secret below</li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Google Client ID</label>
              <input type="text" value={(form.googleClientId as string) || ''} onChange={e => updateField('googleClientId', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="xxxx.apps.googleusercontent.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Google Client Secret</label>
              <input type="password" value={(form.googleClientSecret as string) || ''} onChange={e => updateField('googleClientSecret', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="GOCSPX-xxxx" />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-medium text-yellow-800 mb-2">How it works</h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc ml-4">
              <li>Users click "Connect YouTube" on their Live Slots page</li>
              <li>They authorize via Google OAuth2 consent screen</li>
              <li>When a stream starts, the custom thumbnail is automatically uploaded to their YouTube live broadcast</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
