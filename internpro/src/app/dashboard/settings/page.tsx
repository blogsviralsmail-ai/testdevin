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

type TabKey = "profile" | "branding" | "letterhead" | "email" | "notifications" | "payments" | "program_types" | "letter_design" | "info";

const TABS: { key: TabKey; label: string; icon: string; adminOnly?: boolean }[] = [
  { key: "profile", label: "Profile", icon: "👤" },
  { key: "branding", label: "Branding", icon: "🎨", adminOnly: true },
  { key: "letterhead", label: "Letterhead & Signature", icon: "📄", adminOnly: true },
  { key: "email", label: "SMTP & Email", icon: "📧", adminOnly: true },
  { key: "notifications", label: "Notifications", icon: "🔔", adminOnly: true },
  { key: "payments", label: "Payments", icon: "💰", adminOnly: true },
  { key: "program_types", label: "Program Types", icon: "📋", adminOnly: true },
  { key: "letter_design", label: "Letter Design", icon: "🖨️", adminOnly: true },
  { key: "info", label: "Platform Info", icon: "ℹ️" },
];

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sigUploading, setSigUploading] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templatePreview, setTemplatePreview] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

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

  const handleSmtpTest = async () => {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const res = await fetch("/api/email/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSmtpTestResult({ ok: true, msg: data.message || "Test email sent successfully!" });
      } else {
        setSmtpTestResult({ ok: false, msg: data.error || "Test failed" });
      }
    } catch {
      setSmtpTestResult({ ok: false, msg: "Network error — could not reach server" });
    }
    setSmtpTesting(false);
  };

  const EMAIL_TEMPLATES = [
    { key: "offer_letter", label: "Offer Letter", desc: "Jab student ko select karke offer letter generate hota hai tab ye email jaata hai" },
    { key: "experience_letter", label: "Experience Letter", desc: "Course complete hone pe experience letter generate hone pe ye email jaata hai" },
    { key: "internship_certificate", label: "Internship Certificate", desc: "Internship certificate generate hone pe ye email jaata hai" },
    { key: "id_card", label: "ID Card", desc: "ID card generate hone pe ye email jaata hai" },
    { key: "daily_attendance", label: "Daily Attendance", desc: "Jab student ki attendance mark hoti hai tab ye email jaata hai" },
    { key: "video_unlock", label: "Video/Resource Unlock", desc: "Jab naya video ya study material unlock hota hai tab ye email jaata hai" },
    { key: "quiz_attempt", label: "Quiz Result", desc: "Jab student quiz attempt karta hai tab result ka email jaata hai" },
    { key: "discussion_post", label: "Discussion Post/Reply", desc: "Jab discussion mein naya post ya reply hota hai tab ye email jaata hai" },
    { key: "live_session", label: "Live Session Scheduled", desc: "Jab naya live session schedule hota hai tab ye email jaata hai" },
    { key: "leaderboard_update", label: "Leaderboard Update", desc: "Jab student ko points milte hain aur leaderboard update hota hai tab ye email jaata hai" },
  ];

  const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
    offer_letter: {
      subject: "Congratulations! Your Offer Letter — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Dear {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">We are pleased to inform you that your application has been accepted!</p>
<p style="color:#4b5563;line-height:1.6;">Your <strong>Offer Letter</strong> has been generated and is now available for download on your dashboard.</p>
<p style="color:#4b5563;line-height:1.6;">Please review the offer letter carefully and proceed with the acceptance.</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Offer Letter</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Welcome to <strong>{{company_name}}</strong>! We look forward to working with you.</p>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">Best Regards,<br/>{{company_name}}<br/>{{company_phone}} | {{company_email}}</p>`,
    },
    experience_letter: {
      subject: "Your Experience Letter is Ready — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Congratulations, {{student_name}}!</h2>
<p style="color:#4b5563;line-height:1.6;">We are happy to let you know that your <strong>Experience Letter</strong> has been generated.</p>
<p style="color:#4b5563;line-height:1.6;">This letter certifies your successful completion of the internship program at {{company_name}}.</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Download Experience Letter</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Thank you for your dedication and hard work during the internship. We wish you all the best in your future endeavors!</p>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">Best Regards,<br/>{{company_name}}<br/>{{company_phone}} | {{company_email}}</p>`,
    },
    internship_certificate: {
      subject: "Your Internship Certificate — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Dear {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">Your <strong>Internship Certificate</strong> has been generated and is available for download.</p>
<p style="color:#4b5563;line-height:1.6;">This certificate is QR-verified and can be shared with potential employers.</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Download Certificate</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Congratulations on completing your internship at {{company_name}}!</p>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">Best Regards,<br/>{{company_name}}<br/>{{company_phone}} | {{company_email}}</p>`,
    },
    id_card: {
      subject: "Your ID Card is Ready — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">Your <strong>Digital ID Card</strong> has been generated.</p>
<p style="color:#4b5563;line-height:1.6;">You can download and print it from your dashboard.</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View ID Card</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">Best Regards,<br/>{{company_name}}<br/>{{company_phone}} | {{company_email}}</p>`,
    },
    daily_attendance: {
      subject: "Attendance Marked — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">Your attendance has been marked as <strong style="color:#059669;">{{attendance_status}}</strong> for <strong>{{attendance_date}}</strong>.</p>
<p style="color:#4b5563;line-height:1.6;">Keep up the great work! Check your progress on the dashboard.</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/attendance" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Attendance</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    },
    video_unlock: {
      subject: "New Study Material Unlocked — Day {{day_number}} — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">A new study material has been unlocked for you!</p>
<div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;color:#1e40af;font-weight:600;">Day {{day_number}}: {{video_title}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">Watch the video and complete today's task to stay on track.</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/resources" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Watch Now</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    },
    quiz_attempt: {
      subject: "Quiz Result — {{quiz_title}} — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">Your quiz result for <strong>{{quiz_title}}</strong> is here:</p>
<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;font-size:24px;font-weight:700;color:#15803d;">{{quiz_score}}%</p>
  <p style="margin:4px 0 0;color:#166534;font-weight:600;">{{quiz_result}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">Keep learning and improving!</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/quizzes" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Quizzes</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    },
    discussion_post: {
      subject: "Discussion {{discussion_action}} — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">A discussion has been {{discussion_action}}:</p>
<div style="background:#faf5ff;border-left:4px solid #8b5cf6;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;color:#6d28d9;font-weight:600;">{{discussion_title}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">Join the discussion and share your thoughts!</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/discussions" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Discussion</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    },
    live_session: {
      subject: "Live Session Scheduled — {{session_title}} — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">A new live session has been scheduled for you!</p>
<div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;color:#c2410c;font-weight:600;">{{session_title}}</p>
  <p style="margin:8px 0 0;color:#9a3412;">Scheduled: {{session_time}}</p>
</div>
<div style="margin:24px 0;text-align:center;">
  <a href="{{meet_link}}" style="background:#059669;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Join Session</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Make sure to join on time!</p>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    },
    leaderboard_update: {
      subject: "Leaderboard Update — {{company_name}}",
      body: `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">Your leaderboard has been updated!</p>
<div style="background:#fefce8;border-left:4px solid #eab308;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;font-size:20px;font-weight:700;color:#a16207;">+{{points_earned}} Points</p>
  <p style="margin:4px 0 0;color:#854d0e;">Reason: {{points_reason}}</p>
  <p style="margin:8px 0 0;color:#92400e;font-weight:600;">Current Rank: #{{current_rank}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">Keep earning points to climb the leaderboard!</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/leaderboard" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Leaderboard</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    },
  };

  const getTemplateSubject = (key: string) => settings[`email_template_${key}_subject`] || DEFAULT_TEMPLATES[key]?.subject || "";
  const getTemplateBody = (key: string) => settings[`email_template_${key}_body`] || DEFAULT_TEMPLATES[key]?.body || "";

  const renderPreview = (html: string) => {
    const replacements: Record<string, string> = {
      "{{student_name}}": "Rahul Sharma",
      "{{letter_type}}": editingTemplate ? EMAIL_TEMPLATES.find(t => t.key === editingTemplate)?.label || "" : "",
      "{{company_name}}": settings.company_name || settings.letterhead_company_name || "KKHS Media Private Limited",
      "{{company_email}}": settings.letterhead_email || settings.smtp_from || "hari@kkhsmedia.com",
      "{{company_phone}}": settings.letterhead_phone || "9782005500",
      "{{company_address}}": settings.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur",
      "{{dashboard_link}}": "https://internship.kkhsmedia.com/dashboard",
      "{{date}}": new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      "{{time}}": new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      "{{letter_number}}": "KKHS/HR/2026-05/001",
      "{{attendance_status}}": "Present",
      "{{attendance_date}}": new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      "{{video_title}}": "Introduction to HTML Tags",
      "{{day_number}}": "5",
      "{{quiz_title}}": "HTML Basics Quiz",
      "{{quiz_score}}": "85",
      "{{quiz_result}}": "PASSED",
      "{{discussion_title}}": "How to center a div in CSS?",
      "{{discussion_action}}": "New Reply on Your Discussion",
      "{{session_title}}": "Weekly Doubt Clearing Session",
      "{{session_time}}": "10 May 2026, 04:00 PM",
      "{{meet_link}}": "https://meet.google.com/abc-defg-hij",
      "{{points_earned}}": "25",
      "{{current_rank}}": "3",
      "{{points_reason}}": "Quiz passed: HTML Basics",
    };
    let result = html;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    }
    return result;
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";

  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm">Manage platform and website settings</p>
        </div>
        {isAdmin && (
          <button onClick={handleSave} disabled={saving}
            className="bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2] disabled:opacity-50">
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        )}
      </div>

      {/* Sub-menu Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-transparent p-1 rounded-xl">
        {visibleTabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-transparent text-[#22d3ee] shadow-none"
                : "text-slate-400 hover:text-white hover:bg-transparent"
            }`}>
            <span className="mr-1">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">

        {/* ========== PROFILE ========== */}
        {activeTab === "profile" && (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
            <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input value={user?.name || ""} className="w-full px-4 py-2 border rounded-lg text-sm text-white bg-transparent" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input value={user?.email || ""} className="w-full px-4 py-2 border rounded-lg text-sm text-white bg-transparent" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <input value={user?.role || ""} className="w-full px-4 py-2 border rounded-lg text-sm text-white bg-transparent capitalize" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                <input value={user?.phone || ""} className="w-full px-4 py-2 border rounded-lg text-sm text-white bg-transparent" readOnly />
              </div>
            </div>
          </div>
        )}

        {/* ========== BRANDING ========== */}
        {activeTab === "branding" && isAdmin && (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
            <h2 className="text-lg font-semibold text-white mb-4">Website Branding</h2>
            <p className="text-sm text-slate-500 mb-4">Customize how your platform looks to students and visitors</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                <input value={settings.company_name || ""} onChange={(e) => updateSetting("company_name", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="Your Company Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Logo URL</label>
                <input value={settings.company_logo || ""} onChange={(e) => updateSetting("company_logo", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.primary_color || "#4f46e5"} onChange={(e) => updateSetting("primary_color", e.target.value)}
                    className="w-12 h-10 border rounded-lg cursor-pointer" />
                  <input value={settings.primary_color || "#4f46e5"} onChange={(e) => updateSetting("primary_color", e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Address</label>
                <input value={settings.company_address || ""} onChange={(e) => updateSetting("company_address", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="123, Street, City, State - PIN" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Support Email</label>
                <input value={settings.support_email || ""} onChange={(e) => updateSetting("support_email", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="support@yourcompany.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Support Phone</label>
                <input value={settings.support_phone || ""} onChange={(e) => updateSetting("support_phone", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="+91 XXXXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Website URL</label>
                <input value={settings.website_url || ""} onChange={(e) => updateSetting("website_url", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="https://yourcompany.com" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">Landing Page Tagline</label>
              <input value={settings.tagline || ""} onChange={(e) => updateSetting("tagline", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="Your company tagline..." />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">About Us</label>
              <textarea value={settings.about_us || ""} onChange={(e) => updateSetting("about_us", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm text-white" rows={3} placeholder="About your company..." />
            </div>
          </div>
        )}

        {/* ========== LETTERHEAD & SIGNATURE ========== */}
        {activeTab === "letterhead" && isAdmin && (
          <div className="space-y-6">
            {/* Signature */}
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
              <h2 className="text-lg font-semibold text-white mb-4">Authorized Signature</h2>
              <p className="text-sm text-slate-500 mb-4">Upload your signature image — it will appear on offer letters and experience letters</p>
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Signature Image</label>
                  <input type="file" accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleSignatureUpload(e.target.files[0])}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                  <p className="text-xs text-slate-500 mt-1">PNG with transparent background recommended. Max 2MB.</p>
                  {sigUploading && <p className="text-xs text-[#60a5fa] mt-1">Uploading...</p>}
                </div>
                {settings.admin_signature && (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-slate-500 mb-1">Preview:</p>
                    <div className="border rounded-lg p-2 bg-transparent">
                      <img src={settings.admin_signature} alt="Signature" className="h-16 max-w-[200px] object-contain" />
                    </div>
                    <button onClick={() => updateSetting("admin_signature", "")}
                      className="text-xs text-red-500 mt-1 hover:underline">Remove</button>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">Signatory Name</label>
                <input value={settings.signatory_name || ""} onChange={(e) => updateSetting("signatory_name", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="e.g. Hari Singh, Director" />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Signatory Designation</label>
                <input value={settings.signatory_designation || ""} onChange={(e) => updateSetting("signatory_designation", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="e.g. Managing Director" />
              </div>
            </div>

            {/* Letterhead */}
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
              <h2 className="text-lg font-semibold text-white mb-4">Letterhead Settings</h2>
              <p className="text-sm text-slate-500 mb-4">Customize your letterhead — these details appear on offer letters, experience letters, and ID cards</p>
              <div className="flex items-start gap-6 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Letterhead Logo</label>
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
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                  <p className="text-xs text-slate-500 mt-1">Upload company logo for letterhead. PNG/JPG, max 5MB.</p>
                </div>
                {settings.letterhead_logo && (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-slate-500 mb-1">Preview:</p>
                    <div className="border rounded-lg p-2 bg-transparent">
                      <img src={settings.letterhead_logo} alt="Logo" className="h-16 max-w-[200px] object-contain" />
                    </div>
                    <button onClick={() => updateSetting("letterhead_logo", "")}
                      className="text-xs text-red-500 mt-1 hover:underline">Remove</button>
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company Name (Letterhead)</label>
                  <input value={settings.letterhead_company_name || ""} onChange={(e) => updateSetting("letterhead_company_name", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="KKHS Media Private Limited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company Address</label>
                  <input value={settings.letterhead_address || ""} onChange={(e) => updateSetting("letterhead_address", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="190A Krishna Kunj, Kalwar Road, Jaipur" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                  <input value={settings.letterhead_phone || ""} onChange={(e) => updateSetting("letterhead_phone", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="9782005500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input value={settings.letterhead_email || ""} onChange={(e) => updateSetting("letterhead_email", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="hari@kkhsmedia.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">GST Number</label>
                  <input value={settings.letterhead_gst || ""} onChange={(e) => updateSetting("letterhead_gst", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="08AAICK3853C1ZL" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Website</label>
                  <input value={settings.letterhead_website || ""} onChange={(e) => updateSetting("letterhead_website", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="www.kkhsmedia.com" />
                </div>
              </div>
            </div>

            {/* Letter Customization */}
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
              <h2 className="text-lg font-semibold text-white mb-4">Letter Customization</h2>
              <p className="text-sm text-slate-500 mb-4">Customize fonts, colors, and content of offer/experience letters. Changes apply to newly generated letters.</p>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Body Font Size (px)</label>
                  <input type="number" min="7" max="14" step="0.5" value={settings.letter_font_size || "9"} onChange={(e) => updateSetting("letter_font_size", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" />
                  <p className="text-xs text-slate-500 mt-1">Default: 9px. Smaller = fits more on page.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Heading Font Size (px)</label>
                  <input type="number" min="10" max="20" step="0.5" value={settings.letter_heading_size || "16"} onChange={(e) => updateSetting("letter_heading_size", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" />
                  <p className="text-xs text-slate-500 mt-1">Default: 16px for main heading.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.letter_primary_color || "#0000AA"} onChange={(e) => updateSetting("letter_primary_color", e.target.value)}
                      className="w-12 h-10 border rounded-lg cursor-pointer" />
                    <input type="text" value={settings.letter_primary_color || "#0000AA"} onChange={(e) => updateSetting("letter_primary_color", e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg text-sm text-white" placeholder="#0000AA" />
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.letter_accent_color || "#d32f2f"} onChange={(e) => updateSetting("letter_accent_color", e.target.value)}
                      className="w-12 h-10 border rounded-lg cursor-pointer" />
                    <input type="text" value={settings.letter_accent_color || "#d32f2f"} onChange={(e) => updateSetting("letter_accent_color", e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg text-sm text-white" placeholder="#d32f2f" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Font Family</label>
                  <select value={settings.letter_font_family || "Calibri"} onChange={(e) => updateSetting("letter_font_family", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white">
                    <option value="Calibri">Calibri (Default)</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== SMTP & EMAIL ========== */}
        {activeTab === "email" && isAdmin && (
          <div className="space-y-6">
            {/* When emails are sent */}
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">When are emails sent?</h3>
              <div className="text-xs text-[#60a5fa]">
                <p className="font-semibold text-emerald-400 mb-2">EMAILS ARE SENT ON EVERY EVENT (SMTP must be configured):</p>
                <ul className="space-y-1 mb-3">
                  <li>Student <strong>registers</strong> — Welcome Email</li>
                  <li>Student <strong>logs in</strong> — Login Notification</li>
                  <li>Admin <strong>Selects/Rejects/Interviews</strong> student — Status Change Email</li>
                  <li>Offer Letter generated — <strong>Offer Letter Email</strong> (edit template below)</li>
                  <li>Experience Letter generated — <strong>Experience Letter Email</strong></li>
                  <li>Internship Certificate generated — <strong>Certificate Email</strong></li>
                  <li>ID Card generated — <strong>ID Card Email</strong></li>
                  <li>Student <strong>attendance</strong> marked — Attendance Confirmation Email</li>
                  <li>New <strong>video/resource unlocked</strong> — Video Unlock Email</li>
                  <li><strong>Quiz attempted</strong> — Quiz Result Email (score + pass/fail)</li>
                  <li>New <strong>Discussion</strong> post or reply — Discussion Notification Email</li>
                  <li>New <strong>live session scheduled</strong> — Live Session Email (with join link)</li>
                  <li><strong>Leaderboard points</strong> earned — Points Update Email</li>
                  <li>Student <strong>submits task</strong> and admin reviews — Task Reviewed Email</li>
                  <li>Student <strong>uploads document</strong> — Admin notification email</li>
                  <li><strong>Password reset</strong> requested — Reset Link Email</li>
                </ul>
                <p className="text-red-400 font-semibold">Note: No emails will be sent if SMTP settings are not configured!</p>
              </div>
            </div>

            {/* SMTP Config */}
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
              <h2 className="text-lg font-semibold text-white mb-4">SMTP Configuration</h2>
              <p className="text-sm text-slate-500 mb-4">Configure SMTP to send emails for login, signup, forgot password, and letter notifications.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Host</label>
                  <input value={settings.smtp_host || ""} onChange={(e) => updateSetting("smtp_host", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Port</label>
                  <input value={settings.smtp_port || ""} onChange={(e) => updateSetting("smtp_port", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="587" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">SMTP User (Email)</label>
                  <input value={settings.smtp_user || ""} onChange={(e) => updateSetting("smtp_user", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="noreply@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Password / App Password</label>
                  <input type="password" value={settings.smtp_pass || ""} onChange={(e) => updateSetting("smtp_pass", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="App password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">From Email</label>
                  <input value={settings.smtp_from || ""} onChange={(e) => updateSetting("smtp_from", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="noreply@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">From Name</label>
                  <input value={settings.smtp_from_name || ""} onChange={(e) => updateSetting("smtp_from_name", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="KKHS Media" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                <button onClick={handleSmtpTest} disabled={smtpTesting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                  {smtpTesting ? "Testing..." : "Send Test Email"}
                </button>
                {smtpTestResult && (
                  <p className={`text-sm ${smtpTestResult.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {smtpTestResult.msg}
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-3">For Gmail: use smtp.gmail.com, port 587, and an App Password (not your regular password).</p>
            </div>

            {/* Email Templates */}
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
              <h2 className="text-lg font-semibold text-white mb-2">Email Templates</h2>
              <p className="text-sm text-slate-500 mb-2">A styled email is sent to the student on every event. Customize the subject and body.</p>
              <details className="mb-4">
                <summary className="text-xs text-[#22d3ee] cursor-pointer font-medium">View available variables (click to expand)</summary>
                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  <p><strong>Common:</strong> <code className="bg-transparent px-1 rounded">{"{{student_name}}"}</code> <code className="bg-transparent px-1 rounded">{"{{company_name}}"}</code> <code className="bg-transparent px-1 rounded">{"{{company_phone}}"}</code> <code className="bg-transparent px-1 rounded">{"{{company_email}}"}</code> <code className="bg-transparent px-1 rounded">{"{{dashboard_link}}"}</code> <code className="bg-transparent px-1 rounded">{"{{date}}"}</code> <code className="bg-transparent px-1 rounded">{"{{time}}"}</code></p>
                  <p><strong>Letters:</strong> <code className="bg-transparent px-1 rounded">{"{{letter_type}}"}</code> <code className="bg-transparent px-1 rounded">{"{{letter_number}}"}</code></p>
                  <p><strong>Attendance:</strong> <code className="bg-transparent px-1 rounded">{"{{attendance_status}}"}</code> <code className="bg-transparent px-1 rounded">{"{{attendance_date}}"}</code></p>
                  <p><strong>Video:</strong> <code className="bg-transparent px-1 rounded">{"{{video_title}}"}</code> <code className="bg-transparent px-1 rounded">{"{{day_number}}"}</code></p>
                  <p><strong>Quiz:</strong> <code className="bg-transparent px-1 rounded">{"{{quiz_title}}"}</code> <code className="bg-transparent px-1 rounded">{"{{quiz_score}}"}</code> <code className="bg-transparent px-1 rounded">{"{{quiz_result}}"}</code></p>
                  <p><strong>Discussion:</strong> <code className="bg-transparent px-1 rounded">{"{{discussion_title}}"}</code> <code className="bg-transparent px-1 rounded">{"{{discussion_action}}"}</code></p>
                  <p><strong>Live Session:</strong> <code className="bg-transparent px-1 rounded">{"{{session_title}}"}</code> <code className="bg-transparent px-1 rounded">{"{{session_time}}"}</code> <code className="bg-transparent px-1 rounded">{"{{meet_link}}"}</code></p>
                  <p><strong>Leaderboard:</strong> <code className="bg-transparent px-1 rounded">{"{{points_earned}}"}</code> <code className="bg-transparent px-1 rounded">{"{{current_rank}}"}</code> <code className="bg-transparent px-1 rounded">{"{{points_reason}}"}</code></p>
                </div>
              </details>
              <div className="space-y-3">
                {EMAIL_TEMPLATES.map((tpl) => (
                  <div key={tpl.key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{tpl.label}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{tpl.desc}</p>
                      </div>
                      <button onClick={() => { setEditingTemplate(editingTemplate === tpl.key ? null : tpl.key); setTemplatePreview(false); }}
                        className="text-xs text-[#22d3ee] hover:underline font-medium">
                        {editingTemplate === tpl.key ? "Close" : "Edit Template"}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-2">
                      Subject: <span className="text-slate-400">{getTemplateSubject(tpl.key).substring(0, 80)}{getTemplateSubject(tpl.key).length > 80 ? "..." : ""}</span>
                    </p>

                    {editingTemplate === tpl.key && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Email Subject</label>
                          <input
                            value={getTemplateSubject(tpl.key)}
                            onChange={(e) => updateSetting(`email_template_${tpl.key}_subject`, e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm text-white"
                            placeholder="Email subject line..."
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-slate-400">Email Body (HTML)</label>
                            <button onClick={() => setTemplatePreview(!templatePreview)}
                              className="text-xs text-[#22d3ee] hover:underline">
                              {templatePreview ? "Edit" : "Preview"}
                            </button>
                          </div>
                          {templatePreview ? (
                            <div className="border rounded-lg p-4 bg-transparent min-h-[200px] text-sm"
                              dangerouslySetInnerHTML={{ __html: renderPreview(getTemplateBody(tpl.key)) }} />
                          ) : (
                            <textarea
                              value={getTemplateBody(tpl.key)}
                              onChange={(e) => updateSetting(`email_template_${tpl.key}_body`, e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-sm text-white font-mono h-48"
                              placeholder="Email body in HTML..."
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            updateSetting(`email_template_${tpl.key}_subject`, DEFAULT_TEMPLATES[tpl.key]?.subject || "");
                            updateSetting(`email_template_${tpl.key}_body`, DEFAULT_TEMPLATES[tpl.key]?.body || "");
                          }} className="text-xs text-orange-600 hover:underline">
                            Reset to Default
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== NOTIFICATIONS ========== */}
        {activeTab === "notifications" && isAdmin && (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
            <h2 className="text-lg font-semibold text-white mb-4">Notification Settings</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-300">Email Notifications</p>
                  <p className="text-xs text-slate-500">Send email when student applies, interview scheduled, etc.</p>
                </div>
                <input type="checkbox" checked={settings.email_notifications === "true"}
                  onChange={(e) => updateSetting("email_notifications", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 rounded" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-300">WhatsApp Notifications</p>
                  <p className="text-xs text-slate-500">Send WhatsApp messages for important updates</p>
                </div>
                <input type="checkbox" checked={settings.whatsapp_notifications === "true"}
                  onChange={(e) => updateSetting("whatsapp_notifications", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 rounded" />
              </div>
              {settings.whatsapp_notifications === "true" && (
                <div className="ml-4 pl-4 border-l-2 border-green-200 space-y-3 py-2">
                  <p className="text-xs text-slate-500">Configure WhatsApp Business API (Meta Cloud API)</p>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number ID</label>
                    <input value={settings.whatsapp_phone_id || ""} onChange={(e) => updateSetting("whatsapp_phone_id", e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-sm text-white" placeholder="From Meta Business Suite" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Access Token</label>
                    <input type="password" value={settings.whatsapp_token || ""} onChange={(e) => updateSetting("whatsapp_token", e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-sm text-white" placeholder="Permanent access token" />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-300">Auto Attendance</p>
                  <p className="text-xs text-slate-500">Automatically mark student present when they open dashboard</p>
                </div>
                <input type="checkbox" checked={settings.auto_attendance !== "false"}
                  onChange={(e) => updateSetting("auto_attendance", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* ========== PAYMENTS ========== */}
        {activeTab === "payments" && isAdmin && (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
            <h2 className="text-lg font-semibold text-white mb-4">Payment Gateway (Razorpay)</h2>
            <p className="text-sm text-slate-500 mb-4">Configure Razorpay for paid program enrollments.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Razorpay Key ID</label>
                <input value={settings.razorpay_key_id || ""} onChange={(e) => updateSetting("razorpay_key_id", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="rzp_live_xxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Razorpay Key Secret</label>
                <input type="password" value={settings.razorpay_key_secret || ""} onChange={(e) => updateSetting("razorpay_key_secret", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="Secret key" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Get keys from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Razorpay Dashboard</a>. Use test keys for testing.</p>
          </div>
        )}

        {/* ========== PROGRAM TYPES ========== */}
        {activeTab === "program_types" && isAdmin && (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
            <h2 className="text-lg font-semibold text-white mb-4">Program Types (Public Page)</h2>
            <p className="text-sm text-slate-500 mb-6">Manage the 4 program types shown on the public <a href="/programs" target="_blank" className="text-[#22d3ee] underline">Programs</a> page. Changes apply after saving.</p>

            {[
              { id: "premium_paid_training", label: "1. Premium Paid Training Program", color: "#4f46e5",
                defaults: { title: "Premium Paid Training Program", fees: "\u20B95,000", fees_note: "3 Months", duration: "3 Months", mode: "Online",
                ideal_for: "2nd & 3rd year students who want serious learning, strong portfolio and job readiness",
                highlights: "Complete structured online training\nReal-time projects on Live Client Work / Industry Projects\nWeekly doubt sessions with mentors\nFinal project report + presentation\nCertificate + Experience Letter + Recommendation Letter\nBest for students who want strong portfolio and job readiness" }},
              { id: "basic_certification", label: "2. Basic Certification Program", color: "#059669",
                defaults: { title: "Basic Certification Program", fees: "\u20B9999", fees_note: "One Time", duration: "1-15 Days (Self-paced)", mode: "Online",
                ideal_for: "Students who want quick certificate at low cost and basic knowledge",
                highlights: "High-quality training material (PDF + Videos)\nTopic-wise study modules\nOnline Quiz / Assignment (MCQ + Subjective)\nPerformance-based percentage certificate\nDigital Certificate with your Percentage / Grade\nProject files included (if applicable)" }},
              { id: "free_hybrid_internship", label: "3. Free Hybrid Internship", color: "#d97706",
                defaults: { title: "Free Hybrid Internship", fees: "\u20B90", fees_note: "Completely Free", duration: "1-3 Months", mode: "Online + Offline",
                ideal_for: "Students who want flexibility and can manage studies + internship together",
                highlights: "Mix of Online + Offline work experience\nWeekly tasks and real projects\nMentorship from experienced team\nCertificate of Completion\nNo stipend, no fees \u2014 completely free\nFlexible schedule for working students" }},
              { id: "stipend_office_internship", label: "4. Stipend Based Office Internship", color: "#dc2626",
                defaults: { title: "Stipend Based Office Internship", fees: "\u20B95,000/month", fees_note: "Stipend (You Earn)", duration: "1-3 Months", mode: "Office (Jaipur)",
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
                    <span className="text-slate-400">Enabled</span>
                  </label>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                    <input value={settings[`program_type_${prog.id}_title`] || prog.defaults.title}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_title`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Image URL (optional)</label>
                    <input value={settings[`program_type_${prog.id}_image`] || ""}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_image`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="https://... (leave empty for default)" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fees / Stipend</label>
                    <input value={settings[`program_type_${prog.id}_fees`] || prog.defaults.fees}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_fees`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fees Note</label>
                    <input value={settings[`program_type_${prog.id}_fees_note`] || prog.defaults.fees_note}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_fees_note`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Duration</label>
                    <input value={settings[`program_type_${prog.id}_duration`] || prog.defaults.duration}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_duration`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Mode</label>
                    <input value={settings[`program_type_${prog.id}_mode`] || prog.defaults.mode}
                      onChange={(e) => updateSetting(`program_type_${prog.id}_mode`, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Theme Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={settings[`program_type_${prog.id}_color`] || prog.color}
                        onChange={(e) => updateSetting(`program_type_${prog.id}_color`, e.target.value)}
                        className="w-10 h-9 border rounded-lg cursor-pointer" />
                      <input value={settings[`program_type_${prog.id}_color`] || prog.color}
                        onChange={(e) => updateSetting(`program_type_${prog.id}_color`, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm text-white" />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ideal For</label>
                  <input value={settings[`program_type_${prog.id}_ideal_for`] || prog.defaults.ideal_for}
                    onChange={(e) => updateSetting(`program_type_${prog.id}_ideal_for`, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Highlights (one per line)</label>
                  <textarea
                    value={settings[`program_type_${prog.id}_highlights`] || prog.defaults.highlights}
                    onChange={(e) => updateSetting(`program_type_${prog.id}_highlights`, e.target.value)}
                    rows={4} className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== LETTER DESIGN ========== */}
        {activeTab === "letter_design" && isAdmin && (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
            <h2 className="text-lg font-semibold text-white mb-2">Letter Templates (Design)</h2>
            <p className="text-sm text-slate-500 mb-4">Change the letter design from here. Email templates are in the &quot;SMTP &amp; Email&quot; tab.</p>
            <div className="space-y-3">
              {["offer_letter", "experience_letter", "internship_certificate", "id_card"].map((type) => {
                const labels: Record<string, string> = {
                  offer_letter: "Offer Letter Template",
                  experience_letter: "Experience Letter Template",
                  internship_certificate: "Internship Certificate Template",
                  id_card: "ID Card Template",
                };
                return (
                  <div key={type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white">{labels[type]}</h3>
                      <a href={`/dashboard/letter-templates?tab=${type}`} className="text-xs text-[#22d3ee] hover:underline">
                        Edit in Designer
                      </a>
                    </div>
                    <p className="text-xs text-slate-500">
                      {type === "offer_letter" && "2-page A4 letter with company terms, position details, and acceptance block."}
                      {type === "experience_letter" && "1-page A4 certificate with performance summary and recommendation."}
                      {type === "internship_certificate" && "Certificate with KKHS letterhead, dates, and program details."}
                      {type === "id_card" && "Student ID card with photo, employee ID, and QR code."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== PLATFORM INFO ========== */}
        {activeTab === "info" && (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
            <h2 className="text-lg font-semibold text-white mb-4">Platform Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Platform</span>
                <span className="font-medium text-white">InternPro v1.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Framework</span>
                <span className="font-medium text-white">Next.js + Prisma + SQLite</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Support</span>
                <span className="font-medium text-white">{settings.support_email || "support@internpro.com"}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
