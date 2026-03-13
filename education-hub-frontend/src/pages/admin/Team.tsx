import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Pencil, Trash2, X, Users, Upload } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface TeamMember {
  id: number;
  name: string;
  position: string;
  role_type: string;
  photo: string;
  bio: string;
  email: string;
  phone: string;
  linkedin: string;
  display_order: number;
  status: string;
}

const emptyForm = { name: "", position: "", role_type: "staff", photo: "", bio: "", email: "", phone: "", linkedin: "", display_order: 99 };

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = () => {
    api.get("/api/team").then((r) => { setMembers(r.data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({ name: m.name, position: m.position, role_type: m.role_type, photo: m.photo || "", bio: m.bio || "", email: m.email || "", phone: m.phone || "", linkedin: m.linkedin || "", display_order: m.display_order || 99 });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this team member?")) return;
    await api.delete(`/api/team/${id}`);
    load();
  };

  const handleSave = async () => {
    if (editing) {
      await api.put(`/api/team/${editing.id}`, form);
    } else {
      await api.post("/api/team", form);
    }
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    load();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/students/upload-photo", fd);
      setForm(f => ({ ...f, photo: res.data.url || "" }));
    } catch { /* empty */ }
    setUploadingPhoto(false);
  };

  const photoSrc = (p: string) => {
    if (!p) return "https://via.placeholder.com/80";
    if (p.startsWith("http")) return p;
    return API + p;
  };

  const directors = members.filter((m) => m.role_type === "director");
  const staff = members.filter((m) => m.role_type === "staff");

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="h-6 w-6 text-blue-600" /> Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">{members.length} team members ({directors.length} directors, {staff.length} staff)</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }} className="btn-3d btn-3d-blue flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {/* Directors */}
      {directors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Directors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {directors.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <img src={photoSrc(m.photo)} alt={m.name} className="h-16 w-16 rounded-full object-cover border-2 border-indigo-200" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{m.name}</h3>
                  <p className="text-sm text-indigo-600 font-medium">{m.position}</p>
                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff */}
      {staff.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <img src={photoSrc(m.photo)} alt={m.name} className="h-12 w-12 rounded-full object-cover border border-gray-200" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{m.name}</h3>
                  <p className="text-xs text-blue-600 font-medium">{m.position}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editing ? "Edit" : "Add"} Team Member</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Position *</label>
                <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role Type</label>
                  <select value={form.role_type} onChange={(e) => setForm({ ...form, role_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="director">Director</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 99 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Photo</label>
                <div className="flex items-center gap-3 mb-2">
                  {form.photo && <img src={photoSrc(form.photo)} alt="Preview" className="h-12 w-12 rounded-full object-cover border" />}
                  <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 text-xs font-medium">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  </label>
                </div>
                <input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Or paste URL: https://..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="https://linkedin.com/in/..." />
              </div>
              <button onClick={handleSave} className="btn-3d btn-3d-blue w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold">{editing ? "Update" : "Add"} Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
