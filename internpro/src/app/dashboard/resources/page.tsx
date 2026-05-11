"use client";

import { useState, useEffect, useCallback } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  fileUrl: string | null;
  dayNumber: number | null;
  order: number;
  batchId: string;
}

interface Batch {
  id: string;
  name: string;
  program: { title: string };
}

interface UserSession {
  id: string;
  role: string;
}

const typeIcons: Record<string, string> = {
  video: "🎥",
  pdf: "📄",
  link: "🔗",
  document: "📋",
  image: "🖼️",
  word: "📝",
  excel: "📊",
  ppt: "📑",
  file: "📎",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batchId: "", title: "", type: "video", url: "", fileUrl: "", dayNumber: "", order: "0" });
  const [fileUploading, setFileUploading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editForm, setEditForm] = useState({ title: "", type: "video", url: "", fileUrl: "", dayNumber: "", order: "0", batchId: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    const [resRes, batchesRes, meRes] = await Promise.all([
      fetch("/api/resources"),
      fetch("/api/batches"),
      fetch("/api/auth/me"),
    ]);
    if (resRes.ok) setResources(await resRes.json());
    if (batchesRes.ok) setBatches(await batchesRes.json());
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dayNumber: form.dayNumber ? parseInt(form.dayNumber) : undefined,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ batchId: "", title: "", type: "video", url: "", fileUrl: "", dayNumber: "", order: "0" });
      fetchData();
    }
  };

  const handleEdit = async () => {
    if (!editingResource) return;
    const res = await fetch(`/api/resources/${editingResource.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditingResource(null);
      fetchData();
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const openEdit = (r: Resource) => {
    setEditingResource(r);
    setEditForm({
      title: r.title,
      type: r.type,
      url: r.url,
      fileUrl: r.fileUrl || "",
      dayNumber: r.dayNumber ? String(r.dayNumber) : "",
      order: String(r.order),
      batchId: r.batchId,
    });
  };

  const isAdmin = user && ["admin", "organization", "teamleader"].includes(user.role);
  const isStudent = user?.role === "student";

  // Filter resources by selected batch/course and search query
  const filteredResources = resources.filter(r => {
    if (selectedBatchId !== "all" && r.batchId !== selectedBatchId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    }
    return true;
  });

  // Group resources by day number
  const dayGroups: Record<string, Resource[]> = {};
  const generalResources: Resource[] = [];
  filteredResources.forEach((r) => {
    if (r.dayNumber) {
      const key = `Day ${r.dayNumber}`;
      if (!dayGroups[key]) dayGroups[key] = [];
      dayGroups[key].push(r);
    } else {
      generalResources.push(r);
    }
  });

  const sortedDays = Object.keys(dayGroups).sort((a, b) => {
    const numA = parseInt(a.replace("Day ", ""));
    const numB = parseInt(b.replace("Day ", ""));
    return numA - numB;
  });

  const ResourceRow = ({ resource }: { resource: Resource }) => (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-transparent transition">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl">{typeIcons[resource.type] || "📎"}</span>
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{resource.title}</h3>
          <p className="text-xs text-slate-500 capitalize">{resource.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#22d3ee] hover:text-[#0EA5B8] font-medium">
          Open →
        </a>
        {isAdmin && (
          <>
            <button onClick={() => openEdit(resource)} className="text-xs px-2 py-1 bg-transparent text-amber-400 rounded hover:bg-amber-500/10">
              Edit
            </button>
            <button onClick={() => handleDelete(resource.id, resource.title)} className="text-xs px-2 py-1 bg-transparent text-red-400 rounded hover:bg-red-500/10">
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isStudent ? "Study Material" : "Learning Resources"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isStudent
              ? "Day-wise study materials — complete each day sequentially like office attendance"
              : "Manage day-based pre-recorded videos and study materials"}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2] transition">
            {showForm ? "Cancel" : "+ Add Resource"}
          </button>
        )}
      </div>

      {/* Search + Course Filter */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by title..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-white focus:ring-2 focus:ring-[#0EA5B8] focus:border-indigo-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400">✕</button>
            )}
          </div>
          {batches.length > 1 && (
            <>
              <label className="text-sm font-medium text-slate-300">Course:</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm text-white min-w-[250px]"
              >
                <option value="all">All Courses ({resources.length} resources)</option>
                {batches.map((b) => {
                  const count = resources.filter(r => r.batchId === b.id).length;
                  return (
                    <option key={b.id} value={b.id}>{b.program.title} — {b.name} ({count})</option>
                  );
                })}
              </select>
              {selectedBatchId !== "all" && (
                <button onClick={() => setSelectedBatchId("all")} className="text-xs text-[#22d3ee] hover:text-[#0EA5B8] font-medium">
                  Clear Filter
                </button>
              )}
            </>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-slate-500 mt-2">Found {filteredResources.length} result(s) for &quot;{searchQuery}&quot;</p>
        )}
      </div>

      {/* Info Banner for Students */}
      {isStudent && (
        <div className="bg-transparent border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <strong>Note:</strong> Materials are unlocked day by day based on your working days. You cannot skip ahead — just like coming to office daily. If you were on leave, you will see the missed materials but your task will be for your current working day.
        </div>
      )}

      {/* Add Resource Form (Admin/TeamLeader) */}
      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Resource</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Batch</label>
              <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.program.title} - {b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Day Number</label>
              <input type="number" min="1" value={form.dayNumber} onChange={(e) => setForm({ ...form, dayNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 1, 2, 3..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                <option value="video">Video (Pre-recorded)</option>
                <option value="pdf">PDF Document</option>
                <option value="link">External Link</option>
                <option value="document">Document</option>
                <option value="image">Image / Photo</option>
                <option value="word">Word Document</option>
                <option value="excel">Excel / Spreadsheet</option>
                <option value="ppt">PowerPoint / PPT</option>
                <option value="file">Other File (any format)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">URL / File Link</label>
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="YouTube/Drive/Dropbox link, or any file URL" required />
              <div className="flex items-center gap-3 mt-2">
                <label className="text-xs text-[#22d3ee] hover:text-[#0EA5B8] cursor-pointer font-medium border border-[#0EA5B8]/20 rounded-lg px-3 py-1.5 inline-block">
                  {fileUploading ? "Uploading..." : "Or Upload File"}
                  <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setFileUploading(true);
                    const fd = new FormData(); fd.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    if (res.ok) {
                      const d = await res.json();
                      setForm({...form, fileUrl: d.url, url: d.url});
                    }
                    setFileUploading(false);
                  }} />
                </label>
                {form.fileUrl && <span className="text-xs text-emerald-400">File uploaded: {form.fileUrl}</span>}
              </div>
            </div>
          </div>
          <button type="submit" className="mt-4 bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2] transition">Add Resource</button>
        </form>
      )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-white mb-4">Edit Resource</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="link">Link</option>
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="word">Word</option>
                    <option value="excel">Excel</option>
                    <option value="ppt">PPT</option>
                    <option value="file">File</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Day Number</label>
                  <input type="number" min="1" value={editForm.dayNumber} onChange={(e) => setEditForm({ ...editForm, dayNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">URL</label>
                <input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Batch</label>
                <select value={editForm.batchId} onChange={(e) => setEditForm({ ...editForm, batchId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.program.title} — {b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEdit} className="flex-1 px-4 py-2 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2] font-medium">Save Changes</button>
              <button onClick={() => setEditingResource(null)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {filteredResources.length === 0 ? (
        <>
          {isStudent && <PaymentBlockMessage feature="Study Material" />}
          {!isStudent && (
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 border text-center">
              <p className="text-4xl mb-4">🎥</p>
              <p className="text-slate-400">No resources yet. Add pre-recorded videos and study materials.</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {/* Day-based Resources */}
          {sortedDays.map((dayLabel) => (
            <div key={dayLabel} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border overflow-hidden">
              <div className="bg-transparent px-6 py-3 border-b flex items-center justify-between">
                <h2 className="text-base font-semibold text-indigo-900">{dayLabel}</h2>
                <span className="text-xs text-[#22d3ee]">{dayGroups[dayLabel].length} item(s)</span>
              </div>
              <div className="divide-y">
                {dayGroups[dayLabel].map((resource) => (
                  <ResourceRow key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          ))}

          {/* General Resources (no day number) */}
          {generalResources.length > 0 && (
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border overflow-hidden">
              <div className="bg-transparent px-6 py-3 border-b">
                <h2 className="text-base font-semibold text-slate-300">General Resources</h2>
              </div>
              <div className="divide-y">
                {generalResources.map((resource) => (
                  <ResourceRow key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
