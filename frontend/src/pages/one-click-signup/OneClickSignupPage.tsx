import { useState, useEffect } from 'react';
import { MousePointerClick, Save, ExternalLink, Info, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export default function OneClickSignupPage() {
  const [manualEnabled, setManualEnabled] = useState(false);
  const [embeddedEnabled, setEmbeddedEnabled] = useState(false);
  const [businessAppEnabled, setBusinessAppEnabled] = useState(false);
  const [embeddedData, setEmbeddedData] = useState({
    app_id: '',
    app_secret: '',
    config_id: '',
  });
  const [existingSettings, setExistingSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/config/whatsapp-onboarding').then((r: any) => {
      const d = r.data?.data || {};
      setManualEnabled(!!d.enable_whatsapp_manual_signup);
      setEmbeddedEnabled(!!d.enable_embedded_signup);
      setBusinessAppEnabled(!!d.enable_business_app_onboarding);
      if (d.embedded_signup_app_id) {
        setEmbeddedData({
          app_id: d.embedded_signup_app_id || '',
          app_secret: d.embedded_signup_app_secret || '',
          config_id: d.embedded_signup_config_id || '',
        });
        setExistingSettings(true);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSaveManual = async () => {
    try {
      await api.post('/config/manual-whatsapp-onboarding', { enable_whatsapp_manual_signup: manualEnabled });
    } catch {}
  };

  const handleSaveEmbedded = async () => {
    try {
      await api.post('/config/whatsapp-onboarding', {
        enable_embedded_signup: embeddedEnabled,
        enable_business_app_onboarding: businessAppEnabled,
        ...embeddedData,
      });
      if (embeddedData.app_id) setExistingSettings(true);
      setEditMode(false);
    } catch {}
  };

  const hostRoot = window.location.origin;
  const isHttps = hostRoot.startsWith('https://');

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MousePointerClick className="text-green-600" /> WhatsApp Onboarding Setup
        </h1>
      </div>

      {/* Manual Onboarding Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Manual Onboarding</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
          <div>
            <h3 className="font-medium text-gray-800">Enable Manual WhatsApp Onboarding</h3>
            <p className="text-sm text-gray-500">Allow vendors to manually enter their WhatsApp API credentials</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={manualEnabled} onChange={e => setManualEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
        </div>
        <button onClick={handleSaveManual} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Save size={16} /> Save
        </button>
      </div>

      {/* Embedded Signup Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Embedded Signup Onboarding
        </h2>

        {/* Requirements section */}
        <div className="mb-4">
          <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg px-4 py-2">
            <Info size={16} />
            Requirements and Information
            {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showHelp && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
            <div className="flex justify-end gap-2">
              <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup/" target="_blank" rel="noreferrer"
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                More Information <ExternalLink size={12} className="inline" />
              </a>
              <a href="https://developers.facebook.com/docs/whatsapp/solution-providers/get-started-for-tech-providers" target="_blank" rel="noreferrer"
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                Get started for Tech Provider <ExternalLink size={12} className="inline" />
              </a>
            </div>

            <div>
              <h4 className="font-medium">Verified Meta Account</h4>
              <p className="text-sm text-gray-600">To use Embedded signup your Meta account must be verified.
                <a href="https://www.facebook.com/business/help/2058515294227817?id=180505742745347" target="_blank" rel="noreferrer" className="text-blue-600 ml-1">How to verify?</a>
              </p>
            </div>

            <div>
              <h4 className="font-medium">Become a Tech Provider</h4>
              <p className="text-sm text-gray-600">Follow the instructions to become a WhatsApp Tech Provider.
                <a href="https://developers.facebook.com/docs/whatsapp/solution-providers/get-started-for-tech-providers" target="_blank" rel="noreferrer" className="text-blue-600 ml-1">How to become Tech Provider?</a>
              </p>
              <p className="text-sm font-medium mt-2">All three items must show green enabled status once approved</p>
            </div>

            <div className="border border-red-200 rounded-lg p-3 bg-red-50 text-sm text-red-700">
              <strong>Important:</strong>
              <p className="mt-1 font-medium">1) You must request public_profile and email permissions in addition to WhatsApp permissions.</p>
              <p className="font-medium">2) Webhook will be created automatically after App ID & App Secret validation.</p>
            </div>

            <div>
              <h4 className="font-medium">You are almost ready</h4>
              <p className="text-sm text-gray-600">Now set App ID, App Secret and Config ID below.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Allowed Domain (required for Facebook configuration)</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="text" readOnly value={hostRoot} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-100" />
                <button onClick={() => navigator.clipboard.writeText(hostRoot)} className="text-sm bg-gray-200 px-3 py-2 rounded hover:bg-gray-300">Copy</button>
              </div>
              {!isHttps && (
                <div className="mt-2 bg-red-100 text-red-700 p-2 rounded text-sm">
                  Facebook requires HTTPS domain for Embedded Signup.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enable Embedded Signup */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
          <div>
            <h3 className="font-medium text-gray-800">Enable Embedded Signup</h3>
            <p className="text-sm text-yellow-600">Please do not use the same app for any other purposes like Manual WhatsApp API Setup etc</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={embeddedEnabled} onChange={e => setEmbeddedEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
        </div>

        {/* Existing Settings / Edit Mode */}
        {existingSettings && !editMode ? (
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <CheckCircle size={16} /> Embedded Signup Settings exist
            </span>
            <button onClick={() => setEditMode(true)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">Update</button>
            {embeddedData.app_id && (
              <a href={`https://developers.facebook.com/apps/${embeddedData.app_id}/whatsapp-business/wa-settings`} target="_blank" rel="noreferrer"
                className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
                Go to App <ExternalLink size={12} />
              </a>
            )}
          </div>
        ) : (
          <div className="max-w-md space-y-4 mb-4">
            <div className="flex justify-end">
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started-for-tech-providers#step-2--create-a-meta-app" target="_blank" rel="noreferrer"
                className="text-sm text-blue-600 flex items-center gap-1">Help <ExternalLink size={12} /></a>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
              <input type="text" value={embeddedData.app_id} onChange={e => setEmbeddedData({ ...embeddedData, app_id: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="Facebook App ID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
              <input type="password" value={embeddedData.app_secret} onChange={e => setEmbeddedData({ ...embeddedData, app_secret: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="Facebook App Secret" />
            </div>
            <div className="flex justify-end">
              <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup/embed-the-flow#step-2--create-facebook-login-for-business-configuration" target="_blank" rel="noreferrer"
                className="text-sm text-blue-600 flex items-center gap-1">Help <ExternalLink size={12} /></a>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Config ID</label>
              <input type="text" value={embeddedData.config_id} onChange={e => setEmbeddedData({ ...embeddedData, config_id: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="Facebook Login Config ID" />
            </div>
          </div>
        )}

        {/* Coexistence Mode */}
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Existing WhatsApp Business App</h3>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={businessAppEnabled} onChange={e => setBusinessAppEnabled(e.target.checked)}
              className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Enable WhatsApp Business App Onboarding (aka Coexistence) using Embedded Signup</span>
          </label>
          <p className="text-xs text-yellow-600 mt-1 italic">
            Please note once connected existing contacts from WhatsApp Business Mobile App will sync, but messages will NOT.
          </p>
        </div>

        <button onClick={handleSaveEmbedded} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Save size={16} /> Save
        </button>
      </div>
    </div>
  );
}
