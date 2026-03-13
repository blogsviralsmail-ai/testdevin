import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { Building2, Plus, Edit2, Eye, X, Search, Users, Trash2, ToggleLeft, ToggleRight, Key } from "lucide-react";

export default function AdminCenters() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [allCenters, setAllCenters] = useState<any[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchCenters = useCallback(() => {
    setLoading(true);
    api.get("/api/centers")
      .then(r => {
        const list = r.data.centers || r.data || [];
        setCenters(list);
        setAllCenters(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/centers/${editId}`, form);
      } else {
        await api.post("/api/centers", form);
      }
      setShowAdd(false);
      setEditId(null);
      setForm({});
      fetchCenters();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error saving center");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this center?")) return;
    try {
      await api.delete(`/api/centers/${id}`);
      fetchCenters();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error deleting center");
    }
  };

  const handleChangePassword = async (centerId: number) => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      await api.put(`/api/centers/${centerId}/password`, { password: newPassword });
      alert("Password changed successfully!");
      setShowPasswordModal(null);
      setNewPassword("");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error changing password");
    }
  };

  const toggleStatus = async (center: any) => {
    try {
      await api.put(`/api/centers/${center.id}`, {
        status: center.status === "active" ? "inactive" : "active"
      });
      fetchCenters();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error updating status");
    }
  };

  const openEdit = (c: any) => {
    setForm({
      name: c.name, mobile: c.mobile, owner_name: c.owner_name, email: c.email,
      address: c.address, city: c.city, state: c.state, parent_center_id: c.parent_center_id
    });
    setEditId(c.id);
    setShowAdd(true);
  };

  const filtered = centers.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile?.includes(search) ||
      c.owner_name?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = !filterLevel || c.level === filterLevel;
    return matchSearch && matchLevel;
  });

  const parentCenters = allCenters.filter(c => c.level === "center");

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Centers Management</h1>
          <p className="text-sm text-gray-500">Manage centers and sub-centers network</p>
        </div>
        <button onClick={() => { setForm({ password: "Center@123" }); setEditId(null); setShowAdd(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Center
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by name, mobile, owner..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Levels</option>
          <option value="center">Centers</option>
          <option value="sub_center">Sub-centers</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Center Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mobile</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Owner</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Parent</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Students</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">No centers found</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{c.mobile}</td>
                <td className="px-4 py-3">{c.owner_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.level === "center" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {c.level === "center" ? "Center" : "Sub-center"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {c.parent_center_name || (c.parent_center_id ? `ID: ${c.parent_center_id}` : "-")}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gray-400" />{c.student_count || 0}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(c)} className="flex items-center gap-1">
                    {c.status === "active" ? (
                      <><ToggleRight className="h-5 w-5 text-green-500" /><span className="text-xs text-green-600">Active</span></>
                    ) : (
                      <><ToggleLeft className="h-5 w-5 text-gray-400" /><span className="text-xs text-gray-500">Inactive</span></>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setShowView(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => openEdit(c)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Edit"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => { setShowPasswordModal(c); setNewPassword(""); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Change Password"><Key className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editId ? "Edit Center" : "Add New Center"}</h2>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Center (optional)</label>
                <select value={form.parent_center_id || ""} onChange={e => setForm(f => ({ ...f, parent_center_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">None (Top-level Center)</option>
                  {parentCenters.filter(pc => pc.id !== editId).map(pc => (
                    <option key={pc.id} value={pc.id}>{pc.name} ({pc.mobile})</option>
                  ))}
                </select>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700">
                {saving ? "Saving..." : editId ? "Update Center" : "Create Center"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Center Details</h2>
              <button onClick={() => setShowView(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                ["ID", showView.id],
                ["Name", showView.name],
                ["Mobile", showView.mobile],
                ["Owner", showView.owner_name],
                ["Email", showView.email],
                ["Level", showView.level === "center" ? "Center" : "Sub-center"],
                ["Parent", showView.parent_center_name || "-"],
                ["Address", showView.address],
                ["City", showView.city],
                ["State", showView.state],
                ["Status", showView.status],
                ["Students", showView.student_count || 0],
                ["Created", showView.created_at ? new Date(showView.created_at).toLocaleDateString() : ""],
              ].filter(([, v]) => v !== null && v !== undefined && v !== "").map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-800">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Change Password</h2>
              <button onClick={() => setShowPasswordModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Center: <strong>{showPasswordModal.name}</strong> ({showPasswordModal.mobile})</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPasswordModal(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={() => handleChangePassword(showPasswordModal.id)} disabled={!newPassword || newPassword.length < 6}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-amber-700">
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
