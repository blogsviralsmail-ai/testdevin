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
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", collegeName: "", degree: "", year: "", address: "", dob: "",
  });
  const [uploading, setUploading] = useState(false);
  const [joiningDate, setJoiningDate] = useState<string | null>(null);
  const [loginHours, setLoginHours] = useState<{date: string; loginTime: string; logoutTime: string | null; totalMinutes: number}[]>([]);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      setProfile(data);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        collegeName: data.collegeName || "",
        degree: data.degree || "",
        year: data.year || "",
        address: data.address || "",
        dob: data.dob ? data.dob.split("T")[0] : "",
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

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;
  if (!profile) return <div className="p-6 text-red-500">Failed to load profile</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">{msg}</div>
      )}

      {/* Photo Section */}
      <div className="bg-white rounded-xl border p-6 mb-6 text-center">
        <div className="w-28 h-28 rounded-full border-4 border-indigo-600 mx-auto mb-3 bg-gray-100 flex items-center justify-center text-5xl overflow-hidden">
          {profile.avatar ? (
            <img src={profile.avatar} className="w-full h-full object-cover" alt="Photo" />
          ) : (
            <span className="text-gray-400">👤</span>
          )}
        </div>
        <label className="inline-block cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          {uploading ? "Uploading..." : "Upload Photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-gray-400 mt-2">JPG, PNG — max 5MB</p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input value={profile.email} disabled
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">College / Institution</label>
            <input value={form.collegeName} onChange={e => setForm({...form, collegeName: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Degree</label>
            <input value={form.degree} onChange={e => setForm({...form, degree: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="B.Tech, BCA, MBA..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
            <input value={form.year} onChange={e => setForm({...form, year: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="2024, 3rd Year..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" rows={2} />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Joining Date — Read Only */}
      <div className="bg-white rounded-xl border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Internship Info</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Joining Date:</span>
          <span className="text-sm text-indigo-600 font-medium">{joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Not assigned yet"}</span>
        </div>
      </div>

      {/* Login Hours — Day Wise */}
      {loginHours.length > 0 && (
        <div className="bg-white rounded-xl border p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Login Hours</h2>
          <p className="text-sm text-gray-600 mb-4">Your daily login time tracking</p>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2 uppercase">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2 uppercase">Login</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2 uppercase">Logout</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2 uppercase">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loginHours.slice(0, 30).map((session) => (
                  <tr key={session.date}>
                    <td className="px-4 py-2 text-sm text-gray-900">{new Date(session.date + "T00:00:00").toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{session.loginTime}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{session.logoutTime || "Active"}</td>
                    <td className="px-4 py-2 text-sm font-medium text-indigo-600">{Math.floor(session.totalMinutes / 60)}h {session.totalMinutes % 60}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">Total: {Math.floor(loginHours.reduce((s, h) => s + h.totalMinutes, 0) / 60)}h {loginHours.reduce((s, h) => s + h.totalMinutes, 0) % 60}m</p>
        </div>
      )}
    </div>
  );
}
