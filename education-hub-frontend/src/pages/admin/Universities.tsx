import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Pencil, Trash2, X, Building2, Search, Upload } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface University {
  id: number; name: string; code: string; description: string; website: string; address: string; logo: string; status: string;
}

export default function AdminUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "", website: "", address: "", logo: "" });
  const [uploading, setUploading] = useState(false);

  const load = () => api.get("/api/universities").then((r) => setUniversities((r.data || []).reverse()));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) {
      await api.put(`/api/universities/${editing.id}`, form);
    } else {
      await api.post("/api/universities", form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", code: "", description: "", website: "", address: "", logo: "" });
    load();
  };

  const handleEdit = (u: University) => {
    setEditing(u);
    setForm({ name: u.name, code: u.code, description: u.description || "", website: u.website || "", address: u.address || "", logo: u.logo || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this university?")) {
      await api.delete(`/api/universities/${id}`);
      load();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, universityId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (universityId) {
        const res = await api.post(`/api/universities/${universityId}/upload-logo`, fd);
        setForm(f => ({ ...f, logo: res.data.url }));
        load();
      } else {
        const res = await api.post("/api/students/upload-photo", fd);
        setForm(f => ({ ...f, logo: res.data.url }));
      }
    } catch { /* empty */ }
    setUploading(false);
  };

  const logoSrc = (logo: string) => {
    if (!logo) return "";
    if (logo.startsWith("http")) return logo;
    return API + logo;
  };

  const filtered = universities.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || (u.code || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Universities</h1>
        <button onClick={() => { setEditing(null); setForm({ name: "", code: "", description: "", website: "", address: "", logo: "" }); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add University
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search universities..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {u.logo ? (
                  <img src={logoSrc(u.logo)} alt={u.name} className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{u.name}</h3>
                  <p className="text-sm text-gray-500">{u.code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <label className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded cursor-pointer" title="Upload Logo">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, u.id)} />
                </label>
                <button onClick={() => handleEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {u.description && <p className="mt-3 text-sm text-gray-600 line-clamp-2">{u.description}</p>}
            {u.website && <a href={u.website} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm text-blue-600 hover:underline block">{u.website}</a>}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? "Edit University" : "Add University"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <div className="flex items-center gap-4">
                  {form.logo ? (
                    <img src={logoSrc(form.logo)} alt="Logo" className="h-16 w-16 rounded-lg object-cover border border-gray-200" />
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 text-sm w-fit">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Image"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, editing?.id)} disabled={uploading} />
                    </label>
                    <input type="text" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="Or paste URL..." className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm mt-1" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="text" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">
                {editing ? "Update" : "Create"} University
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
