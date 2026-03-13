import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Save, Loader2, Upload, Database, Download, Trash2, RotateCcw, RefreshCw, Bell, Send } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface SettingsData {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_website: string;
  whatsapp_number: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  twitter_url: string;
  primary_color: string;
  secondary_color: string;
  about_text: string;
  director_name: string;
  director_message: string;
  counselor_name: string;
  counselor_phone: string;
  monthly_target: string;
  terms_conditions: string;
  privacy_policy: string;
  popup_enabled: string;
  popup_delay: string;
  logo_url: string;
  navbar_logo_url: string;
  favicon_url: string;
  og_image_url: string;
  footer_logo_url: string;
  site_name: string;
  site_tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  footer_text: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  google_analytics: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from_email: string;
  sms_gateway: string;
  sms_api_key: string;
  sms_sender_id: string;
  payment_gateway: string;
  payment_api_key: string;
  payment_secret_key: string;
  upi_qr_image: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  bank_name: string;
  bank_branch: string;
  map_latitude: string;
  map_longitude: string;
  stat_students_enrolled: string;
  stat_success_rate: string;
  stat_uni_label: string;
  stat_course_label: string;
  stat_student_label: string;
  stat_success_label: string;
  receipt_gst_number: string;
  receipt_prefix: string;
  receipt_footer: string;
  whatsapp_api_url: string;
  whatsapp_api_key: string;
  // Footer customization
  footer_description: string;
  footer_copyright: string;
  footer_col2_title: string;
  footer_col3_title: string;
  footer_col4_title: string;
  // About Page
  about_hero_subtitle: string;
  about_who_title: string;
  about_who_description_1: string;
  about_who_description_2: string;
  about_badge_1: string;
  about_badge_2: string;
  about_badge_3: string;
  about_mission: string;
  about_vision: string;
  about_value_1_title: string;
  about_value_1_desc: string;
  about_value_2_title: string;
  about_value_2_desc: string;
  about_value_3_title: string;
  about_value_3_desc: string;
  about_value_4_title: string;
  about_value_4_desc: string;
  about_cta_title: string;
  about_cta_subtitle: string;
  about_stat_1_value: string;
  about_stat_1_label: string;
  about_stat_2_value: string;
  about_stat_2_label: string;
  about_stat_3_value: string;
  about_stat_3_label: string;
  about_stat_4_value: string;
  about_stat_4_label: string;
  about_hero_image: string;
  about_image_1: string;
  about_image_2: string;
  // Services Page
  services_hero_subtitle: string;
  service_1_title: string;
  service_1_desc: string;
  service_2_title: string;
  service_2_desc: string;
  service_3_title: string;
  service_3_desc: string;
  service_4_title: string;
  service_4_desc: string;
  service_5_title: string;
  service_5_desc: string;
  service_6_title: string;
  service_6_desc: string;
  service_7_title: string;
  service_7_desc: string;
  service_8_title: string;
  service_8_desc: string;
  services_cta_title: string;
  services_cta_subtitle: string;
  services_process_1_title: string;
  services_process_1_desc: string;
  services_process_2_title: string;
  services_process_2_desc: string;
  services_process_3_title: string;
  services_process_3_desc: string;
  services_process_4_title: string;
  services_process_4_desc: string;
  // Contact Page
  contact_hero_subtitle: string;
  contact_working_hours: string;
  contact_working_hours_off: string;
  contact_hero_image: string;
  // Hero Section (Home)
  hero_badge_text: string;
  hero_bg_image: string;
  hero_highlight_text: string;
}

const defaultSettings: SettingsData = {
  company_name: "Education Hub",
  company_email: "",
  company_phone: "",
  company_address: "",
  company_website: "",
  whatsapp_number: "",
  facebook_url: "",
  instagram_url: "",
  linkedin_url: "",
  youtube_url: "",
  twitter_url: "",
  primary_color: "#1e40af",
  secondary_color: "#3b82f6",
  about_text: "",
  director_name: "",
  director_message: "",
  counselor_name: "",
  counselor_phone: "",
  monthly_target: "50",
  terms_conditions: "",
  privacy_policy: "",
  popup_enabled: "true",
  popup_delay: "30",
  logo_url: "",
  navbar_logo_url: "",
  favicon_url: "",
  og_image_url: "",
  footer_logo_url: "",
  site_name: "A Step For Future - Education Hub",
  site_tagline: "India's Trusted Education Partner",
  hero_title: "",
  hero_subtitle: "",
  hero_cta_text: "Apply Now",
  footer_text: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  google_analytics: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_password: "",
  smtp_from_email: "",
  sms_gateway: "msg91",
  sms_api_key: "",
  sms_sender_id: "",
  payment_gateway: "razorpay",
  payment_api_key: "",
  payment_secret_key: "",
  upi_qr_image: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_ifsc_code: "",
  bank_name: "",
  bank_branch: "",
  map_latitude: "26.9124",
  map_longitude: "75.7873",
  stat_students_enrolled: "5000",
  stat_success_rate: "95",
  stat_uni_label: "Partner Universities",
  stat_course_label: "Courses Available",
  stat_student_label: "Students Enrolled",
  stat_success_label: "Success Rate",
  receipt_gst_number: "",
  receipt_prefix: "ASFF",
  receipt_footer: "This is a computer generated receipt.",
  whatsapp_api_url: "",
  whatsapp_api_key: "",
  // Footer customization
  footer_description: "Your trusted partner for higher education admissions across multiple universities.",
  footer_copyright: "",
  footer_col2_title: "Quick Links",
  footer_col3_title: "Contact Info",
  footer_col4_title: "Follow Us",
  // About Page
  about_hero_subtitle: "Your trusted partner in education, connecting students with the best universities across India since 2014.",
  about_who_title: "Empowering Students to Achieve Their Dreams",
  about_who_description_1: "Education Hub is a premier education consultancy that works with multiple UGC-recognized and NAAC-accredited universities across India. We provide end-to-end support for students seeking admission in undergraduate, postgraduate, diploma, and professional courses.",
  about_who_description_2: "With a team of experienced counselors and education experts, we guide students through every step of the admission process - from choosing the right course and university to completing documentation and securing enrollment.",
  about_badge_1: "UGC Recognized Partners",
  about_badge_2: "NAAC Accredited",
  about_badge_3: "10+ Years Experience",
  about_mission: "To make quality education accessible to every student by providing comprehensive admission support, expert guidance, and seamless processes. We bridge the gap between students and top universities, ensuring every individual finds the right path to their academic and professional goals.",
  about_vision: "To become India's leading education consultancy that empowers students with the knowledge and resources they need to make informed decisions about their education. We envision a future where every student has equal access to quality higher education opportunities.",
  about_value_1_title: "Student First",
  about_value_1_desc: "Every decision we make is centered around student welfare and success.",
  about_value_2_title: "Quality",
  about_value_2_desc: "We partner only with accredited, recognized universities.",
  about_value_3_title: "Transparency",
  about_value_3_desc: "Complete transparency in fees, processes, and communication.",
  about_value_4_title: "Excellence",
  about_value_4_desc: "We strive for excellence in every interaction and service.",
  about_cta_title: "Ready to Start Your Journey?",
  about_cta_subtitle: "Get in touch with our expert counselors and take the first step towards your dream career.",
  about_stat_1_value: "15+",
  about_stat_1_label: "Universities",
  about_stat_2_value: "46+",
  about_stat_2_label: "Courses",
  about_stat_3_value: "5000+",
  about_stat_3_label: "Students",
  about_stat_4_value: "10+",
  about_stat_4_label: "Years Experience",
  about_hero_image: "",
  about_image_1: "",
  about_image_2: "",
  // Services Page
  services_hero_subtitle: "Comprehensive education consulting services to help you achieve your academic goals",
  service_1_title: "University Admissions",
  service_1_desc: "End-to-end admission support for 15+ partner universities. We handle the entire process from application to enrollment.",
  service_2_title: "Expert Counseling",
  service_2_desc: "Personalized guidance from experienced education counselors to help you choose the right university and course.",
  service_3_title: "Document Processing",
  service_3_desc: "Complete document verification, attestation, and submission support. We ensure all paperwork is handled properly.",
  service_4_title: "Branch Network",
  service_4_desc: "Wide network of branches across India for easy access to our services. Walk into any branch for instant assistance.",
  service_5_title: "Student Support",
  service_5_desc: "24/7 student support through phone, email, and WhatsApp. We're always here to help you.",
  service_6_title: "Scholarship Assistance",
  service_6_desc: "Help students find and apply for scholarships. We connect deserving students with financial aid opportunities.",
  service_7_title: "Course Selection",
  service_7_desc: "Expert advice on course selection based on career goals, interests, and market trends.",
  service_8_title: "Online & Distance Education",
  service_8_desc: "Support for online and distance learning programs from top universities. Study from anywhere.",
  services_cta_title: "Need Help Choosing the Right Path?",
  services_cta_subtitle: "Our expert counselors are ready to guide you. Get personalized advice for your education journey.",
  services_process_1_title: "Enquiry",
  services_process_1_desc: "Submit your enquiry online or visit our branch",
  services_process_2_title: "Counseling",
  services_process_2_desc: "Get expert guidance on course and university selection",
  services_process_3_title: "Application",
  services_process_3_desc: "We handle your application and documentation",
  services_process_4_title: "Admission",
  services_process_4_desc: "Get confirmed admission and start your journey",
  // Contact Page
  contact_hero_subtitle: "Have questions? We'd love to hear from you. Get in touch with our team.",
  contact_working_hours: "Mon - Sat: 9AM - 7PM",
  contact_working_hours_off: "Sunday: Closed",
  contact_hero_image: "",
  // Hero Section (Home)
  hero_badge_text: "India's Trusted Education Partner",
  hero_bg_image: "",
  hero_highlight_text: "World-Class Education",
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [message, setMessage] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingNavbarLogo, setUploadingNavbarLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [uploadingFooterLogo, setUploadingFooterLogo] = useState(false);
  const [uploadingUpiQr, setUploadingUpiQr] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpResult, setSmtpResult] = useState("");
  // Backup & Restore
  const [backups, setBackups] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");
  // Notification settings
  const [notifSettings, setNotifSettings] = useState({
    telegram_enabled: "true", telegram_bot_token: "", telegram_chat_id: "",
    email_enabled: "true", notification_email: "harisoniofficial@gmail.com",
    notify_payment: "true", notify_lead: "true", notify_student: "true",
    notify_enquiry: "true", notify_document: "true",
    notify_career: "true", notify_support: "true", notify_notice: "true",
    notify_blog: "true", notify_placement: "true", notify_testimonial: "true"
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramResult, setTelegramResult] = useState("");

  useEffect(() => {
    loadSettings();
    loadNotifSettings();
  }, []);

  async function loadNotifSettings() {
    try {
      const res = await api.get("/api/settings");
      if (res.data) {
        setNotifSettings(prev => ({
          ...prev,
          telegram_enabled: res.data.telegram_enabled || "true",
          telegram_bot_token: res.data.telegram_bot_token || "",
          telegram_chat_id: res.data.telegram_chat_id || "",
          email_enabled: res.data.email_enabled || "true",
          notification_email: res.data.notification_email || "harisoniofficial@gmail.com",
          notify_payment: res.data.notify_payment || "true",
          notify_lead: res.data.notify_lead || "true",
          notify_student: res.data.notify_student || "true",
          notify_enquiry: res.data.notify_enquiry || "true",
          notify_document: res.data.notify_document || "true",
          notify_career: res.data.notify_career || "true",
          notify_support: res.data.notify_support || "true",
          notify_notice: res.data.notify_notice || "true",
          notify_blog: res.data.notify_blog || "true",
          notify_placement: res.data.notify_placement || "true",
          notify_testimonial: res.data.notify_testimonial || "true",
        }));
      }
    } catch { /* empty */ }
  }

  async function saveNotifSettings() {
    setNotifSaving(true); setNotifMsg("");
    try {
      await api.put("/api/settings", notifSettings);
      setNotifMsg("Notification settings saved!");
      setTimeout(() => setNotifMsg(""), 3000);
    } catch { setNotifMsg("Error saving notification settings"); }
    setNotifSaving(false);
  }

  async function testTelegram() {
    setTelegramTesting(true); setTelegramResult("");
    try {
      const res = await api.post("/api/settings/test-telegram", {
        telegram_bot_token: notifSettings.telegram_bot_token,
        telegram_chat_id: notifSettings.telegram_chat_id
      });
      setTelegramResult(res.data.success ? "Test message sent!" : res.data.message);
    } catch { setTelegramResult("Failed to send test message"); }
    setTelegramTesting(false);
  }

  const loadBackups = () => { api.get("/api/analytics/backup/list").then(r => setBackups(r.data || [])).catch(() => {}); };
  const createBackup = async () => {
    setBackupLoading(true); setBackupMsg("");
    try { const r = await api.get("/api/analytics/backup"); setBackupMsg(r.data.message + ` (${r.data.size_mb} MB)`); loadBackups(); }
    catch { setBackupMsg("Backup failed"); }
    setBackupLoading(false);
  };
  const downloadBackup = async () => {
    try { const r = await api.get("/api/analytics/backup/download", { responseType: "blob" }); const url = URL.createObjectURL(r.data); const a = document.createElement("a"); a.href = url; a.download = "eduhub_backup.db"; a.click(); URL.revokeObjectURL(url); }
    catch { alert("No backup available to download"); }
  };
  const restoreBackup = async (filename: string) => {
    if (!confirm(`Restore database from ${filename}? A safety backup will be created first.`)) return;
    try { const r = await api.post("/api/analytics/backup/restore", { filename }); alert(r.data.message); loadBackups(); }
    catch { alert("Restore failed"); }
  };
  const deleteBackup = async (filename: string) => {
    if (!confirm(`Delete backup ${filename}?`)) return;
    try { await api.delete(`/api/analytics/backup/${filename}`); loadBackups(); }
    catch { alert("Delete failed"); }
  };

  async function loadSettings() {
    try {
      const res = await api.get("/api/settings");
      if (res.data && typeof res.data === "object") {
        setSettings({ ...defaultSettings, ...res.data });
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      await api.put("/api/settings", settings);
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof SettingsData, value: string) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(field: keyof SettingsData, setUploading: (v: boolean) => void, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/students/upload-photo", fd);
      updateField(field, res.data.url || "");
    } catch { /* empty */ }
    setUploading(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    handleImageUpload("logo_url", setUploadingLogo, e);
  }

  const tabs = [
    { id: "general", label: "General" },
    { id: "branding", label: "Branding & Logo" },
    { id: "homepage", label: "Homepage / Hero" },
    { id: "footer", label: "Footer" },
    { id: "about_page", label: "About Page" },
    { id: "services_page", label: "Services Page" },
    { id: "contact_page", label: "Contact Page" },
    { id: "social", label: "Social Media" },
    { id: "seo", label: "SEO" },
    { id: "email", label: "SMTP / Email" },
    { id: "sms", label: "SMS Gateway" },
    { id: "payment", label: "Payment Gateway" },
    { id: "legal", label: "Legal" },
    { id: "popup", label: "Enquiry Popup" },
    { id: "receipt", label: "Receipt Settings" },
    { id: "backup", label: "Backup & Restore" },
    { id: "notifications", label: "Notifications" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === "general" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={settings.company_name} onChange={(e) => updateField("company_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={settings.company_email} onChange={(e) => updateField("company_email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={settings.company_phone} onChange={(e) => updateField("company_phone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="text" value={settings.company_website} onChange={(e) => updateField("company_website", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input type="text" value={settings.whatsapp_number} onChange={(e) => updateField("whatsapp_number", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Admission Target</label>
                <input type="number" value={settings.monthly_target} onChange={(e) => updateField("monthly_target", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={settings.company_address} onChange={(e) => updateField("company_address", e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About Text</label>
              <textarea value={settings.about_text} onChange={(e) => updateField("about_text", e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Google Map Location (Contact Page)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="text" value={settings.map_latitude} onChange={(e) => updateField("map_latitude", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="26.9124" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="text" value={settings.map_longitude} onChange={(e) => updateField("map_longitude", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="75.7873" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Get coordinates from Google Maps - right click on location &gt; copy coordinates</p>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Social Media Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                <input type="url" value={settings.facebook_url} onChange={(e) => updateField("facebook_url", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://facebook.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                <input type="url" value={settings.instagram_url} onChange={(e) => updateField("instagram_url", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input type="url" value={settings.linkedin_url} onChange={(e) => updateField("linkedin_url", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://linkedin.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                <input type="url" value={settings.youtube_url} onChange={(e) => updateField("youtube_url", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
                <input type="url" value={settings.twitter_url} onChange={(e) => updateField("twitter_url", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://twitter.com/..." />
              </div>
            </div>
          </div>
        )}

        {activeTab === "branding" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">Branding & Logo</h2>

            {/* Site Name & Tagline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input type="text" value={settings.site_name} onChange={(e) => updateField("site_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="A Step For Future - Education Hub" />
                <p className="text-xs text-gray-400 mt-1">Shown in browser tab, SEO, social share previews</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Tagline</label>
                <input type="text" value={settings.site_tagline} onChange={(e) => updateField("site_tagline", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="India's Trusted Education Partner" />
              </div>
            </div>

            {/* Main Logo */}
            <div className="p-4 bg-gray-50 rounded-xl border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Main Logo (used everywhere)</label>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <img src={settings.logo_url.startsWith("/") ? API + settings.logo_url : settings.logo_url} alt="Logo" className="h-16 w-16 object-contain border rounded-lg p-1 bg-white" />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No logo</div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 text-sm">
                    <Upload className="h-4 w-4" /> {uploadingLogo ? "Uploading..." : "Upload Main Logo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 512x512px or larger, PNG with transparent bg</p>
                </div>
              </div>
            </div>

            {/* Navbar Logo */}
            <div className="p-4 bg-gray-50 rounded-xl border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Navbar Logo (header)</label>
              <div className="flex items-center gap-4">
                {settings.navbar_logo_url ? (
                  <img src={settings.navbar_logo_url.startsWith("/") ? API + settings.navbar_logo_url : settings.navbar_logo_url} alt="Navbar Logo" className="h-12 object-contain border rounded-lg p-1 bg-white" />
                ) : (
                  <div className="h-12 w-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">Default</div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 text-sm">
                    <Upload className="h-4 w-4" /> {uploadingNavbarLogo ? "Uploading..." : "Upload Navbar Logo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload("navbar_logo_url", setUploadingNavbarLogo, e)} disabled={uploadingNavbarLogo} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 300x80px, PNG transparent</p>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div className="p-4 bg-gray-50 rounded-xl border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Favicon (browser tab icon)</label>
              <div className="flex items-center gap-4">
                {settings.favicon_url ? (
                  <img src={settings.favicon_url.startsWith("/") ? API + settings.favicon_url : settings.favicon_url} alt="Favicon" className="h-12 w-12 object-contain border rounded-lg p-1 bg-white" />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">Default</div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 text-sm">
                    <Upload className="h-4 w-4" /> {uploadingFavicon ? "Uploading..." : "Upload Favicon"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload("favicon_url", setUploadingFavicon, e)} disabled={uploadingFavicon} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 512x512px, square PNG</p>
                </div>
              </div>
            </div>

            {/* OG / Social Share Image */}
            <div className="p-4 bg-gray-50 rounded-xl border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Share Image (WhatsApp, Facebook, Twitter preview)</label>
              <div className="flex items-center gap-4">
                {settings.og_image_url ? (
                  <img src={settings.og_image_url.startsWith("/") ? API + settings.og_image_url : settings.og_image_url} alt="OG Image" className="h-16 w-28 object-contain border rounded-lg p-1 bg-white" />
                ) : (
                  <div className="h-16 w-28 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">Default</div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 text-sm">
                    <Upload className="h-4 w-4" /> {uploadingOgImage ? "Uploading..." : "Upload OG Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload("og_image_url", setUploadingOgImage, e)} disabled={uploadingOgImage} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 1200x630px for best preview on social media</p>
                </div>
              </div>
            </div>

            {/* Footer Logo */}
            <div className="p-4 bg-gray-50 rounded-xl border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Footer Logo</label>
              <div className="flex items-center gap-4">
                {settings.footer_logo_url ? (
                  <img src={settings.footer_logo_url.startsWith("/") ? API + settings.footer_logo_url : settings.footer_logo_url} alt="Footer Logo" className="h-12 object-contain border rounded-lg p-1 bg-slate-800" />
                ) : (
                  <div className="h-12 w-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">Default</div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg cursor-pointer hover:bg-slate-800 text-sm">
                    <Upload className="h-4 w-4" /> {uploadingFooterLogo ? "Uploading..." : "Upload Footer Logo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload("footer_logo_url", setUploadingFooterLogo, e)} disabled={uploadingFooterLogo} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 300x80px, light/white version for dark footer</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.primary_color} onChange={(e) => updateField("primary_color", e.target.value)} className="h-10 w-16 rounded cursor-pointer" />
                  <input type="text" value={settings.primary_color} onChange={(e) => updateField("primary_color", e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.secondary_color} onChange={(e) => updateField("secondary_color", e.target.value)} className="h-10 w-16 rounded cursor-pointer" />
                  <input type="text" value={settings.secondary_color} onChange={(e) => updateField("secondary_color", e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Color Preview</h3>
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-lg shadow" style={{ backgroundColor: settings.primary_color }} />
                <div className="h-20 w-20 rounded-lg shadow" style={{ backgroundColor: settings.secondary_color }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "homepage" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">Homepage / Hero Section</h2>
            <p className="text-sm text-gray-500 mb-4">Customize the hero section and homepage content that visitors see first.</p>

            {/* Hero Badge */}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Badge Text</label><input type="text" value={settings.hero_badge_text} onChange={(e) => updateField("hero_badge_text", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="India's Trusted Education Partner" /><p className="text-xs text-gray-400 mt-1">Small badge text shown above the hero title</p></div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Title (Main Heading)</label><input type="text" value={settings.hero_title} onChange={(e) => updateField("hero_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Shape Your Future with" /><p className="text-xs text-gray-400 mt-1">First part of the heading (before highlight text)</p></div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Highlight Text (Colored part)</label><input type="text" value={settings.hero_highlight_text} onChange={(e) => updateField("hero_highlight_text", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="World-Class Education" /><p className="text-xs text-gray-400 mt-1">The gradient-colored part of the heading</p></div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle / Description</label><textarea value={settings.hero_subtitle} onChange={(e) => updateField("hero_subtitle", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Connect with 30+ top universities, explore 500+ courses..." /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label><input type="text" value={settings.hero_cta_text} onChange={(e) => updateField("hero_cta_text", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Apply Now" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Background Image URL</label><input type="url" value={settings.hero_bg_image} onChange={(e) => updateField("hero_bg_image", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://example.com/hero-bg.jpg" /><p className="text-xs text-gray-400 mt-1">Leave empty for default background</p></div>
            </div>
            
            {/* Homepage Stats Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Homepage Statistics Counters</h3>
              <p className="text-sm text-gray-500 mb-4">These numbers are displayed on the homepage as animated counters.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <label className="block text-sm font-medium text-green-800 mb-1">Students Enrolled Count</label>
                  <input type="number" value={settings.stat_students_enrolled} onChange={(e) => updateField("stat_students_enrolled", e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="5000" />
                  <p className="text-xs text-green-600 mt-1">Shows as "{settings.stat_students_enrolled || '5000'}+" on homepage</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Success Rate (%)</label>
                  <input type="number" value={settings.stat_success_rate} onChange={(e) => updateField("stat_success_rate", e.target.value)} className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="95" min="1" max="100" />
                  <p className="text-xs text-orange-600 mt-1">Shows as "{settings.stat_success_rate || '95'}%" on homepage</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Universities Label</label><input type="text" value={settings.stat_uni_label} onChange={(e) => updateField("stat_uni_label", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Partner Universities" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Courses Label</label><input type="text" value={settings.stat_course_label} onChange={(e) => updateField("stat_course_label", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Courses Available" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Students Label</label><input type="text" value={settings.stat_student_label} onChange={(e) => updateField("stat_student_label", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Students Enrolled" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Success Rate Label</label><input type="text" value={settings.stat_success_label} onChange={(e) => updateField("stat_success_label", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Success Rate" /></div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border">
                <h4 className="text-xs font-semibold text-gray-500 mb-2">PREVIEW</h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div><div className="text-2xl font-bold text-blue-600">30+</div><div className="text-xs text-gray-500">{settings.stat_uni_label || 'Partner Universities'}</div></div>
                  <div><div className="text-2xl font-bold text-indigo-600">500+</div><div className="text-xs text-gray-500">{settings.stat_course_label || 'Courses Available'}</div></div>
                  <div><div className="text-2xl font-bold text-green-600">{settings.stat_students_enrolled || '5000'}+</div><div className="text-xs text-gray-500">{settings.stat_student_label || 'Students Enrolled'}</div></div>
                  <div><div className="text-2xl font-bold text-orange-600">{settings.stat_success_rate || '95'}%</div><div className="text-xs text-gray-500">{settings.stat_success_label || 'Success Rate'}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== FOOTER TAB ===== */}
        {activeTab === "footer" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">Footer Customization</h2>
            <p className="text-sm text-gray-500 mb-4">Customize the footer section that appears on every page of the website.</p>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Footer Description</label><textarea value={settings.footer_description} onChange={(e) => updateField("footer_description", e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Your trusted partner for higher education admissions..." /><p className="text-xs text-gray-400 mt-1">Short description shown below the logo in footer</p></div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Copyright Text (optional)</label><input type="text" value={settings.footer_copyright} onChange={(e) => updateField("footer_copyright", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Leave empty for auto-generated copyright" /><p className="text-xs text-gray-400 mt-1">Leave empty to show: &copy; 2026 [Site Name]. All rights reserved.</p></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Column 2 Title</label><input type="text" value={settings.footer_col2_title} onChange={(e) => updateField("footer_col2_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Quick Links" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Column 3 Title</label><input type="text" value={settings.footer_col3_title} onChange={(e) => updateField("footer_col3_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Contact Info" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Column 4 Title</label><input type="text" value={settings.footer_col4_title} onChange={(e) => updateField("footer_col4_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Follow Us" /></div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Footer Contact Info</h3>
              <p className="text-xs text-gray-500 mb-3">These values are pulled from General tab: Company Address, Phone, Email. Update them there.</p>
              <div className="p-4 bg-gray-50 rounded-xl border">
                <div className="text-sm space-y-1 text-gray-600">
                  <p><strong>Address:</strong> {settings.company_address || "Not set - go to General tab"}</p>
                  <p><strong>Phone:</strong> {settings.company_phone || "Not set - go to General tab"}</p>
                  <p><strong>Email:</strong> {settings.company_email || "Not set - go to General tab"}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Social Links in Footer</h3>
              <p className="text-xs text-gray-500 mb-3">These are pulled from Social Media tab. Update them there.</p>
              <div className="p-4 bg-gray-50 rounded-xl border">
                <div className="text-sm space-y-1 text-gray-600">
                  <p><strong>Facebook:</strong> {settings.facebook_url || "Not set"}</p>
                  <p><strong>Instagram:</strong> {settings.instagram_url || "Not set"}</p>
                  <p><strong>LinkedIn:</strong> {settings.linkedin_url || "Not set"}</p>
                  <p><strong>YouTube:</strong> {settings.youtube_url || "Not set"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ABOUT PAGE TAB ===== */}
        {activeTab === "about_page" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">About Page Content</h2>
            <p className="text-sm text-gray-500 mb-4">Customize all the content on the About Us page.</p>

            {/* Hero Section */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Hero Section</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label><textarea value={settings.about_hero_subtitle} onChange={(e) => updateField("about_hero_subtitle", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Your trusted partner in education..." /></div>
              <div className="mt-3"><label className="block text-sm font-medium text-gray-700 mb-1">Hero Background Image URL</label><input type="url" value={settings.about_hero_image} onChange={(e) => updateField("about_hero_image", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://example.com/about-hero.jpg" /></div>
            </div>

            {/* Who We Are Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Who We Are Section</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label><input type="text" value={settings.about_who_title} onChange={(e) => updateField("about_who_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Empowering Students to Achieve Their Dreams" /></div>
              <div className="mt-3"><label className="block text-sm font-medium text-gray-700 mb-1">Description Paragraph 1</label><textarea value={settings.about_who_description_1} onChange={(e) => updateField("about_who_description_1", e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="mt-3"><label className="block text-sm font-medium text-gray-700 mb-1">Description Paragraph 2</label><textarea value={settings.about_who_description_2} onChange={(e) => updateField("about_who_description_2", e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Badge 1</label><input type="text" value={settings.about_badge_1} onChange={(e) => updateField("about_badge_1", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="UGC Recognized Partners" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Badge 2</label><input type="text" value={settings.about_badge_2} onChange={(e) => updateField("about_badge_2", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="NAAC Accredited" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Badge 3</label><input type="text" value={settings.about_badge_3} onChange={(e) => updateField("about_badge_3", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="10+ Years Experience" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Image 1 URL</label><input type="url" value={settings.about_image_1} onChange={(e) => updateField("about_image_1", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://..." /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Image 2 URL</label><input type="url" value={settings.about_image_2} onChange={(e) => updateField("about_image_2", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://..." /></div>
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Mission & Vision</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Our Mission</label><textarea value={settings.about_mission} onChange={(e) => updateField("about_mission", e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="mt-3"><label className="block text-sm font-medium text-gray-700 mb-1">Our Vision</label><textarea value={settings.about_vision} onChange={(e) => updateField("about_vision", e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            </div>

            {/* Core Values */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Core Values (4 items)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Value {n}</p>
                    <input type="text" value={(settings as unknown as Record<string, string>)[`about_value_${n}_title`] || ""} onChange={(e) => updateField(`about_value_${n}_title` as keyof SettingsData, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2" placeholder="Title" />
                    <input type="text" value={(settings as unknown as Record<string, string>)[`about_value_${n}_desc`] || ""} onChange={(e) => updateField(`about_value_${n}_desc` as keyof SettingsData, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Description" />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">About Page Stats (4 counters)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Stat {n}</p>
                    <input type="text" value={(settings as unknown as Record<string, string>)[`about_stat_${n}_value`] || ""} onChange={(e) => updateField(`about_stat_${n}_value` as keyof SettingsData, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2" placeholder="e.g. 15+" />
                    <input type="text" value={(settings as unknown as Record<string, string>)[`about_stat_${n}_label`] || ""} onChange={(e) => updateField(`about_stat_${n}_label` as keyof SettingsData, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Universities" />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Call to Action Section</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">CTA Title</label><input type="text" value={settings.about_cta_title} onChange={(e) => updateField("about_cta_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ready to Start Your Journey?" /></div>
              <div className="mt-3"><label className="block text-sm font-medium text-gray-700 mb-1">CTA Subtitle</label><textarea value={settings.about_cta_subtitle} onChange={(e) => updateField("about_cta_subtitle", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            </div>
          </div>
        )}

        {/* ===== SERVICES PAGE TAB ===== */}
        {activeTab === "services_page" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">Services Page Content</h2>
            <p className="text-sm text-gray-500 mb-4">Customize all the content on the Services page.</p>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label><textarea value={settings.services_hero_subtitle} onChange={(e) => updateField("services_hero_subtitle", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Comprehensive education consulting services..." /></div>

            {/* Service Items */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Service Items (8 items)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Service {n}</p>
                    <input type="text" value={(settings as unknown as Record<string, string>)[`service_${n}_title`] || ""} onChange={(e) => updateField(`service_${n}_title` as keyof SettingsData, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2" placeholder="Service title" />
                    <textarea value={(settings as unknown as Record<string, string>)[`service_${n}_desc`] || ""} onChange={(e) => updateField(`service_${n}_desc` as keyof SettingsData, e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Service description" />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">CTA Section</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">CTA Title</label><input type="text" value={settings.services_cta_title} onChange={(e) => updateField("services_cta_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Need Help Choosing the Right Path?" /></div>
              <div className="mt-3"><label className="block text-sm font-medium text-gray-700 mb-1">CTA Subtitle</label><textarea value={settings.services_cta_subtitle} onChange={(e) => updateField("services_cta_subtitle", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            </div>

            {/* How It Works Process Steps */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">How It Works (4 Steps)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Step {n}</p>
                    <input type="text" value={(settings as unknown as Record<string, string>)[`services_process_${n}_title`] || ""} onChange={(e) => updateField(`services_process_${n}_title` as keyof SettingsData, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2" placeholder="Step title" />
                    <input type="text" value={(settings as unknown as Record<string, string>)[`services_process_${n}_desc`] || ""} onChange={(e) => updateField(`services_process_${n}_desc` as keyof SettingsData, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Step description" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== CONTACT PAGE TAB ===== */}
        {activeTab === "contact_page" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">Contact Page Content</h2>
            <p className="text-sm text-gray-500 mb-4">Customize the Contact page content. Phone, Email, Address are pulled from General tab.</p>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label><textarea value={settings.contact_hero_subtitle} onChange={(e) => updateField("contact_hero_subtitle", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Have questions? We'd love to hear from you." /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label><input type="text" value={settings.contact_working_hours} onChange={(e) => updateField("contact_working_hours", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Mon - Sat: 9AM - 7PM" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Off Days</label><input type="text" value={settings.contact_working_hours_off} onChange={(e) => updateField("contact_working_hours_off", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Sunday: Closed" /></div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hero Background Image URL</label><input type="url" value={settings.contact_hero_image} onChange={(e) => updateField("contact_hero_image", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://example.com/contact-hero.jpg" /></div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact Info (from General tab)</h3>
              <div className="p-4 bg-gray-50 rounded-xl border">
                <div className="text-sm space-y-1 text-gray-600">
                  <p><strong>Address:</strong> {settings.company_address || "Not set - go to General tab"}</p>
                  <p><strong>Phone:</strong> {settings.company_phone || "Not set - go to General tab"}</p>
                  <p><strong>Email:</strong> {settings.company_email || "Not set - go to General tab"}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Google Map Location</h3>
              <p className="text-xs text-gray-500 mb-3">Map coordinates are managed from General tab (Map Latitude/Longitude).</p>
              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-600">Latitude: {settings.map_latitude || "26.9124"}, Longitude: {settings.map_longitude || "75.7873"}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">SEO & Analytics</h2>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label><input type="text" value={settings.meta_title} onChange={(e) => updateField("meta_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Education Hub - Your Gateway to Quality Education" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label><textarea value={settings.meta_description} onChange={(e) => updateField("meta_description", e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Education Hub helps students find courses..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label><input type="text" value={settings.meta_keywords} onChange={(e) => updateField("meta_keywords", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="education, university, courses, admission" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label><input type="text" value={settings.google_analytics} onChange={(e) => updateField("google_analytics", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="G-XXXXXXXXXX" /></div>
          </div>
        )}

        {activeTab === "legal" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Legal Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
              <textarea value={settings.terms_conditions} onChange={(e) => updateField("terms_conditions", e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your terms and conditions..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy</label>
              <textarea value={settings.privacy_policy} onChange={(e) => updateField("privacy_policy", e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your privacy policy..." />
            </div>
          </div>
        )}
        {activeTab === "email" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">SMTP / Email Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">Configure email settings for sending notifications, password reset emails, etc.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label><input type="text" value={settings.smtp_host} onChange={(e) => updateField("smtp_host", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="smtp.gmail.com" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label><input type="text" value={settings.smtp_port} onChange={(e) => updateField("smtp_port", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="587" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label><input type="text" value={settings.smtp_user} onChange={(e) => updateField("smtp_user", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="your-email@gmail.com" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label><input type="password" value={settings.smtp_password} onChange={(e) => updateField("smtp_password", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="App password" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">From Email</label><input type="email" value={settings.smtp_from_email} onChange={(e) => updateField("smtp_from_email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="noreply@asffeducationhub.com" /></div>
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Test SMTP Configuration</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Send test email to:</label>
                  <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <button onClick={async () => { if (!testEmail) return; setSmtpTesting(true); setSmtpResult(""); try { await handleSave(); const r = await api.post("/api/settings/test-smtp", { to_email: testEmail }); setSmtpResult(r.data?.message || "Done"); } catch (e: any) { setSmtpResult(e?.response?.data?.message || "Failed"); } setSmtpTesting(false); }} disabled={smtpTesting || !testEmail} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">
                  {smtpTesting ? "Sending..." : "Send Test Email"}
                </button>
              </div>
              {smtpResult && <p className={`mt-2 text-sm ${smtpResult.includes("success") ? "text-green-600" : "text-red-600"}`}>{smtpResult}</p>}
            </div>
          </div>
        )}

        {activeTab === "sms" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">SMS Gateway Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">Configure SMS gateway for sending OTP, notifications, etc.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SMS Gateway</label>
                <select value={settings.sms_gateway} onChange={(e) => updateField("sms_gateway", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="msg91">MSG91</option><option value="twilio">Twilio</option><option value="textlocal">TextLocal</option><option value="fast2sms">Fast2SMS</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">API Key</label><input type="password" value={settings.sms_api_key} onChange={(e) => updateField("sms_api_key", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Your SMS API key" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label><input type="text" value={settings.sms_sender_id} onChange={(e) => updateField("sms_sender_id", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="EDUHUB" /></div>
            </div>
          </div>
        )}

        {activeTab === "payment" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">Payment Gateway Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">Configure payment gateway for online fee collection.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Gateway</label>
                <select value={settings.payment_gateway} onChange={(e) => updateField("payment_gateway", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="razorpay">Razorpay</option><option value="paytm">Paytm</option><option value="phonepe">PhonePe</option><option value="cashfree">Cashfree</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">API Key / Key ID</label><input type="password" value={settings.payment_api_key} onChange={(e) => updateField("payment_api_key", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Your payment API key" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label><input type="password" value={settings.payment_secret_key} onChange={(e) => updateField("payment_secret_key", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Your payment secret key" /></div>
            </div>

            {/* UPI QR Code Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">UPI Payment QR Code</h3>
              <p className="text-xs text-gray-500 mb-3">Upload your UPI QR code image. Students will see this when they choose UPI payment.</p>
              <div className="flex items-start gap-4">
                {settings.upi_qr_image ? (
                  <img src={settings.upi_qr_image.startsWith("/") ? API + settings.upi_qr_image : settings.upi_qr_image} alt="UPI QR" className="h-40 w-40 object-contain border rounded-lg p-1 bg-white" />
                ) : (
                  <div className="h-40 w-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border-2 border-dashed">No QR uploaded</div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 text-sm font-medium">
                    <Upload className="h-4 w-4" />
                    {uploadingUpiQr ? "Uploading..." : "Upload QR Code"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload("upi_qr_image", setUploadingUpiQr, e)} disabled={uploadingUpiQr} />
                  </label>
                  {settings.upi_qr_image && <button onClick={() => updateField("upi_qr_image", "")} className="mt-2 text-xs text-red-500 hover:text-red-700">Remove QR</button>}
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Bank Transfer Details</h3>
              <p className="text-xs text-gray-500 mb-3">Students will see these details when they choose Bank Transfer payment.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label><input type="text" value={settings.bank_account_name} onChange={(e) => updateField("bank_account_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. A Step For Future Education" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label><input type="text" value={settings.bank_account_number} onChange={(e) => updateField("bank_account_number", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 1234567890" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label><input type="text" value={settings.bank_ifsc_code} onChange={(e) => updateField("bank_ifsc_code", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. SBIN0001234" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label><input type="text" value={settings.bank_name} onChange={(e) => updateField("bank_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. State Bank of India" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Branch</label><input type="text" value={settings.bank_branch} onChange={(e) => updateField("bank_branch", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Jaipur Main Branch" /></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "receipt" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Receipt Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Configure auto-generated fee receipts. All fields below will appear on the receipt.</p>

            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Company / Office Details (shown on receipt header)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company / Institute Name</label>
                  <input type="text" value={settings.company_name} onChange={(e) => updateField("company_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. ASFF Education Hub" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                  <input type="text" value={settings.site_tagline} onChange={(e) => updateField("site_tagline", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. A Step For Future" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="text" value={settings.company_phone} onChange={(e) => updateField("company_phone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. +91-9876543210" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={settings.company_email} onChange={(e) => updateField("company_email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. info@example.com" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                <textarea value={settings.company_address} onChange={(e) => updateField("company_address", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 123, Main Road, Jaipur, Rajasthan - 302001" />
                <p className="text-xs text-gray-400 mt-1">This address will appear on the receipt header and footer</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Receipt Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number Prefix</label>
                  <input type="text" value={settings.receipt_prefix} onChange={(e) => updateField("receipt_prefix", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. ASFF" />
                  <p className="text-xs text-gray-400 mt-1">Receipt numbers will be like ASFF-001001</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input type="text" value={settings.receipt_gst_number} onChange={(e) => updateField("receipt_gst_number", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 08AABCU9603R1ZP" />
                  <p className="text-xs text-gray-400 mt-1">Shown in receipt header below address</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Text</label>
                <textarea value={settings.receipt_footer} onChange={(e) => updateField("receipt_footer", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="This is a computer generated receipt." />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">WhatsApp API (Optional)</h3>
              <p className="text-xs text-gray-500 mb-3">If configured, receipts will also be sent via WhatsApp automatically.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp API URL</label>
                  <input type="text" value={settings.whatsapp_api_url} onChange={(e) => updateField("whatsapp_api_url", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://api.whatsapp.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp API Key</label>
                  <input type="password" value={settings.whatsapp_api_key} onChange={(e) => updateField("whatsapp_api_key", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Your WhatsApp API key" />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 mt-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">How Receipts Work</h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                <li>Receipts are auto-generated when admin adds a transaction or approves a student payment</li>
                <li>Company Name, Address, Phone, Email, GST - all managed from this tab</li>
                <li>Receipt email is sent using SMTP settings from Email tab</li>
                <li>Students can view & download receipts from their Fees page</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "backup" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-indigo-600" /> Backup & Restore</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
                <Database className="h-10 w-10 mb-3 opacity-80" />
                <h3 className="font-bold text-lg mb-1">Create Backup</h3>
                <p className="text-sm opacity-80 mb-4">One-click database backup. Download anytime.</p>
                <button onClick={createBackup} disabled={backupLoading} className="w-full px-4 py-2.5 bg-white text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-2">
                  {backupLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} {backupLoading ? "Creating..." : "Create Backup Now"}
                </button>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white">
                <Download className="h-10 w-10 mb-3 opacity-80" />
                <h3 className="font-bold text-lg mb-1">Download Latest</h3>
                <p className="text-sm opacity-80 mb-4">Download the most recent backup file.</p>
                <button onClick={downloadBackup} className="w-full px-4 py-2.5 bg-white text-green-700 rounded-lg text-sm font-bold hover:bg-green-50 flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" /> Download Backup
                </button>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
                <RotateCcw className="h-10 w-10 mb-3 opacity-80" />
                <h3 className="font-bold text-lg mb-1">Backup History</h3>
                <p className="text-sm opacity-80 mb-4">{backups.length} backup(s) available</p>
                <button onClick={loadBackups} className="w-full px-4 py-2.5 bg-white text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-50 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Refresh List
                </button>
              </div>
            </div>
            {backupMsg && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium">{backupMsg}</div>}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b"><h3 className="font-semibold">Backup History</h3></div>
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Filename</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Size</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No backups yet. Create your first backup above!</td></tr>
                  ) : backups.map((b: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{b.filename}</td>
                      <td className="px-4 py-3">{b.size_mb} MB</td>
                      <td className="px-4 py-3">{b.created_at ? new Date(b.created_at).toLocaleString("en-IN") : ""}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => restoreBackup(b.filename)} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Restore</button>
                          <button onClick={() => deleteBackup(b.filename)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "popup" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Enquiry Popup Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Configure the enquiry popup that appears on the public website after a set delay.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popup Enabled</label>
                <select value={settings.popup_enabled} onChange={(e) => updateField("popup_enabled", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="true">Enabled (On)</option>
                  <option value="false">Disabled (Off)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popup Delay (seconds)</label>
                <input type="number" min="5" max="300" value={settings.popup_delay} onChange={(e) => updateField("popup_delay", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <p className="text-xs text-gray-400 mt-1">How many seconds before the popup appears (5-300)</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="h-5 w-5 text-blue-600" /> Notification Settings</h2>
              <button onClick={saveNotifSettings} disabled={notifSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                {notifSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Notifications
              </button>
            </div>
            {notifMsg && <div className={`p-3 rounded-lg text-sm ${notifMsg.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{notifMsg}</div>}

            {/* Telegram Settings */}
            <div className="border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Send className="h-4 w-4 text-blue-500" /> Telegram Notifications</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Enable Telegram:</label>
                <select value={notifSettings.telegram_enabled} onChange={e => setNotifSettings({...notifSettings, telegram_enabled: e.target.value})} className="px-3 py-1.5 border rounded-lg text-sm">
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bot Token</label>
                  <input type="password" value={notifSettings.telegram_bot_token} onChange={e => setNotifSettings({...notifSettings, telegram_bot_token: e.target.value})} placeholder="8759298695:AAEcY..." className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chat IDs (Team Members)</label>
                  <textarea value={notifSettings.telegram_chat_id} onChange={e => setNotifSettings({...notifSettings, telegram_chat_id: e.target.value})} placeholder="722304132, 123456789, 987654321" className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
                  <p className="text-xs text-gray-400 mt-1">Comma-separated Chat IDs for all team members. Each member: Send /start to bot, then use @userinfobot to get Chat ID</p>
                  {notifSettings.telegram_chat_id && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {notifSettings.telegram_chat_id.split(",").filter((id: string) => id.trim()).map((id: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {id.trim()}
                          <button type="button" onClick={() => {
                            const ids = notifSettings.telegram_chat_id.split(",").filter((c: string) => c.trim());
                            ids.splice(i, 1);
                            setNotifSettings({...notifSettings, telegram_chat_id: ids.join(", ")});
                          }} className="hover:text-red-500 font-bold ml-0.5">&times;</button>
                        </span>
                      ))}
                      <span className="text-xs text-gray-400 self-center ml-1">({notifSettings.telegram_chat_id.split(",").filter((id: string) => id.trim()).length} members)</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={testTelegram} disabled={telegramTesting || !notifSettings.telegram_bot_token || !notifSettings.telegram_chat_id} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 text-sm">
                {telegramTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Test Message
              </button>
              {telegramResult && <p className={`text-sm ${telegramResult.includes("sent") ? "text-green-600" : "text-red-600"}`}>{telegramResult}</p>}
            </div>

            {/* Email Settings */}
            <div className="border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Email Notifications</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Enable Email:</label>
                <select value={notifSettings.email_enabled} onChange={e => setNotifSettings({...notifSettings, email_enabled: e.target.value})} className="px-3 py-1.5 border rounded-lg text-sm">
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Email</label>
                <input type="email" value={notifSettings.notification_email} onChange={e => setNotifSettings({...notifSettings, notification_email: e.target.value})} placeholder="harisoniofficial@gmail.com" className="w-full px-3 py-2 border rounded-lg text-sm max-w-md" />
                <p className="text-xs text-gray-400 mt-1">All admin notifications will be sent to this email. Uses SMTP settings from Email tab.</p>
              </div>
            </div>

            {/* Event Types */}
            <div className="border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Notification Events</h3>
              <p className="text-sm text-gray-500">Choose which events trigger notifications:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: "notify_payment", label: "Payments", desc: "New payment received/submitted" },
                  { key: "notify_lead", label: "New Leads", desc: "New lead added" },
                  { key: "notify_student", label: "New Students", desc: "New student registered" },
                  { key: "notify_enquiry", label: "Enquiries", desc: "New enquiry received" },
                  { key: "notify_document", label: "Documents", desc: "Document uploaded" },
                  { key: "notify_career", label: "Career Applications", desc: "New job application received" },
                  { key: "notify_support", label: "Support Tickets", desc: "New support ticket created" },
                  { key: "notify_notice", label: "Notices", desc: "New notice posted" },
                  { key: "notify_blog", label: "Blog Posts", desc: "New blog post published" },
                  { key: "notify_placement", label: "Placements", desc: "New placement added" },
                  { key: "notify_testimonial", label: "Testimonials", desc: "New testimonial submitted" },
                ].map(item => (
                  <label key={item.key} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={notifSettings[item.key as keyof typeof notifSettings] === "true"} onChange={e => setNotifSettings({...notifSettings, [item.key]: e.target.checked ? "true" : "false"})} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">How Notifications Work</h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                <li>Notifications are sent instantly when events happen (payment, new lead, enquiry, etc.)</li>
                <li>Each notification includes a direct link to the relevant admin page</li>
                <li>Telegram messages are sent via your bot to the configured chat ID</li>
                <li>Email notifications use SMTP settings from the Email tab</li>
                <li>All notifications run in the background and don't slow down the platform</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
