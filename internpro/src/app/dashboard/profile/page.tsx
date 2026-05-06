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
  }, []);

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      // Update avatar in profile
      const updateRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: data.url }),
      });
      if (updateRes.ok) {
        const updated = await updateRes.json();
        setProfile(updated);
        setMsg("Photo updated!");
      }
    }
    setUploading(false);
    setTimeout(() => setMsg(""), 3000);
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
    </div>
  );
}
