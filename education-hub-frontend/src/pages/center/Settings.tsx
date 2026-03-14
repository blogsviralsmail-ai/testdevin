import { useState, useEffect } from "react";
import api, { getUser } from "../../lib/api";
import { Settings, Save, Building2 } from "lucide-react";

export default function CenterSettings() {
  const user = getUser();
  const centerId = user?.center?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (for receipt header)</label>
            <input type="text" value={form.receipt_logo_url} onChange={(e) => setForm({ ...form, receipt_logo_url: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="https://example.com/logo.png" />
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
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">{success}</div>
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
