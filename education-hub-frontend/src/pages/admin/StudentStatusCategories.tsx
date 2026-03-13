import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, Loader2, Tag, X, Check } from "lucide-react";

interface StatusCategory {
  id: number;
  name: string;
  color: string;
  description: string;
  display_order: number;
}

export default function StudentStatusCategories() {
  const [categories, setCategories] = useState<StatusCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StatusCategory | null>(null);
  const [form, setForm] = useState({ name: "", color: "#6B7280", description: "", display_order: 99 });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get("/api/student-status");
      setCategories(res.data);
    } catch { /* empty */ }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/student-status/${editing.id}`, form);
      } else {
        await api.post("/api/student-status", form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", color: "#6B7280", description: "", display_order: 99 });
      loadData();
    } catch { /* empty */ }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this status category?")) return;
    await api.delete(`/api/student-status/${id}`);
    loadData();
  }

  async function handleBulkDelete() {
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} categories?`)) return;
    await api.delete("/api/student-status/bulk", { data: { ids: selectedIds } });
    setSelectedIds([]);
    loadData();
  }

  function startEdit(cat: StatusCategory) {
    setEditing(cat);
    setForm({ name: cat.name, color: cat.color, description: cat.description, display_order: cat.display_order });
    setShowForm(true);
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function toggleAll() {
    setSelectedIds(prev => prev.length === categories.length ? [] : categories.map(c => c.id));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Tag className="h-6 w-6" /> Student Status Categories</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", color: "#6B7280", description: "", display_order: 99 }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{editing ? "Edit" : "Add"} Status Category</h2>
            <button onClick={() => { setShowForm(false); setEditing(null); }}><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-10 w-14 rounded cursor-pointer" />
                <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Check className="h-4 w-4" /> {editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedIds.length === categories.length && categories.length > 0} onChange={toggleAll} /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={() => toggleSelect(cat.id)} /></td>
                <td className="px-4 py-3"><div className="h-6 w-6 rounded-full" style={{ backgroundColor: cat.color }} /></td>
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{cat.description}</td>
                <td className="px-4 py-3 text-sm">{cat.display_order}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(cat)} className="p-1 text-blue-600 hover:text-blue-800"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No status categories found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
