import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Pencil, Trash2, X, GitBranch } from "lucide-react";

interface Branch {
  id: number; name: string; code: string; address: string; contact: string;
  email: string; share_percentage: number; status: string;
}

export default function AdminBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: "", code: "", address: "", contact: "", email: "", share_percentage: "0" });

  const load = () => api.get("/api/branches").then((r) => setBranches(r.data));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const payload = { ...form, share_percentage: parseFloat(form.share_percentage) };
    if (editing) {
      await api.put(`/api/branches/${editing.id}`, payload);
    } else {
      await api.post("/api/branches", payload);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleEdit = (b: Branch) => {
    setEditing(b);
    setForm({ name: b.name, code: b.code, address: b.address || "", contact: b.contact || "", email: b.email || "", share_percentage: b.share_percentage?.toString() || "0" });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete?")) { await api.delete(`/api/branches/${id}`); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Branches</h1>
        <button onClick={() => { setEditing(null); setForm({ name: "", code: "", address: "", contact: "", email: "", share_percentage: "0" }); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center"><GitBranch className="h-6 w-6 text-green-600" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{b.name}</h3>
                  <p className="text-sm text-gray-500">{b.code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(b)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              {b.address && <p>{b.address}</p>}
              {b.contact && <p>{b.contact}</p>}
              {b.email && <p>{b.email}</p>}
            </div>
            <div className="mt-3 bg-blue-50 rounded-lg px-3 py-2">
              <p className="text-sm text-blue-700">Share: <span className="font-bold">{b.share_percentage}%</span></p>
            </div>
          </div>
        ))}
      </div>
      {branches.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-500 border">No branches found</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? "Edit" : "Add"} Branch</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Code *</label><input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact</label><input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Share Percentage (%)</label><input type="number" value={form.share_percentage} onChange={(e) => setForm({ ...form, share_percentage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" min="0" max="100" /></div>
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">{editing ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
