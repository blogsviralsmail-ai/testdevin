"use client";
import { useState, useEffect } from "react";

interface Announcement { id: string; title: string; content: string; category: string; isPinned: boolean; targetRole: string; author: { name: string; avatar?: string }; createdAt: string; }

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", isPinned: false, targetRole: "all" });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d));
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => { const r = await fetch("/api/announcements"); if (r.ok) setAnnouncements(await r.json()); };

  const createAnnouncement = async () => {
    const r = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { setShowCreate(false); setForm({ title: "", content: "", category: "general", isPinned: false, targetRole: "all" }); fetchAnnouncements(); }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    fetchAnnouncements();
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const categoryColors: Record<string, string> = { general: "bg-blue-100 text-blue-700", urgent: "bg-red-100 text-red-700", event: "bg-purple-100 text-purple-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">Important updates and notices</p>
        </div>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ New Announcement</button>}
      </div>

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className={`bg-white rounded-xl p-5 border ${a.isPinned ? "border-l-4 border-l-amber-400" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {a.isPinned && <span className="text-amber-500">📌</span>}
                <div>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[a.category] || "bg-gray-100 text-gray-600"}`}>{a.category}</span>
                    <span className="text-xs text-gray-400">by {a.author.name}</span>
                    <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => deleteAnnouncement(a.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">{a.content}</p>
          </div>
        ))}
        {announcements.length === 0 && <div className="text-center py-12 text-gray-400">No announcements yet.</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">New Announcement</h2>
            <div className="space-y-4">
              <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border rounded-lg h-32" />
              <div className="grid grid-cols-3 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border rounded-lg">
                  <option value="general">General</option>
                  <option value="urgent">Urgent</option>
                  <option value="event">Event</option>
                </select>
                <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} className="px-3 py-2 border rounded-lg">
                  <option value="all">All</option>
                  <option value="student">Students</option>
                  <option value="teamleader">Team Leaders</option>
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })} />
                  <span className="text-sm">Pin</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={createAnnouncement} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
