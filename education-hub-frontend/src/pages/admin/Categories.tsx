import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Pencil, Trash2, X, Search, FolderOpen } from "lucide-react";

interface Category {
  id: number; name: string; slug: string; description: string; eligibility: string;
  duration: string; fee: string; mode: string; university_id: number; university_name: string; status: string;
}
interface University { id: number; name: string; }

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState("");
  const [filterUni, setFilterUni] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", eligibility: "", duration: "", fee: "", mode: "Online", university_id: "" });

  const load = () => {
    let url = "/api/categories?";
    if (filterUni) url += `university_id=${filterUni}&`;
    if (filterMode) url += `mode=${filterMode}&`;
    api.get(url).then((r) => setCategories((r.data || []).reverse()));
  };

  useEffect(() => { load(); }, [filterUni, filterMode]);
  useEffect(() => { api.get("/api/universities").then((r) => setUniversities(r.data)); }, []);

  const handleSave = async () => {
    const payload = { ...form, university_id: form.university_id ? parseInt(form.university_id) : null };
    if (editing) {
      await api.put(`/api/categories/${editing.id}`, payload);
    } else {
      await api.post("/api/categories", payload);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || "", eligibility: c.eligibility || "", duration: c.duration || "", fee: c.fee || "", mode: c.mode || "Online", university_id: c.university_id?.toString() || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this category?")) { await api.delete(`/api/categories/${id}`); load(); }
  };

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories / Courses</h1>
        <button onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "", eligibility: "", duration: "", fee: "", mode: "Online", university_id: "" }); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={filterUni} onChange={(e) => setFilterUni(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Universities</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Modes</option>
          <option value="Online">Online</option>
          <option value="Regular">Regular</option>
          <option value="Distance">Distance</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Course</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">University</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Duration</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Fee</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Mode</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-purple-100 rounded-lg flex items-center justify-center"><FolderOpen className="h-4 w-4 text-purple-600" /></div>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{c.university_name || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{c.duration || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{c.fee || "—"}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${c.mode === "Online" ? "bg-blue-100 text-blue-700" : c.mode === "Regular" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{c.mode}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-gray-500">No categories found</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? "Edit" : "Add"} Category</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Slug</label><input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <select value={form.university_id} onChange={(e) => setForm({ ...form, university_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select University</option>
                  {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Online">Online</option><option value="Regular">Regular</option><option value="Distance">Distance</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration</label><input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 36 months" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fee</label><input type="text" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. INR 1,80,000" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label><textarea value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} /></div>
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">{editing ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
