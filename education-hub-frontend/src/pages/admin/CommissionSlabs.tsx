import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, X } from "lucide-react";

export default function AdminCommissionSlabs() {
  const [slabs, setSlabs] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterUni, setFilterUni] = useState("");

  const fetchSlabs = useCallback(() => {
    setLoading(true);
    api.get("/api/centers/commission-slabs", { params: filterUni ? { university_id: filterUni } : {} })
      .then(r => setSlabs(r.data.slabs || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterUni]);

  useEffect(() => { fetchSlabs(); }, [fetchSlabs]);

  useEffect(() => {
    api.get("/api/universities").then(r => setUniversities(r.data.universities || r.data || [])).catch(() => {});
  }, []);

  const loadCategories = (uniId: number) => {
    api.get("/api/categories", { params: { university_id: uniId } }).then(r => setCategories(r.data.categories || r.data || [])).catch(() => {});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/centers/commission-slabs/${editId}`, form);
      } else {
        await api.post("/api/centers/commission-slabs", form);
      }
      setShowAdd(false);
      setEditId(null);
      setForm({});
      fetchSlabs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error saving slab");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this commission slab?")) return;
    try {
      await api.delete(`/api/centers/commission-slabs/${id}`);
      fetchSlabs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error deleting slab");
    }
  };

  const openEdit = (s: any) => {
    setForm({
      university_id: s.university_id,
      category_id: s.category_id,
      min_students: s.min_students,
      max_students: s.max_students,
      commission_amount: s.commission_amount,
      commission_type: s.commission_type || "fixed",
      level: s.level || "center",
    });
    if (s.university_id) loadCategories(s.university_id);
    setEditId(s.id);
    setShowAdd(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Commission Slabs</h1>
          <p className="text-sm text-gray-500">Configure commission tiers for centers</p>
        </div>
        <button onClick={() => { setForm({ commission_type: "fixed", level: "center" }); setEditId(null); setShowAdd(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Slab
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex gap-3">
          <select value={filterUni} onChange={e => setFilterUni(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Universities</option>
            {universities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">University</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Course</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Min Students</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Max Students</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Commission</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : slabs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No commission slabs configured</td></tr>
            ) : slabs.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">{s.university_name || "-"}</td>
                <td className="px-4 py-3 text-xs">{s.category_name || "All Courses"}</td>
                <td className="px-4 py-3">{s.min_students}</td>
                <td className="px-4 py-3">{s.max_students || "Unlimited"}</td>
                <td className="px-4 py-3 font-medium text-emerald-600">
                  {s.commission_type === "percentage" ? `${s.commission_amount}%` : `₹${(s.commission_amount || 0).toLocaleString()}`}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.commission_type === "fixed" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {s.commission_type || "fixed"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.level === "center" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {s.level === "center" ? "Center" : "Sub-center"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editId ? "Edit Slab" : "Add Commission Slab"}</h2>
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                <select value={form.university_id || ""} onChange={e => { setForm(f => ({ ...f, university_id: parseInt(e.target.value) })); loadCategories(parseInt(e.target.value)); }}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select University</option>
                  {universities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course (optional)</label>
                <select value={form.category_id || ""} onChange={e => setForm(f => ({ ...f, category_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Courses</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Students *</label>
                <input type="number" value={form.min_students || ""} onChange={e => setForm(f => ({ ...f, min_students: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                <input type="number" value={form.max_students || ""} onChange={e => setForm(f => ({ ...f, max_students: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Leave empty for unlimited" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount *</label>
                <input type="number" value={form.commission_amount || ""} onChange={e => setForm(f => ({ ...f, commission_amount: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Amount per student" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                <select value={form.commission_type || "fixed"} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="fixed">Fixed (per student)</option>
                  <option value="percentage">Percentage</option>
                  <option value="variable">Variable (NIOS)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select value={form.level || "center"} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="center">Center</option>
                  <option value="sub_center">Sub-center</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.university_id || !form.commission_amount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700">
                {saving ? "Saving..." : editId ? "Update Slab" : "Create Slab"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
