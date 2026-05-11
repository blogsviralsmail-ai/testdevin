"use client";
import { useState, useEffect } from "react";

import DataToolbar from "@/components/DataToolbar";
import { exportToCSV, exportToPDF, buildTableHTML } from "@/lib/export-utils";
interface Testimonial { id: string; name: string; role?: string; content: string; rating: number; avatar?: string; videoUrl?: string; isPublished: boolean; createdAt: string; }

export default function TestimonialsPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [form, setForm] = useState({ name: "", role: "", content: "", rating: 5, videoUrl: "", isPublished: true });
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user || d));
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => { const r = await fetch("/api/testimonials"); if (r.ok) setTestimonials(await r.json()); };

  const saveTestimonial = async () => {
    if (editing) {
      await fetch(`/api/testimonials/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); setForm({ name: "", role: "", content: "", rating: 5, videoUrl: "", isPublished: true }); fetchTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    fetchTestimonials();
  };

  const editTestimonial = (t: Testimonial) => {
    setEditing(t); setForm({ name: t.name, role: t.role || "", content: t.content, rating: t.rating, videoUrl: t.videoUrl || "", isPublished: t.isPublished }); setShowForm(true);
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";

  const getFilteredForExport = () => {
    return (testimonials || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "Testimonials", [{ key: "studentName", label: "Name" }, { key: "content", label: "Content" }, { key: "rating", label: "Rating" }, { key: "status", label: "Status" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "studentName", label: "Name" }, { key: "content", label: "Content" }, { key: "rating", label: "Rating" }, { key: "status", label: "Status" }];
    exportToPDF("Testimonials", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === testimonials.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(testimonials.map((item: { id: string }) => item.id)));
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} testimonials?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_testimonials", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchTestimonials();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Testimonials</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search testimonials..."
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
          <p className="text-sm text-slate-500">Student reviews and success stories</p>
        </div>
        {isAdmin && <button onClick={() => { setEditing(null); setForm({ name: "", role: "", content: "", rating: 5, videoUrl: "", isPublished: true }); setShowForm(true); }} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">+ Add Testimonial</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.map(t => (
          <div key={t.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border relative">
            <label className="absolute top-3 left-3 z-10 cursor-pointer"><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8] w-4 h-4" /></label>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#0EA5B8]/10 flex items-center justify-center text-[#22d3ee] font-bold">{t.name[0]}</div>
              <div>
                <p className="font-medium text-sm">{t.name}</p>
                {t.role && <p className="text-xs text-slate-500">{t.role}</p>}
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map(s => <span key={s} className={`text-sm ${s <= t.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>)}
            </div>
            <p className="text-sm text-slate-400 line-clamp-4">{t.content}</p>
            {t.videoUrl && <a href={t.videoUrl} target="_blank" rel="noopener" className="text-xs text-[#22d3ee] mt-2 block">🎥 Watch Video</a>}
            {isAdmin && (
              <div className="flex gap-3 mt-3 pt-3 border-t">
                <button onClick={() => editTestimonial(t)} className="text-xs text-[#22d3ee]">Edit</button>
                <button onClick={() => deleteTestimonial(t.id)} className="text-xs text-red-400">Delete</button>
                {!t.isPublished && <span className="text-xs text-slate-500 ml-auto">Hidden</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {testimonials.length === 0 && <div className="text-center py-12 text-slate-500">No testimonials yet.</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">{editing ? "Edit" : "Add"} Testimonial</h2>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Role (e.g. Full Stack Intern)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Review content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border rounded-lg h-24" />
              <div className="flex items-center gap-3">
                <label className="text-sm">Rating:</label>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setForm({ ...form, rating: s })} className={`text-xl ${s <= form.rating ? "text-yellow-400" : "text-gray-200"}`}>★</button>
                ))}
              </div>
              <input placeholder="Video URL (optional)" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex items-center gap-3">
                <label className="text-xs text-[#22d3ee] hover:text-[#0EA5B8] cursor-pointer font-medium border border-[#0EA5B8]/20 rounded-lg px-3 py-1.5 inline-block">
                  {fileUploading ? "Uploading..." : "Or Upload File"}
                  <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setFileUploading(true);
                    const fd = new FormData(); fd.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    if (res.ok) { const d = await res.json(); setForm({...form, videoUrl: d.url}); }
                    setFileUploading(false);
                  }} />
                </label>
                {form.videoUrl && <span className="text-xs text-emerald-400">File attached</span>}
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} /><span className="text-sm">Published (show on homepage)</span></label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400">Cancel</button>
              <button onClick={saveTestimonial} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
