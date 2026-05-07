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
  const [sigUploading, setSigUploading] = useState(false);

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

  const handleSignatureUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { alert("File must be less than 2MB"); return; }
    setSigUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        updateSetting("admin_signature", data.url);
      }
    } catch { /* ignore */ }
    setSigUploading(false);
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

        {/* Signature Settings (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Authorized Signature</h2>
            <p className="text-sm text-gray-500 mb-4">Upload your signature image — it will appear on offer letters and experience letters</p>
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature Image</label>
                <input type="file" accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleSignatureUpload(e.target.files[0])}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                <p className="text-xs text-gray-400 mt-1">PNG with transparent background recommended. Max 2MB.</p>
                {sigUploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
              </div>
              {settings.admin_signature && (
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <div className="border rounded-lg p-2 bg-gray-50">
                    <img src={settings.admin_signature} alt="Signature" className="h-16 max-w-[200px] object-contain" />
                  </div>
                  <button onClick={() => updateSetting("admin_signature", "")}
                    className="text-xs text-red-500 mt-1 hover:underline">Remove</button>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Signatory Name</label>
              <input value={settings.signatory_name || ""} onChange={(e) => updateSetting("signatory_name", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="e.g. Hari Singh, Director" />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Signatory Designation</label>
              <input value={settings.signatory_designation || ""} onChange={(e) => updateSetting("signatory_designation", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="e.g. Managing Director" />
            </div>
          </div>
        )}

        {/* Letterhead Settings (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Letterhead Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Customize your letterhead — these details appear on offer letters, experience letters, and ID cards</p>
            <div className="flex items-start gap-6 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Letterhead Logo</label>
                <input type="file" accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { alert("File must be less than 5MB"); return; }
                    const formData = new FormData();
                    formData.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: formData });
                    if (res.ok) {
                      const data = await res.json();
                      updateSetting("letterhead_logo", data.url);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Upload company logo for letterhead. PNG/JPG, max 5MB.</p>
              </div>
              {settings.letterhead_logo && (
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <div className="border rounded-lg p-2 bg-gray-50">
                    <img src={settings.letterhead_logo} alt="Logo" className="h-16 max-w-[200px] object-contain" />
                  </div>
                  <button onClick={() => updateSetting("letterhead_logo", "")}
                    className="text-xs text-red-500 mt-1 hover:underline">Remove</button>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Letterhead)</label>
                <input value={settings.letterhead_company_name || ""} onChange={(e) => updateSetting("letterhead_company_name", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="KKHS Media Private Limited" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                <input value={settings.letterhead_address || ""} onChange={(e) => updateSetting("letterhead_address", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="190A Krishna Kunj, Kalwar Road, Jaipur" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input value={settings.letterhead_phone || ""} onChange={(e) => updateSetting("letterhead_phone", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="9782005500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={settings.letterhead_email || ""} onChange={(e) => updateSetting("letterhead_email", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="hari@kkhsmedia.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input value={settings.letterhead_gst || ""} onChange={(e) => updateSetting("letterhead_gst", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="08AAICK3853C1ZL" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input value={settings.letterhead_website || ""} onChange={(e) => updateSetting("letterhead_website", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="www.kkhsmedia.com" />
              </div>
            </div>
          </div>
        )}

        {/* Letter Customization (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Letter Customization</h2>
            <p className="text-sm text-gray-500 mb-4">Customize fonts, colors, and content of offer/experience letters. Changes apply to newly generated letters.</p>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Font Size (px)</label>
                <input type="number" min="7" max="14" step="0.5" value={settings.letter_font_size || "9"} onChange={(e) => updateSetting("letter_font_size", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Default: 9px. Smaller = fits more on page.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heading Font Size (px)</label>
                <input type="number" min="10" max="20" step="0.5" value={settings.letter_heading_size || "16"} onChange={(e) => updateSetting("letter_heading_size", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Default: 16px for main heading.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.letter_primary_color || "#0000AA"} onChange={(e) => updateSetting("letter_primary_color", e.target.value)}
                    className="w-12 h-10 border rounded-lg cursor-pointer" />
                  <input type="text" value={settings.letter_primary_color || "#0000AA"} onChange={(e) => updateSetting("letter_primary_color", e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="#0000AA" />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.letter_accent_color || "#d32f2f"} onChange={(e) => updateSetting("letter_accent_color", e.target.value)}
                    className="w-12 h-10 border rounded-lg cursor-pointer" />
                  <input type="text" value={settings.letter_accent_color || "#d32f2f"} onChange={(e) => updateSetting("letter_accent_color", e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="#d32f2f" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                <select value={settings.letter_font_family || "Calibri"} onChange={(e) => updateSetting("letter_font_family", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900">
                  <option value="Calibri">Calibri (Default)</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Offer Letter — Extra Terms (optional)</label>
              <textarea value={settings.letter_offer_extra || ""} onChange={(e) => updateSetting("letter_offer_extra", e.target.value)}
                rows={3} className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="Additional terms or company-specific policies to include in offer letters..." />
              <p className="text-xs text-gray-400 mt-1">This text will appear as an additional section in offer letters.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Letter — Extra Note (optional)</label>
              <textarea value={settings.letter_exp_extra || ""} onChange={(e) => updateSetting("letter_exp_extra", e.target.value)}
                rows={3} className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="Additional recommendation text or company-specific notes for experience letters..." />
              <p className="text-xs text-gray-400 mt-1">This text will appear as an additional section in experience letters.</p>
            </div>
          </div>
        )}

        {/* Program Types Management */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Program Types (Public Page)</h2>
            <p className="text-sm text-gray-500 mb-6">Manage the 4 program types shown on the public <a href="/programs" target="_blank" className="text-indigo-600 underline">Programs</a> page. Changes apply after saving.</p>

            {[
              { id: "premium_paid_training", label: "1. Premium Paid Training Program", color: "#4f46e5",
                defaults: { title: "Premium Paid Training Program", fees: "₹5,000", fees_note: "3 Months", duration: "3 Months", mode: "Online",
                ideal_for: "2nd & 3rd year students who want serious learning, strong portfolio and job readiness",
                highlights: "Complete structured online training\nReal-time projects on Live Client Work / Industry Projects\nWeekly doubt sessions with mentors\nFinal project report + presentation\nCertificate + Experience Letter + Recommendation Letter\nBest for students who want strong portfolio and job readiness" }},
              { id: "basic_certification", label: "2. Basic Certification Program", color: "#059669",
                defaults: { title: "Basic Certification Program", fees: "₹999", fees_note: "One Time", duration: "1-15 Days (Self-paced)", mode: "Online",
                ideal_for: "Students who want quick certificate at low cost and basic knowledge",
                highlights: "High-quality training material (PDF + Videos)\nTopic-wise study modules\nOnline Quiz / Assignment (MCQ + Subjective)\nPerformance-based percentage certificate\nDigital Certificate with your Percentage / Grade\nProject files included (if applicable)" }},
              { id: "free_hybrid_internship", label: "3. Free Hybrid Internship", color: "#d97706",
                defaults: { title: "Free Hybrid Internship", fees: "₹0", fees_note: "Completely Free", duration: "1-3 Months", mode: "Online + Offline",
                ideal_for: "Students who want flexibility and can manage studies + internship together",
                highlights: "Mix of Online + Offline work experience\nWeekly tasks and real projects\nMentorship from experienced team\nCertificate of Completion\nNo stipend, no fees — completely free\nFlexible schedule for working students" }},
              { id: "stipend_office_internship", label: "4. Stipend Based Office Internship", color: "#dc2626",
                defaults: { title: "Stipend Based Office Internship", fees: "₹5,000/month", fees_note: "Stipend (You Earn)", duration: "1-3 Months", mode: "Office (Jaipur)",
                ideal_for: "Serious students who can come to office daily, minimum 6 days a week",
                highlights: "Full-time office work in Jaipur\nWorking on Live Client Projects daily\nDaily learning + hands-on professional experience\nProfessional corporate work environment\nCertificate + Experience Letter on completion\nBest performing interns can get Pre-Placement Offer" }},
            ].map((prog) => (
              <div key={prog.id} className="mb-6 p-4 border rounded-xl" style={{ borderColor: `${prog.color}30` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold" style={{ color: prog.color }}>{prog.label}</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox"
                      checked={settings[`program_type_${prog.id}_enabled`] !== "false"}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_enabled`, e.target.checked ? "true" : "false")}
                      className="w-4 h-4 rounded" />
                    <span className="text-gray-600">Enabled</span>
                  </label>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input value={settings[`program_type_${prog.id}_title`] || prog.defaults.title}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_title`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Image URL (optional)</label>
                    <input value={settings[`program_type_${prog.id}_image`] || ""}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_image`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="https://... (leave empty for default)" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fees / Stipend</label>
                    <input value={settings[`program_type_${prog.id}_fees`] || prog.defaults.fees}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_fees`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fees Note</label>
                    <input value={settings[`program_type_${prog.id}_fees_note`] || prog.defaults.fees_note}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_fees_note`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                    <input value={settings[`program_type_${prog.id}_duration`] || prog.defaults.duration}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_duration`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
                    <input value={settings[`program_type_${prog.id}_mode`] || prog.defaults.mode}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_mode`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Theme Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={settings[`program_type_${prog.id}_color`] || prog.color}
                        onChange={(e) => updateSetting(`program_type_${prog.id}_color`, e.target.value)}
                        className="w-10 h-9 border rounded-lg cursor-pointer" />
                      <input value={settings[`program_type_${prog.id}_color`] || prog.color}
                        onChange={(e) => updateSetting(`program_type_${prog.id}_color`, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-900" />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ideal For</label>
                  <input value={settings[`program_type_${prog.id}_ideal_for`] || prog.defaults.ideal_for}
                    onChange={(e) => updateSetting(`program_type_${prog.id}_ideal_for`, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Highlights (one per line)</label>
                  <textarea
                    value={settings[`program_type_${prog.id}_highlights`] || prog.defaults.highlights}
                    onChange={(e) => updateSetting(`program_type_${prog.id}_highlights`, e.target.value)}
                    rows={4} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
            ))}
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

        {/* SMTP / Email Settings */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email (SMTP) Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Configure SMTP to send emails for login, signup, forgot password, and letter notifications.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                <input value={settings.smtp_host || ""} onChange={(e) => updateSetting("smtp_host", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                <input value={settings.smtp_port || ""} onChange={(e) => updateSetting("smtp_port", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="587" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP User (Email)</label>
                <input value={settings.smtp_user || ""} onChange={(e) => updateSetting("smtp_user", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="noreply@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password / App Password</label>
                <input type="password" value={settings.smtp_pass || ""} onChange={(e) => updateSetting("smtp_pass", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                <input value={settings.smtp_from || ""} onChange={(e) => updateSetting("smtp_from", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="noreply@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                <input value={settings.smtp_from_name || ""} onChange={(e) => updateSetting("smtp_from_name", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" placeholder="KKHS Media" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">For Gmail: use smtp.gmail.com, port 587, and an App Password (not your regular password).</p>
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
