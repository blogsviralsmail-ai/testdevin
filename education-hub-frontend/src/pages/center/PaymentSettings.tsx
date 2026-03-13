import { useState, useEffect } from "react";
import api from "../../lib/api";
import { CreditCard, Upload, Save, QrCode, Building2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function CenterPaymentSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/api/centers/my/payment-settings")
      .then(r => setSettings(r.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api.put("/api/centers/my/payment-settings", settings);
      setMsg("Payment settings saved successfully!");
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/api/centers/my/payment-settings/upload-qr", formData);
      setSettings((prev: any) => ({ ...prev, upi_qr_url: res.data.qr_url }));
      setMsg("QR code uploaded! Click Save to apply.");
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "QR upload failed");
    } finally {
      setUploading(false);
    }
  };

  const update = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payment Settings</h1>
        <p className="text-sm text-gray-500">Set your UPI ID, QR code, and bank details for student payments</p>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes("success") || msg.includes("Save") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPI Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">UPI Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
              <input type="text" value={settings.upi_id || ""} onChange={e => update("upi_id", e.target.value)}
                placeholder="yourname@upi" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Image</label>
              {settings.upi_qr_url && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg inline-block">
                  <img src={settings.upi_qr_url.startsWith("/") ? API_URL + settings.upi_qr_url : settings.upi_qr_url} 
                    alt="QR Code" className="w-48 h-48 object-contain" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-2">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload QR"}
                  <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">Bank Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <input type="text" value={settings.account_holder_name || ""} onChange={e => update("account_holder_name", e.target.value)}
                placeholder="Full name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input type="text" value={settings.bank_name || ""} onChange={e => update("bank_name", e.target.value)}
                placeholder="e.g. State Bank of India" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input type="text" value={settings.account_number || ""} onChange={e => update("account_number", e.target.value)}
                placeholder="Account number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input type="text" value={settings.ifsc_code || ""} onChange={e => update("ifsc_code", e.target.value)}
                placeholder="e.g. SBIN0001234" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700 flex items-center gap-2 shadow-sm">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Preview */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">Student Payment View Preview</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">This is how your students will see the payment details:</p>
        <div className="bg-gray-50 rounded-lg p-4 max-w-md">
          {settings.upi_id && (
            <div className="mb-3">
              <p className="text-xs text-gray-500">UPI ID</p>
              <p className="text-sm font-medium">{settings.upi_id}</p>
            </div>
          )}
          {settings.upi_qr_url && (
            <div className="mb-3">
              <img src={settings.upi_qr_url.startsWith("/") ? API_URL + settings.upi_qr_url : settings.upi_qr_url} 
                alt="QR" className="w-32 h-32 object-contain mx-auto" />
            </div>
          )}
          {settings.bank_name && (
            <div className="border-t pt-3 mt-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium">Bank Transfer Details</p>
              <p className="text-sm"><span className="text-gray-500">Bank:</span> {settings.bank_name}</p>
              <p className="text-sm"><span className="text-gray-500">A/C:</span> {settings.account_number}</p>
              <p className="text-sm"><span className="text-gray-500">IFSC:</span> {settings.ifsc_code}</p>
              <p className="text-sm"><span className="text-gray-500">Name:</span> {settings.account_holder_name}</p>
            </div>
          )}
          {!settings.upi_id && !settings.bank_name && (
            <p className="text-sm text-gray-400 text-center py-4">No payment details set yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
