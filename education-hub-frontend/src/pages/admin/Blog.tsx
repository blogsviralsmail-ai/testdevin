import { useState, useEffect } from "react";
import { FileText, Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import api from "../../lib/api";

const API = import.meta.env.VITE_API_URL || "";

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", image: "", category: "General", author: "Admin", status: "published" });
  const [uploading, setUploading] = useState(false);

  const load = () => { api.get("/api/blog").then(r => setPosts(r.data || [])).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const imgSrc = (p: string) => { if (!p) return ""; if (p.startsWith("http")) return p; return API + p; };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const res = await api.post("/api/blog/upload-image", fd); setForm(f => ({ ...f, image: res.data.url || "" })); } catch { /* */ }
    setUploading(false);
  };

  const save = async () => {
    if (!form.title) return;
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const payload = { ...form, slug };
    if (editing) { await api.put(`/api/blog/${editing.id}`, payload); }
    else { await api.post("/api/blog", payload); }
    setShowForm(false); setEditing(null); setForm({ title: "", slug: "", content: "", excerpt: "", image: "", category: "General", author: "Admin", status: "published" }); load();
  };

  const del = async (id: number) => { if (confirm("Delete?")) { await api.delete(`/api/blog/${id}`); load(); } };
  const edit = (p: any) => { setForm({ title: p.title, slug: p.slug, content: p.content || "", excerpt: p.excerpt || "", image: p.image || "", category: p.category, author: p.author, status: p.status }); setEditing(p); setShowForm(true); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="h-7 w-7 text-indigo-600" /> Blog Posts ({posts.length})</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", slug: "", content: "", excerpt: "", image: "", category: "General", author: "Admin", status: "published" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"><Plus className="h-4 w-4" /> New Post</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">{editing ? "Edit Post" : "New Post"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Post Title *" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Slug (auto-generated)" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Short Excerpt" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Full Content (HTML supported)" rows={8} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div>
                <label className="block text-xs font-medium mb-1">Featured Image</label>
                <div className="flex items-center gap-3 mb-2">
                  {form.image && <img src={imgSrc(form.image)} alt="" className="h-16 w-24 rounded object-cover border" />}
                  <label className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 text-xs font-medium">
                    <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload"} <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Or paste URL" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option>General</option><option>Education</option><option>Admissions</option><option>University News</option><option>Career</option><option>Tips</option>
                </select>
                <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author" className="px-3 py-2 border rounded-lg text-sm" />
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="published">Published</option><option value="draft">Draft</option>
                </select>
              </div>
              <button onClick={save} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">{editing ? "Update" : "Publish"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {p.image && <img src={imgSrc(p.image)} alt={p.title} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">{p.category}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{p.title}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.excerpt || p.content?.substring(0, 100)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{p.author} | {p.created_at?.split("T")[0] || p.created_at?.split(" ")[0]}</span>
                <div className="flex gap-1">
                  <button onClick={() => edit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No blog posts yet. Create your first post!</div>}
      </div>
    </div>
  );
}
