"use client";

import { useState, useEffect, useCallback } from "react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
}

interface SettingItem {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    const [meRes, settingsRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/settings"),
    ]);
    if (meRes.ok) {
      const data = await meRes.json();
      setUser(data.user);
    }
    if (settingsRes.ok) {
      const data: SettingItem[] = await settingsRes.json();
      const map: Record<string, string> = {};
      data.forEach((s) => { map[s.key] = s.value; });
      setSettings(map);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setSaving(false);
    setSaved(true);
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 text-sm">Manage platform and website settings</p>
        </div>
        {isAdmin && (
          <button onClick={handleSave} disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        )}
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Profile */}
        <div className="bg-white rounded-xl p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={user?.name || ""} className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={user?.email || ""} className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input value={user?.role || ""} className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900 bg-gray-50 capitalize" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={user?.phone || ""} className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900 bg-gray-50" readOnly />
            </div>
          </div>
        </div>

        {/* Website Branding (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Website Branding</h2>
            <p className="text-sm text-gray-500 mb-4">Customize how your platform looks to students and visitors</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input value={settings.company_name || ""} onChange={(e) => updateSetting("company_name", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="Your Company Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo URL</label>
                <input value={settings.company_logo || ""} onChange={(e) => updateSetting("company_logo", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.primary_color || "#4f46e5"} onChange={(e) => updateSetting("primary_color", e.target.value)}
                    className="w-12 h-10 border rounded-lg cursor-pointer" />
                  <input value={settings.primary_color || "#4f46e5"} onChange={(e) => updateSetting("primary_color", e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                <input value={settings.company_address || ""} onChange={(e) => updateSetting("company_address", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="123, Street, City, State - PIN" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input value={settings.support_email || ""} onChange={(e) => updateSetting("support_email", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="support@yourcompany.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                <input value={settings.support_phone || ""} onChange={(e) => updateSetting("support_phone", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="+91 XXXXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input value={settings.website_url || ""} onChange={(e) => updateSetting("website_url", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="https://yourcompany.com" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page Tagline</label>
              <input value={settings.tagline || ""} onChange={(e) => updateSetting("tagline", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="Your company tagline..." />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">About Us</label>
              <textarea value={settings.about_us || ""} onChange={(e) => updateSetting("about_us", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" rows={3} placeholder="About your company..." />
            </div>
          </div>
        )}

        {/* Payment Settings (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Settings (Razorpay)</h2>
            <p className="text-sm text-gray-500 mb-4">Configure Razorpay payment gateway for paid internships</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key ID</label>
                <input value={settings.razorpay_key_id || ""} onChange={(e) => updateSetting("razorpay_key_id", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="rzp_live_..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Secret</label>
                <input type="password" value={settings.razorpay_secret || ""} onChange={(e) => updateSetting("razorpay_secret", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="Secret key" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Razorpay Dashboard se Key ID and Secret copy karo: https://dashboard.razorpay.com/app/keys
            </p>
          </div>
        )}

        {/* Notification Settings */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                  <p className="text-xs text-gray-500">Send email when student applies, interview scheduled, etc.</p>
                </div>
                <input type="checkbox" checked={settings.email_notifications === "true"}
                  onChange={(e) => updateSetting("email_notifications", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 rounded" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">WhatsApp Notifications</p>
                  <p className="text-xs text-gray-500">Send WhatsApp messages for important updates</p>
                </div>
                <input type="checkbox" checked={settings.whatsapp_notifications === "true"}
                  onChange={(e) => updateSetting("whatsapp_notifications", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 rounded" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Auto Attendance</p>
                  <p className="text-xs text-gray-500">Automatically mark student present when they open dashboard</p>
                </div>
                <input type="checkbox" checked={settings.auto_attendance !== "false"}
                  onChange={(e) => updateSetting("auto_attendance", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Platform Info */}
        <div className="bg-white rounded-xl p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Platform</span>
              <span className="font-medium text-gray-900">InternPro v1.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Framework</span>
              <span className="font-medium text-gray-900">Next.js + Prisma + SQLite</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Support</span>
              <span className="font-medium text-gray-900">{settings.support_email || "support@internpro.com"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
