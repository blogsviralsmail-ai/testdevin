import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Bell, Plus, Edit2, Trash2, X, Eye, EyeOff, MessageSquare } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

interface Popup {
  id: number;
  title: string;
  content: string;
  popup_type: string;
  target_audience: string;
  image_url: string;
  link_url: string;
  link_text: string;
  is_active: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

const TARGET_OPTIONS = [
  { value: "all", label: "All Users (Students + Centers)" },
  { value: "students", label: "All Students" },
  { value: "self_students", label: "Direct/Self Students Only" },
  { value: "center_students", label: "Center Students Only" },
  { value: "centers", label: "All Centers" },
  { value: "all_centers", label: "Parent Centers Only" },
  { value: "sub_centers", label: "Sub-Centers Only" },
];

const TYPE_OPTIONS = [
  { value: "info", label: "Info", color: "bg-blue-100 text-blue-700" },
  { value: "warning", label: "Warning", color: "bg-amber-100 text-amber-700" },
  { value: "success", label: "Success", color: "bg-green-100 text-green-700" },
  { value: "promo", label: "Promotion", color: "bg-purple-100 text-purple-700" },
];

const emptyForm = {
  title: "", content: "", popup_type: "info", target_audience: "all",
  image_url: "", link_url: "", link_text: "", is_active: 1,
  start_date: "", end_date: "",
};

export default function AdminPopups() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try { const r = await api.get("/api/popups"); setPopups(r.data); } catch {} finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(p: Popup) {
    setEditing(p);
    setForm({
      title: p.title, content: p.content, popup_type: p.popup_type,
      target_audience: p.target_audience, image_url: p.image_url || "",
      link_url: p.link_url || "", link_text: p.link_text || "",
      is_active: p.is_active, start_date: p.start_date || "", end_date: p.end_date || "",
    });
    setShowForm(true);
  }

  async function save() {
    try {
      if (editing) { await api.put("/api/popups/" + editing.id, form); }
      else { await api.post("/api/popups", form); }
      setShowForm(false); load();
    } catch {}
  }

  async function del(id: number) {
    if (!confirm("Delete this pop-up?")) return;
    try { await api.delete("/api/popups/" + id); load(); } catch {}
  }

  async function toggleActive(p: Popup) {
    try {
      await api.put("/api/popups/" + p.id, { ...p, is_active: p.is_active ? 0 : 1 });
      load();
    } catch {}
  }

  const filtered = popups.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.content?.toLowerCase().includes(search.toLowerCase())
  );

  const getTargetLabel = (v: string) => TARGET_OPTIONS.find(t => t.value === v)?.label || v;
  const getTypeStyle = (v: string) => TYPE_OPTIONS.find(t => t.value === v)?.color || "bg-gray-100 text-gray-700";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Pop-up Notifications</h1>
          <span className="text-sm text-gray-500">({popups.length})</span>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Plus className="h-4 w-4" /> Create Pop-up
        </button>
      </div>

      <div className="mb-4 relative">
        <Bell className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pop-ups..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className={`bg-white rounded-xl border p-4 ${p.is_active ? "border-purple-200" : "border-gray-200 opacity-60"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeStyle(p.popup_type)}`}>{p.popup_type}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{getTargetLabel(p.target_audience)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.content}</p>
                {p.image_url && <img src={p.image_url.startsWith("/") ? API + p.image_url : p.image_url} alt="" className="mt-2 h-20 rounded-lg object-cover" />}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>Created: {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  {p.start_date && <span>From: {p.start_date}</span>}
                  {p.end_date && <span>Until: {p.end_date}</span>}
                  {p.link_url && <a href={p.link_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{p.link_text || "Link"}</a>}
                </div>
              </div>
              <div className="flex gap-1 ml-4">
                <button onClick={() => toggleActive(p)} title={p.is_active ? "Deactivate" : "Activate"} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
                  {p.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => del(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No pop-ups found. Create one to send notifications!</div>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editing ? "Edit Pop-up" : "New Pop-up"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Pop-up title" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Pop-up message content" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={form.popup_type} onChange={e => setForm({...form, popup_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Audience *</label>
                  <select value={form.target_audience} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {TARGET_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-semibold mb-1">Target Audience Guide:</p>
                <ul className="space-y-0.5 list-disc pl-4">
                  <li><strong>All Users</strong> - Everyone sees this pop-up</li>
                  <li><strong>All Students</strong> - Both direct and center students</li>
                  <li><strong>Direct/Self Students</strong> - Only students admitted directly (not via center)</li>
                  <li><strong>Center Students</strong> - Only students admitted through a center</li>
                  <li><strong>All Centers</strong> - All center panel users</li>
                  <li><strong>Parent Centers</strong> - Only parent/main centers</li>
                  <li><strong>Sub-Centers</strong> - Only sub-center panels</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
                <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Link URL (optional)</label>
                  <input value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Link Text</label>
                  <input value={form.link_text} onChange={e => setForm({...form, link_text: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Click here" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date (optional)</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date (optional)</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active === 1} onChange={e => setForm({...form, is_active: e.target.checked ? 1 : 0})} className="h-4 w-4" />
                <label className="text-sm">Active (show to users)</label>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={save} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                {editing ? "Update" : "Create Pop-up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
