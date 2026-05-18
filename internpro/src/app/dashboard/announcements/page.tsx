"use client";
import { useState, useEffect } from "react";

import DataToolbar from "@/components/DataToolbar";
import { serverExportCSV, serverExportPDF } from "@/lib/export-utils";
interface Announcement { id: string; title: string; content: string; category: string; isPinned: boolean; targetRole: string; author: { name: string; avatar?: string }; createdAt: string; }

export default function AnnouncementsPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", isPinned: false, targetRole: "all" });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user || d));
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
  const categoryColors: Record<string, string> = { general: "bg-blue-500/10 text-[#60a5fa]", urgent: "bg-red-500/10 text-red-400", event: "bg-purple-500/10 text-[#a78bfa]" };

  const handleExportCSV = () => serverExportCSV("announcements");

  const handleExportPDF = () => serverExportPDF("announcements", "Announcements");

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === announcements.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(announcements.map((item: { id: string }) => item.id)));
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} announcements?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_announcements", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchAnnouncements();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search announcements..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">
            {bulkDeleting ? "Deleting..." : "Delete Selected"}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
        </div>
      )}
          <p className="text-sm text-slate-500">Important updates and notices</p>
        </div>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">+ New Announcement</button>}
      </div>

      {/* Search */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search announcements..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-white focus:ring-2 focus:ring-[#0EA5B8] focus:border-indigo-500" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400">✕</button>}
        </div>
      </div>

      <div className="space-y-4">
        {announcements.filter(a => !searchQuery.trim() || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase())).map(a => (
          <div key={a.id} className={`rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border relative ${a.isPinned ? "border-l-4 border-l-amber-400" : ""}`}>
            <label className="absolute top-3 left-3 z-10 cursor-pointer"><input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8] w-4 h-4" /></label>
            <div className="flex items-start justify-between pl-6">
              <div className="flex items-center gap-3">
                {a.isPinned && <span className="text-amber-500">📌</span>}
                <div>
                  <h3 className="font-semibold text-white">{a.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[a.category] || "bg-transparent text-slate-400"}`}>{a.category}</span>
                    <span className="text-xs text-slate-500">by {a.author.name}</span>
                    <span className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => deleteAnnouncement(a.id)} className="text-red-400 hover:text-red-400 text-sm">Delete</button>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-400 whitespace-pre-wrap">{a.content}</p>
          </div>
        ))}
        {announcements.length === 0 && <div className="text-center py-12 text-slate-500">No announcements yet.</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-lg" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}}>
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
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400">Cancel</button>
              <button onClick={createAnnouncement} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg">Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
