import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Save, Palette, Globe, Mail, Building, FileText, Share2, Youtube, Upload, Image } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.golivepro.in';

interface LogoUploadProps {
  label: string;
  type: 'header' | 'footer' | 'favicon';
  currentUrl: string;
  sizeGuide: string;
  dimensions: string;
  onUploaded: (url: string) => void;
}

function LogoUpload({ label, type, currentUrl, sizeGuide, dimensions, onUploaded }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg('Only image files allowed'); return; }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('logo_type', type);
      const res = await adminAPI.uploadLogo(fd);
      onUploaded(res.data.url);
      setMsg('Uploaded successfully!');
    } catch {
      setMsg('Upload failed. Try again.');
    }
    setUploading(false);
  };

  const displayUrl = preview || (currentUrl ? (currentUrl.startsWith('http') ? currentUrl : `${API_URL}${currentUrl}`) : '');

  return (
    <div className="surface-subtle rounded-xl p-4 border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-medium text-sm">{label}</h3>
          <p className="text-xs text-tertiary">{sizeGuide} &middot; {dimensions}</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50">
          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {displayUrl ? (
        <div className="mt-2 p-3 bg-[rgb(var(--bg-base))] rounded-lg border flex items-center gap-3">
          <img src={displayUrl} alt={label} className="max-h-16 max-w-[200px] object-contain" />
          <span className="text-xs text-tertiary">Current logo</span>
        </div>
      ) : (
        <div className="mt-2 p-6 bg-[rgb(var(--bg-base))] rounded-lg border border-dashed flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => fileRef.current?.click()}>
          <Image size={24} className="text-tertiary" />
          <span className="text-xs text-tertiary">Click to upload or drag &amp; drop</span>
        </div>
      )}
      {msg && <p className={`text-xs mt-2 ${msg.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{msg}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const { settings: currentSettings, refreshSettings } = useAuth();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('branding');
  const primary = currentSettings?.primaryColor || '#1B4F8A';

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

  if (loading) return <div className="text-center py-12 text-tertiary">Loading settings...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: primary }}>
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
              activeTab === tab.id ? 'text-white' : 'surface-base border text-secondary hover:bg-[rgb(var(--bg-muted))]'
            }`}
            style={activeTab === tab.id ? { backgroundColor: primary } : {}}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {/* Logo Upload Section */}
          <div className="surface-base rounded-xl border p-6">
            <h2 className="font-semibold text-lg mb-1">Logo Management</h2>
            <p className="text-sm text-tertiary mb-4">Upload your brand logos. Supported formats: PNG, JPG, WebP, SVG. Use transparent PNG for best results.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <LogoUpload
                label="Header Logo (Navbar)"
                type="header"
                currentUrl={(form.headerLogoUrl as string) || ''}
                sizeGuide="Recommended: 200 × 50px"
                dimensions="Transparent PNG"
                onUploaded={(url) => updateField('headerLogoUrl', url)}
              />
              <LogoUpload
                label="Footer Logo"
                type="footer"
                currentUrl={(form.footerLogoUrl as string) || ''}
                sizeGuide="Recommended: 160 × 40px"
                dimensions="Transparent PNG"
                onUploaded={(url) => updateField('footerLogoUrl', url)}
              />
              <LogoUpload
                label="Favicon (Browser Tab)"
                type="favicon"
                currentUrl={(form.faviconUrl as string) || ''}
                sizeGuide="Recommended: 512 × 512px"
                dimensions="Square PNG"
                onUploaded={(url) => updateField('faviconUrl', url)}
              />
            </div>
          </div>

          {/* Brand Settings */}
          <div className="surface-base rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg mb-2">Brand Colors & Name</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name</label>
                <input type="text" value={(form.brandName as string) || ''} onChange={e => updateField('brandName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="GoLivePro" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input type="text" value={(form.companyName as string) || ''} onChange={e => updateField('companyName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" placeholder="KKHS Media Private Limited" />
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
          </div>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="surface-base rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Company Information</h2>
          <p className="text-sm text-tertiary mb-4">Update your company contact details displayed on the website.</p>
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
            <span className="text-xs text-tertiary">(Disables public access when enabled)</span>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="surface-base rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Website Content</h2>
          <p className="text-sm text-tertiary mb-4">Customize the text content displayed on your landing page. Changes reflect instantly after saving.</p>
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
        <div className="surface-base rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Social Media Links</h2>
          <p className="text-sm text-tertiary mb-4">Add your social media profile URLs.</p>
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
        <div className="surface-base rounded-xl border p-6 space-y-6">
          <h2 className="font-semibold text-lg mb-2">Email, Payment & API Configuration</h2>
          <p className="text-sm text-tertiary mb-4">Configure all API keys and credentials here. These are stored securely in the database. Leave blank to use environment variable fallback.</p>

          {/* SMTP Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-primary border-b pb-2">SMTP / Email Settings</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">SMTP Host</label>
                <input type="text" value={(form.smtpHost as string) || ''} onChange={e => updateField('smtpHost', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">SMTP Port</label>
                <input type="number" value={(form.smtpPort as number) || ''} onChange={e => updateField('smtpPort', parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="587" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">SMTP User</label>
                <input type="text" value={(form.smtpUser as string) || ''} onChange={e => updateField('smtpUser', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">SMTP Password</label>
                <input type="password" value={(form.smtpPassword as string) || ''} onChange={e => updateField('smtpPassword', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="App password" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">From Email</label>
                <input type="email" value={(form.fromEmail as string) || ''} onChange={e => updateField('fromEmail', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="noreply@yoursite.com" />
              </div>
            </div>
          </div>

          {/* Cashfree Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-primary border-b pb-2">Cashfree Payment Gateway</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">App ID</label>
                <input type="text" value={(form.cashfreeAppId as string) || ''} onChange={e => updateField('cashfreeAppId', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="Cashfree App ID" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">Secret Key</label>
                <input type="password" value={(form.cashfreeSecretKey as string) || ''} onChange={e => updateField('cashfreeSecretKey', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="Cashfree Secret Key" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">Environment</label>
                <select value={(form.cashfreeEnv as string) || 'sandbox'} onChange={e => updateField('cashfreeEnv', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2">
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Razorpay Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-primary border-b pb-2">Razorpay Payment Gateway</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">Key ID</label>
                <input type="text" value={(form.razorpayKeyId as string) || ''} onChange={e => updateField('razorpayKeyId', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="rzp_test_..." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">Key Secret</label>
                <input type="password" value={(form.razorpayKeySecret as string) || ''} onChange={e => updateField('razorpayKeySecret', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="Razorpay Secret" />
              </div>
            </div>
          </div>

          {/* AWS S3 Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-primary border-b pb-2">AWS S3 Storage</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">Access Key ID</label>
                <input type="text" value={(form.awsAccessKeyId as string) || ''} onChange={e => updateField('awsAccessKeyId', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="AKIA..." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">Secret Access Key</label>
                <input type="password" value={(form.awsSecretAccessKey as string) || ''} onChange={e => updateField('awsSecretAccessKey', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="AWS Secret" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">S3 Bucket Name</label>
                <input type="text" value={(form.awsS3Bucket as string) || ''} onChange={e => updateField('awsS3Bucket', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="my-bucket" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">Region</label>
                <input type="text" value={(form.awsRegion as string) || ''} onChange={e => updateField('awsRegion', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="ap-south-1" />
              </div>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-primary border-b pb-2">WhatsApp Notifications</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-secondary">WhatsApp API Key</label>
              <input type="password" value={(form.whatsappApiKey as string) || ''} onChange={e => updateField('whatsappApiKey', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="WhatsApp Business API Key" />
            </div>
          </div>

          {/* Telegram Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-primary border-b pb-2">Telegram Bot</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-secondary">Bot Token</label>
              <input type="password" value={(form.telegramBotToken as string) || ''} onChange={e => updateField('telegramBotToken', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="123456:ABC-DEF..." />
            </div>
          </div>

          {/* Facebook Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-primary border-b pb-2">Facebook Integration</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">App ID</label>
                <input type="text" value={(form.facebookAppId as string) || ''} onChange={e => updateField('facebookAppId', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="Facebook App ID" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-secondary">App Secret</label>
                <input type="password" value={(form.facebookAppSecret as string) || ''} onChange={e => updateField('facebookAppSecret', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" placeholder="Facebook App Secret" />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <p className="text-xs text-blue-700">All credentials are stored encrypted in the database. If a field is left blank, the system will fall back to server environment variables.</p>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="surface-base rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">SEO Settings</h2>
          <p className="text-sm text-tertiary mb-4">Optimize your website for search engines.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Title</label>
            <input type="text" value={(form.metaTitle as string) || ''} onChange={e => updateField('metaTitle', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
              placeholder="GoLivePro - The Professional Live Streaming Studio" />
            <p className="text-xs text-tertiary mt-1">{((form.metaTitle as string) || '').length}/60 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea value={(form.metaDescription as string) || ''} onChange={e => updateField('metaDescription', e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-none"
              placeholder="Stream your pre-recorded videos 24/7 on YouTube, Facebook, Twitch & more..." />
            <p className="text-xs text-tertiary mt-1">{((form.metaDescription as string) || '').length}/160 characters</p>
          </div>
        </div>
      )}

      {/* YouTube API Tab */}
      {activeTab === 'youtube' && (
        <div className="surface-base rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">YouTube API Integration</h2>
          <p className="text-sm text-tertiary mb-4">Configure Google OAuth2 credentials to allow users to connect their YouTube channels for custom thumbnail uploads on live streams.</p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h3 className="font-medium text-blue-800 mb-2">Setup Instructions</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Create a project (or select existing)</li>
              <li>Enable &quot;YouTube Data API v3&quot;</li>
              <li>Go to Credentials &rarr; Create OAuth 2.0 Client ID</li>
              <li>Set Authorized redirect URI to: <code className="bg-blue-100 px-1 rounded">https://api.golivepro.in/api/youtube/callback</code></li>
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
              <li>Users click &quot;Connect YouTube&quot; on their Live Slots page</li>
              <li>They authorize via Google OAuth2 consent screen</li>
              <li>When a stream starts, the custom thumbnail is automatically uploaded to their YouTube live broadcast</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
