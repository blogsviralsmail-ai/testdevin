import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Settings, UserCog, DollarSign, CreditCard, Mail, Share2, MoreHorizontal, Wrench, Save } from 'lucide-react';
import api from '../../services/api';

const PAGE_META: Record<string, { title: string; description: string; icon: any }> = {
  'user-vendor': { title: 'User & Vendor Settings', description: 'Configure user registration and vendor account settings', icon: UserCog },
  'currency': { title: 'Currency Settings', description: 'Set default currency and format options', icon: DollarSign },
  'payment': { title: 'Payment Gateway Settings', description: 'Configure payment gateways (Razorpay, Stripe, PayPal, etc.)', icon: CreditCard },
  'email': { title: 'Email / SMTP Settings', description: 'Configure email sending via SMTP or mail service', icon: Mail },
  'social-login': { title: 'Social Login Settings', description: 'Configure Google, Facebook, and other social login providers', icon: Share2 },
  'other': { title: 'Other Settings', description: 'Additional configuration options', icon: MoreHorizontal },
  'misc': { title: 'Miscellaneous Settings', description: 'System maintenance and miscellaneous options', icon: Wrench },
};

export default function ConfigPage() {
  const { pageType } = useParams<{ pageType: string }>();
  const meta = PAGE_META[pageType || ''] || { title: 'Configuration', description: '', icon: Settings };
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/configuration/${pageType}`).then((r: any) => {
      setConfig(r.data?.data || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [pageType]);

  const handleSave = async () => {
    try {
      await api.post(`/configuration/${pageType}`, config);
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
          <div className="text-center text-gray-400 py-8">Loading configuration...</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(config).length === 0 ? (
              <p className="text-gray-400 text-center py-8">No configuration items found for this section</p>
            ) : (
              Object.entries(config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  {(value || '').length > 100 ? (
                    <textarea
                      value={value}
                      onChange={e => setConfig({ ...config, [key]: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 text-sm"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={key.includes('password') || key.includes('secret') ? 'password' : 'text'}
                      value={value}
                      onChange={e => setConfig({ ...config, [key]: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 text-sm"
                    />
                  )}
                </div>
              ))
            )}
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 mt-4">
              <Save size={16} /> Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
