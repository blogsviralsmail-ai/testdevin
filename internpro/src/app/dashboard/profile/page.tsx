"use client";

import { useState, useEffect } from "react";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  collegeName: string | null;
  degree: string | null;
  year: string | null;
  address: string | null;
  dob: string | null;
  bio: string | null;
  skills: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", collegeName: "", degree: "", year: "", address: "", dob: "",
    bio: "", skills: "", linkedinUrl: "", portfolioUrl: "",
  });
  const [profileComplete, setProfileComplete] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [joiningDate, setJoiningDate] = useState<string | null>(null);
  const [loginHours, setLoginHours] = useState<{date: string; loginTime: string; logoutTime: string | null; totalMinutes: number}[]>([]);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      setProfile(data.user || data);
      setProfileComplete(data.profileComplete || 0);
      const u = data.user || data;
      setForm({
        name: u.name || "",
        phone: u.phone || "",
        collegeName: u.collegeName || "",
        degree: u.degree || "",
        year: u.year || "",
        address: u.address || "",
        dob: u.dob ? u.dob.split("T")[0] : "",
        bio: u.bio || "",
        skills: u.skills || "",
        linkedinUrl: u.linkedinUrl || "",
        portfolioUrl: u.portfolioUrl || "",
      });
      setLoading(false);
    });
    // Fetch joining date from enrollment
    fetch("/api/enrollments").then(r => r.json()).then(data => {
      if (data.length > 0 && data[0].joiningDate) {
        setJoiningDate(data[0].joiningDate);
      }
    }).catch(() => {});
    // Fetch login hours
    fetch("/api/login-sessions").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setLoginHours(data);
    }).catch(() => {});
  }, []);

  const handlePhotoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setMsg("File size must be less than 5MB");
      setTimeout(() => setMsg(""), 4000);
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMsg("Only JPG, PNG, GIF, WEBP images allowed");
      setTimeout(() => setMsg(""), 4000);
      return;
    }
    setUploading(true);
    setMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Upload failed" }));
        setMsg(errData.error || "Upload failed");
        setUploading(false);
        setTimeout(() => setMsg(""), 4000);
        return;
      }
      const data = await res.json();
      const updateRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: data.url }),
      });
      if (updateRes.ok) {
        const updated = await updateRes.json();
        setProfile(updated);
        setMsg("Photo updated successfully! It will auto-sync to your ID card.");
      } else {
        setMsg("Photo uploaded but profile update failed. Try again.");
      }
    } catch {
      setMsg("Network error. Please try again.");
    }
    setUploading(false);
    setTimeout(() => setMsg(""), 5000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setMsg("Profile updated!");
    } else {
      setMsg("Failed to update");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div className="p-6 text-slate-300">Loading...</div>;
  if (!profile) return <div className="p-6 text-red-500">Failed to load profile</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${profileComplete}%`, background: profileComplete === 100 ? '#10b981' : profileComplete >= 60 ? '#f59e0b' : '#ef4444' }} />
          </div>
          <span className={`text-sm font-bold ${profileComplete === 100 ? 'text-emerald-400' : profileComplete >= 60 ? 'text-amber-600' : 'text-red-400'}`}>{profileComplete}%</span>
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-transparent text-emerald-400 rounded-lg text-sm">{msg}</div>
      )}

      {/* Photo Section */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-6 mb-6 text-center">
        <div className="w-28 h-28 rounded-full border-4 border-indigo-600 mx-auto mb-3 bg-transparent flex items-center justify-center text-5xl overflow-hidden">
          {profile.avatar ? (
            <img src={profile.avatar} className="w-full h-full object-cover" alt="Photo" />
          ) : (
            <span className="text-slate-500">👤</span>
          )}
        </div>
        <label className="inline-block cursor-pointer bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2]">
          {uploading ? "Uploading..." : "Upload Photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-slate-500 mt-2">JPG, PNG — max 5MB</p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Personal Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <input value={profile.email} disabled
              className="w-full px-3 py-2 border rounded-lg text-sm text-slate-500 bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
            <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">College / Institution</label>
            <input value={form.collegeName} onChange={e => setForm({...form, collegeName: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Degree</label>
            <input value={form.degree} onChange={e => setForm({...form, degree: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="B.Tech, BCA, MBA..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Year</label>
            <input value={form.year} onChange={e => setForm({...form, year: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="2024, 3rd Year..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" rows={2} />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mt-6 mb-4">Professional Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Bio / About</label>
            <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" rows={3} placeholder="Tell us about yourself..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Skills (comma-separated)</label>
            <input value={form.skills} onChange={e => setForm({...form, skills: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="React, Node.js, Python, Design..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn URL</label>
            <input value={form.linkedinUrl} onChange={e => setForm({...form, linkedinUrl: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Portfolio URL</label>
            <input value={form.portfolioUrl} onChange={e => setForm({...form, portfolioUrl: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="https://your-portfolio.com" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="mt-4 bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2] disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Joining Date — Read Only */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-6 mt-6">
        <h2 className="text-lg font-semibold text-white mb-3">Internship Info</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300">Joining Date:</span>
          <span className="text-sm text-[#22d3ee] font-medium">{joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Not assigned yet"}</span>
        </div>
      </div>

      {/* Login Hours — Day Wise */}
      {loginHours.length > 0 && (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-3">Login Hours</h2>
          <p className="text-sm text-slate-400 mb-4">Your daily login time tracking</p>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-transparent border-b">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-2 uppercase">Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-2 uppercase">Login</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-2 uppercase">Logout</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-2 uppercase">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loginHours.slice(0, 30).map((session) => (
                  <tr key={session.date}>
                    <td className="px-4 py-2 text-sm text-white">{new Date(session.date + "T00:00:00").toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-2 text-sm text-slate-300">{session.loginTime}</td>
                    <td className="px-4 py-2 text-sm text-slate-300">{session.logoutTime || "Active"}</td>
                    <td className="px-4 py-2 text-sm font-medium text-[#22d3ee]">{Math.floor(session.totalMinutes / 60)}h {session.totalMinutes % 60}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-2">Total: {Math.floor(loginHours.reduce((s, h) => s + h.totalMinutes, 0) / 60)}h {loginHours.reduce((s, h) => s + h.totalMinutes, 0) % 60}m</p>
        </div>
      )}
    </div>
  );
}
