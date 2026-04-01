import { useState, useEffect, useRef } from "react";
import api, { getUser } from "../../lib/api";
import { Settings, Save, Building2, Upload, X, Image } from "lucide-react";

export default function CenterSettings() {
  const user = getUser();
  const centerId = user?.center?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    receipt_company_name: "",
    receipt_address: "",
    receipt_phone: "",
    receipt_email: "",
    receipt_logo_url: "",
    receipt_footer: "",
  });

  useEffect(() => {
    if (centerId) {
      api.get(`/api/settings/center-settings/${centerId}`)
        .then((r) => {
          setForm({
            receipt_company_name: r.data.receipt_company_name || "",
            receipt_address: r.data.receipt_address || "",
            receipt_phone: r.data.receipt_phone || "",
            receipt_email: r.data.receipt_email || "",
            receipt_logo_url: r.data.receipt_logo_url || "",
            receipt_footer: r.data.receipt_footer || "",
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [centerId]);

  const handleSave = async () => {
    if (!centerId) return;
    setSaving(true);
    setSuccess("");
    try {
      await api.put(`/api/settings/center-settings/${centerId}`, form);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setSuccess("Error: " + (e?.response?.data?.detail || "Failed to save settings"));
      setTimeout(() => setSuccess(""), 5000);
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !centerId) return;
    if (!file.type.startsWith("image/")) {
      setSuccess("Error: Please select an image file (PNG, JPG, etc.)");
      setTimeout(() => setSuccess(""), 5000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSuccess("Error: File size must be less than 5MB");
      setTimeout(() => setSuccess(""), 5000);
      return;
    }
    setUploading(true);
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/api/settings/center-settings/${centerId}/upload-logo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm({ ...form, receipt_logo_url: res.data.logo_url });
      setSuccess("Logo uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setSuccess("Error: " + (err?.response?.data?.detail || "Failed to upload logo"));
      setTimeout(() => setSuccess(""), 5000);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLogo = () => {
    setForm({ ...form, receipt_logo_url: "" });
  };

  const getLogoFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = (api.defaults.baseURL || "").replace(/\/$/, "");
    return base + url;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-bold">Center Settings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <Building2 className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold">Receipt / Invoice Details</h2>
            <p className="text-sm text-gray-500">These details will appear on fee receipts and invoices generated for your center's students.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company / Center Name</label>
            <input type="text" value={form.receipt_company_name} onChange={(e) => setForm({ ...form, receipt_company_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="e.g. KKHS Media Education Center" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={form.receipt_address} onChange={(e) => setForm({ ...form, receipt_address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="Full address for receipts" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={form.receipt_phone} onChange={(e) => setForm({ ...form, receipt_phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="+91-XXXXXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.receipt_email} onChange={(e) => setForm({ ...form, receipt_email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="center@example.com" />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo (for receipt header)</label>
            <div className="flex items-start gap-4">
              {form.receipt_logo_url ? (
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img src={getLogoFullUrl(form.receipt_logo_url)} alt="Center Logo" className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm" title="Remove logo">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                  <Image className="h-8 w-8 mb-1" />
                  <span className="text-xs">No Logo</span>
                </div>
              )}
              <div className="flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 hover:border-emerald-400 disabled:opacity-50 text-sm font-medium transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Logo"}
                </button>
                <p className="mt-1.5 text-xs text-gray-500">PNG, JPG, or SVG. Max 5MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Text</label>
            <textarea value={form.receipt_footer} onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="e.g. Thank you for choosing our center. This is a computer generated receipt." />
          </div>
        </div>

        {success && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${success.startsWith("Error") ? "bg-red-50 border border-red-200 text-red-800" : "bg-green-50 border border-green-200 text-green-800"}`}>{success}</div>
        )}

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Note:</strong> When fee receipts are generated for students admitted through your center, these details will be shown on the receipt instead of the admin's details.
      </div>
    </div>
  );
}
