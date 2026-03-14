import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Bell, Plus, Edit2, Trash2, Pin, Search, X } from "lucide-react";

interface Notice {
  id: number; title: string; content: string; category: string; priority: string;
  is_pinned: number; status: string; attachment_url: string; created_at: string;
}

const CATEGORIES = ["General", "Academic", "Exam", "Fee", "Holiday", "Event", "Placement", "Other"];
const PRIORITIES = ["normal", "important", "urgent"];

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "", category: "General", priority: "normal", is_pinned: 0, status: "published", attachment_url: "", target_audience: "all" });

  useEffect(() => { load(); }, []);

  async function load() {
    try { const r = await api.get("/api/notices"); setNotices(r.data); } catch {} finally { setLoading(false); }
  }

  function openEdit(n: Notice) {
    setEditing(n);
    setForm({ title: n.title, content: n.content, category: n.category, priority: n.priority, is_pinned: n.is_pinned, status: n.status, attachment_url: n.attachment_url || "", target_audience: (n as any).target_audience || "all" });
    setShowForm(true);
  }

  function openNew() {
    setEditing(null);
    setForm({ title: "", content: "", category: "General", priority: "normal", is_pinned: 0, status: "published", attachment_url: "", target_audience: "all" });
    setShowForm(true);
  }

  async function save() {
    try {
      if (editing) { await api.put("/api/notices/" + editing.id, form); }
      else { await api.post("/api/notices", form); }
      setShowForm(false); load();
    } catch {}
  }

  async function del(id: number) {
    if (!confirm("Delete this notice?")) return;
    try { await api.delete("/api/notices/" + id); load(); } catch {}
  }

  const filtered = notices.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase()));

  const priorityColor = (p: string) => p === "urgent" ? "bg-red-100 text-red-700" : p === "important" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Notice Board</h1>
          <span className="text-sm text-gray-500">({notices.length})</span>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Notice
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notices..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      <div className="space-y-3">
        {filtered.map(n => (
          <div key={n.id} className={`bg-white rounded-xl border p-4 ${n.is_pinned ? "border-blue-300 bg-blue-50/30" : "border-gray-200"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {n.is_pinned ? <Pin className="h-4 w-4 text-blue-500" /> : null}
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(n.priority)}`}>{n.priority}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{n.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${n.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{n.status}</span>
                  {(n as any).target_audience && (n as any).target_audience !== "all" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      Target: {(n as any).target_audience === "centers" ? "All Centers" : (n as any).target_audience}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.content}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => openEdit(n)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => del(n.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No notices found</div>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editing ? "Edit Notice" : "New Notice"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={5} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={form.is_pinned === 1} onChange={e => setForm({...form, is_pinned: e.target.checked ? 1 : 0})} className="h-4 w-4" />
                  <label className="text-sm">Pin to top</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Audience</label>
                <select value={form.target_audience} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="all">All (Students + Centers)</option>
                  <option value="centers">All Centers Only</option>
                  <option value="students">Students Only</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Choose who should see this notice</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Attachment URL (optional)</label>
                <input value={form.attachment_url} onChange={e => setForm({...form, attachment_url: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                {editing ? "Update" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
