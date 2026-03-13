import { useState, useEffect, useCallback } from "react";
import api, { getUser } from "../../lib/api";
import { Building2, Plus, Edit2, Eye, X, Search, Users } from "lucide-react";

export default function CenterSubCenters() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const user = getUser();
  const centerId = user?.center?.id;

  const fetchCenters = useCallback(() => {
    if (!centerId) return;
    setLoading(true);
    api.get("/api/centers", { params: { parent_center_id: centerId } })
      .then(r => setCenters((r.data.centers || []).filter((c: any) => c.id !== centerId)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [centerId]);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/centers/${editId}`, form);
      } else {
        await api.post("/api/centers", { ...form, parent_center_id: centerId });
      }
      setShowAdd(false);
      setEditId(null);
      setForm({});
      fetchCenters();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error saving sub-center");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: any) => {
    setForm({ name: c.name, mobile: c.mobile, owner_name: c.owner_name, email: c.email, address: c.address, city: c.city, state: c.state });
    setEditId(c.id);
    setShowAdd(true);
  };

  const filtered = centers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.mobile?.includes(search) || c.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sub-centers</h1>
          <p className="text-sm text-gray-500">Manage your sub-center network</p>
        </div>
        <button onClick={() => { setForm({}); setEditId(null); setShowAdd(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Sub-center
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search sub-centers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No sub-centers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2.5 rounded-lg">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{c.name}</h3>
                    <p className="text-xs text-gray-500">{c.mobile}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {c.status}
                </span>
              </div>
              <div className="space-y-1 text-sm mb-3">
                <p className="text-gray-600"><span className="text-gray-400">Owner:</span> {c.owner_name}</p>
                {c.city && <p className="text-gray-600"><span className="text-gray-400">City:</span> {c.city}</p>}
                <p className="text-gray-600 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gray-400" /> {c.student_count || 0} students</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowView(c)} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center justify-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <button onClick={() => openEdit(c)} className="flex-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 flex items-center justify-center gap-1">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editId ? "Edit Sub-center" : "Add Sub-center"}</h2>
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center Name *</label>
                <input type="text" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile (Login ID) *</label>
                <input type="text" value={form.mobile || ""} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" required disabled={!!editId} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                <input type="text" value={form.owner_name || ""} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={form.address || ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={form.city || ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" value={form.state || ""} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              {!editId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="text" value={form.password || "Center@123"} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <p className="text-xs text-gray-400 mt-0.5">Default: Center@123</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.mobile || !form.owner_name}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700">
                {saving ? "Saving..." : editId ? "Update" : "Create Sub-center"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Sub-center Details</h2>
              <button onClick={() => setShowView(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                ["Name", showView.name],
                ["Mobile", showView.mobile],
                ["Owner", showView.owner_name],
                ["Email", showView.email],
                ["Address", showView.address],
                ["City", showView.city],
                ["State", showView.state],
                ["Status", showView.status],
                ["Students", showView.student_count || 0],
                ["Created", showView.created_at ? new Date(showView.created_at).toLocaleDateString() : ""],
              ].filter(([, v]) => v !== null && v !== undefined && v !== "").map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
