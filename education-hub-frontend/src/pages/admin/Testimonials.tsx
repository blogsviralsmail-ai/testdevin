import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, X, Star, MessageSquare, Upload } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Testimonial {
  id: number; name: string; course: string; university: string;
  text: string; rating: number; photo: string; status: string; display_order: number;
}

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", course: "", university: "", text: "", rating: "5", photo: "", status: "active", display_order: "99" });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = () => { api.get("/api/testimonials").then((r) => setItems(r.data)); };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm({ name: "", course: "", university: "", text: "", rating: "5", photo: "", status: "active", display_order: "99" }); setShowForm(true); };
  const openEdit = (t: Testimonial) => {
    setEditId(t.id);
    setForm({ name: t.name, course: t.course || "", university: t.university || "", text: t.text, rating: String(t.rating), photo: t.photo || "", status: t.status, display_order: String(t.display_order) });
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = { ...form, rating: parseInt(form.rating), display_order: parseInt(form.display_order) };
    if (editId) { await api.put(`/api/testimonials/${editId}`, payload); }
    else { await api.post("/api/testimonials", payload); }
    setShowForm(false); load();
  };

  const handleDelete = async (id: number) => { if (confirm("Delete this testimonial?")) { await api.delete(`/api/testimonials/${id}`); load(); } };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, tid?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      if (tid) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post(`/api/testimonials/${tid}/upload-photo`, fd);
        setForm(f => ({ ...f, photo: res.data.url }));
        load();
      } else {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post("/api/students/upload-photo", fd);
        setForm(f => ({ ...f, photo: res.data.url }));
      }
    } catch { /* empty */ }
    setUploadingPhoto(false);
  };

  const photoSrc = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    return API + p;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="h-6 w-6 text-orange-600" /> Testimonials ({items.length})</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {t.photo ? (
                  <img src={photoSrc(t.photo)} alt={t.name} className="h-12 w-12 rounded-full object-cover border-2 border-blue-100" />
                ) : (
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.name?.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.course} - {t.university}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{t.status}</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className={`h-3.5 w-3.5 ${j < t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
              ))}
            </div>
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">{t.text}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">Order: {t.display_order}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && <div className="text-center py-12 text-gray-500">No testimonials yet. Click "Add Testimonial" to create one.</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editId ? "Edit" : "Add"} Testimonial</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Text *</label>
                <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                <div className="flex items-center gap-3">
                  {form.photo ? (
                    <img src={photoSrc(form.photo)} alt="Preview" className="h-14 w-14 rounded-full object-cover border-2 border-blue-100" />
                  ) : (
                    <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs">No photo</div>
                  )}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 text-sm w-fit">
                      <Upload className="h-4 w-4" />
                      {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, editId || undefined)} disabled={uploadingPhoto} />
                    </label>
                    <input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="Or paste URL..." className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs mt-1" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
                    {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                </div>
              </div>
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 text-sm mt-2">
                {editId ? "Update" : "Add"} Testimonial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
