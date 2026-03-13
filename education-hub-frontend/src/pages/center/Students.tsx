import { useState, useEffect, useCallback } from "react";
import api, { getUser } from "../../lib/api";
import { Plus, Search, Eye, Edit2, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function CenterStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCenters, setSubCenters] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const user = getUser();
  const centerId = user?.center?.id;

  const fetchStudents = useCallback(() => {
    if (!centerId) return;
    setLoading(true);
    api.get(`/api/centers/${centerId}/students`, { params: { search, page, limit: 50 } })
      .then(r => { setStudents(r.data.students || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [centerId, search, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    api.get("/api/universities").then(r => setUniversities(r.data.universities || r.data || [])).catch(() => {});
    if (centerId) {
      api.get("/api/centers", { params: { parent_center_id: centerId } })
        .then(r => setSubCenters((r.data.centers || []).filter((c: any) => c.id !== centerId)))
        .catch(() => {});
    }
  }, [centerId]);

  const loadCategories = (uniId: number) => {
    api.get("/api/categories", { params: { university_id: uniId } }).then(r => setCategories(r.data.categories || r.data || [])).catch(() => {});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/students/${editId}`, form);
      } else {
        await api.post("/api/centers/my/students", form);
      }
      setShowAdd(false);
      setEditId(null);
      setForm({});
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error saving student");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s: any) => {
    setForm({ ...s });
    setEditId(s.id);
    if (s.university_id) loadCategories(s.university_id);
    setShowAdd(true);
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-sm text-gray-500">Total: {total} students</p>
        </div>
        <button onClick={() => { setForm({}); setEditId(null); setShowAdd(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by name, phone, enrollment..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Enrollment</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">University</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Course</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Center</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Source</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Fees</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">No students found</td></tr>
            ) : students.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{s.enrollment_no}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.phone}</td>
                <td className="px-4 py-3 text-xs">{s.university_name || "-"}</td>
                <td className="px-4 py-3 text-xs">{s.category_name || "-"}</td>
                <td className="px-4 py-3 text-xs">{s.center_name || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.admission_source === "chain" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                    {s.admission_source || "self"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className="text-green-600 font-medium">₹{(s.deposit || 0).toLocaleString()}</span>
                  {s.total_fees ? <span className="text-gray-400"> / ₹{s.total_fees.toLocaleString()}</span> : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setShowView(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => openEdit(s)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Edit2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editId ? "Edit Student" : "Add New Student"}</h2>
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="text" value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <select value={form.university_id || ""} onChange={e => { setForm(f => ({ ...f, university_id: e.target.value ? parseInt(e.target.value) : null })); if (e.target.value) loadCategories(parseInt(e.target.value)); }}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select University</option>
                  {universities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select value={form.category_id || ""} onChange={e => setForm(f => ({ ...f, category_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select Course</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label>
                <input type="text" value={form.father_name || ""} onChange={e => setForm(f => ({ ...f, father_name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name</label>
                <input type="text" value={form.mother_name || ""} onChange={e => setForm(f => ({ ...f, mother_name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={form.date_of_birth || ""} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={form.gender || ""} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar No</label>
                <input type="text" value={form.aadhar_no || ""} onChange={e => setForm(f => ({ ...f, aadhar_no: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                <input type="text" value={form.session_name || ""} onChange={e => setForm(f => ({ ...f, session_name: e.target.value }))} placeholder="e.g., February-2026" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fees</label>
                <input type="number" value={form.total_fees || ""} onChange={e => setForm(f => ({ ...f, total_fees: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              {subCenters.length > 0 && !editId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Via Sub-center (Chain)</label>
                  <select value={form.sub_center_id || ""} onChange={e => setForm(f => ({ ...f, sub_center_id: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Self (Direct admission)</option>
                    {subCenters.map((sc: any) => <option key={sc.id} value={sc.id}>{sc.name} ({sc.mobile})</option>)}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={form.current_address || ""} onChange={e => setForm(f => ({ ...f, current_address: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={form.current_city || ""} onChange={e => setForm(f => ({ ...f, current_city: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" value={form.current_state || ""} onChange={e => setForm(f => ({ ...f, current_state: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.phone} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700">
                {saving ? "Saving..." : editId ? "Update Student" : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Student Details</h2>
              <button onClick={() => setShowView(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                ["Enrollment", showView.enrollment_no],
                ["Name", showView.name],
                ["Phone", showView.phone],
                ["Email", showView.email],
                ["University", showView.university_name],
                ["Course", showView.category_name],
                ["Father", showView.father_name],
                ["Mother", showView.mother_name],
                ["DOB", showView.date_of_birth],
                ["Gender", showView.gender],
                ["Aadhar", showView.aadhar_no],
                ["Session", showView.session_name],
                ["Status", showView.status],
                ["Center", showView.center_name],
                ["Source", showView.admission_source],
                ["Total Fees", showView.total_fees ? `₹${showView.total_fees.toLocaleString()}` : "-"],
                ["Paid", `₹${(showView.deposit || 0).toLocaleString()}`],
                ["Address", showView.current_address],
                ["City", showView.current_city],
                ["State", showView.current_state],
              ].filter(([, v]) => v).map(([label, value]) => (
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
