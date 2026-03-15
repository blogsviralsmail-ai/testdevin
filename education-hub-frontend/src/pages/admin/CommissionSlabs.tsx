import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, X, TrendingUp, Wallet, BarChart3, Building2, CheckCircle } from "lucide-react";

const SLAB_LEVELS = [
  { value: "admin_to_center", label: "Admin \u2192 Center", desc: "Admin earns from Centers" },
  { value: "admin_to_subcenter", label: "Admin \u2192 Sub-center", desc: "Admin earns from Sub-centers" },
  { value: "center_to_subcenter", label: "Center \u2192 Sub-center", desc: "Center earns from Sub-centers" },
];

export default function AdminCommissionSlabs() {
  const [slabs, setSlabs] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterUni, setFilterUni] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [tab, setTab] = useState<"slabs" | "hierarchy">("slabs");
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [ledgerSummary, setLedgerSummary] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchSlabs = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filterUni) params.university_id = filterUni;
    api.get("/api/centers/commission/slabs", { params })
      .then(r => setSlabs(r.data.slabs || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterUni]);

  useEffect(() => { fetchSlabs(); }, [fetchSlabs]);

  useEffect(() => {
    api.get("/api/universities").then(r => setUniversities(r.data.universities || r.data || [])).catch(() => {});
  }, []);

  const fetchHierarchy = useCallback(() => {
    setLedgerLoading(true);
    Promise.all([
      api.get("/api/centers/commission/hierarchy-report").catch(() => ({ data: {} })),
      api.get("/api/centers/commission/ledger/summary").catch(() => ({ data: {} })),
      api.get("/api/centers/commission/ledger").catch(() => ({ data: { ledger: [] } })),
    ]).then(([hierRes, sumRes, ledRes]) => {
      setHierarchyData(hierRes.data);
      setLedgerSummary(sumRes.data);
      setLedger(ledRes.data.ledger || []);
    }).finally(() => setLedgerLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "hierarchy") fetchHierarchy();
  }, [tab, fetchHierarchy]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/centers/commission/slabs/${editId}`, form);
      } else {
        await api.post("/api/centers/commission/slabs", form);
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
      await api.delete(`/api/centers/commission/slabs/${id}`);
      fetchSlabs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error deleting slab");
    }
  };

  const openEdit = (s: any) => {
    setForm({
      university_id: s.university_id,
      min_admissions: s.min_admissions,
      max_admissions: s.max_admissions,
      commission_amount: s.commission_amount,
      slab_level: s.slab_level || "admin_to_center",
    });
    setEditId(s.id);
    setShowAdd(true);
  };

  const markPaid = async (id: number) => {
    try {
      await api.put(`/api/centers/commission/ledger/${id}/pay`);
      fetchHierarchy();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error");
    }
  };

  const filteredSlabs = filterLevel ? slabs.filter(s => (s.slab_level || "admin_to_center") === filterLevel) : slabs;

  const getLevelBadge = (level: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      admin_to_center: { bg: "bg-blue-100", text: "text-blue-700", label: "Admin \u2192 Center" },
      admin_to_subcenter: { bg: "bg-purple-100", text: "text-purple-700", label: "Admin \u2192 Sub-center" },
      center_to_subcenter: { bg: "bg-orange-100", text: "text-orange-700", label: "Center \u2192 Sub-center" },
    };
    const m = map[level] || map.admin_to_center;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`}>{m.label}</span>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Commission Management</h1>
          <p className="text-sm text-gray-500">Configure commission hierarchy: Admin \u2192 Center \u2192 Sub-center</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("slabs")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "slabs" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          Commission Slabs
        </button>
        <button onClick={() => setTab("hierarchy")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "hierarchy" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          Commission Hierarchy & Ledger
        </button>
      </div>

      {tab === "slabs" && (
        <>
          {/* Add button + Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 flex-wrap">
                <select value={filterUni} onChange={e => setFilterUni(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">All Universities</option>
                  {universities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">All Levels</option>
                  {SLAB_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <button onClick={() => { setForm({ slab_level: "admin_to_center" }); setEditId(null); setShowAdd(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Slab
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {SLAB_LEVELS.map(l => {
              const count = slabs.filter(s => (s.slab_level || "admin_to_center") === l.value).length;
              return (
                <div key={l.value} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setFilterLevel(filterLevel === l.value ? "" : l.value)}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${l.value === "admin_to_center" ? "bg-blue-100" : l.value === "admin_to_subcenter" ? "bg-purple-100" : "bg-orange-100"}`}>
                      <Building2 className={`h-5 w-5 ${l.value === "admin_to_center" ? "text-blue-600" : l.value === "admin_to_subcenter" ? "text-purple-600" : "text-orange-600"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{l.label}</p>
                      <p className="text-xs text-gray-500">{count} slabs configured</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">University</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Min</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Max</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Commission</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                ) : filteredSlabs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No commission slabs configured</td></tr>
                ) : filteredSlabs.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">{s.university_name || "-"}</td>
                    <td className="px-4 py-3">{s.min_admissions}</td>
                    <td className="px-4 py-3">{s.max_admissions || "Unlimited"}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{"\u20B9"}{(s.commission_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{getLevelBadge(s.slab_level || "admin_to_center")}</td>
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
        </>
      )}

      {tab === "hierarchy" && (
        <>
          {ledgerLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : (
            <>
              {/* Admin Summary Cards */}
              {ledgerSummary?.admin_earnings && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-xl"><Wallet className="h-6 w-6 text-blue-600" /></div>
                      <div>
                        <p className="text-sm text-gray-500">Total Admin Earnings</p>
                        <p className="text-2xl font-bold text-gray-800">{"\u20B9"}{(ledgerSummary.admin_earnings.total || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-emerald-600" /></div>
                      <div>
                        <p className="text-sm text-gray-500">From Centers</p>
                        <p className="text-2xl font-bold text-emerald-600">{"\u20B9"}{(ledgerSummary.admin_earnings.from_centers || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-purple-600" /></div>
                      <div>
                        <p className="text-sm text-gray-500">From Sub-centers</p>
                        <p className="text-2xl font-bold text-purple-600">{"\u20B9"}{(ledgerSummary.admin_earnings.from_subcenters || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-100 p-3 rounded-xl"><BarChart3 className="h-6 w-6 text-yellow-600" /></div>
                      <div>
                        <p className="text-sm text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{"\u20B9"}{(ledgerSummary.admin_earnings.pending || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hierarchy Table */}
              {hierarchyData?.centers && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto mb-6">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Center Hierarchy & Commission Status</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Center</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Parent</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Students</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Commission {"\u2192"} Admin</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Paid</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Pending</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Earns from Sub-centers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hierarchyData.centers.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-8 text-gray-400">No centers found</td></tr>
                      ) : hierarchyData.centers.map((c: any) => (
                        <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${c.level === "sub_center" ? "bg-gray-50/50" : ""}`}>
                          <td className="px-4 py-3 font-medium">
                            {c.level === "sub_center" && <span className="text-gray-400 mr-1">{"\u2514"}</span>}
                            {c.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.level === "center" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                              {c.level === "center" ? "Center" : "Sub-center"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{c.parent_center_name || "-"}</td>
                          <td className="px-4 py-3">{c.student_count}</td>
                          <td className="px-4 py-3 font-medium text-blue-600">{"\u20B9"}{(c.commission_to_admin || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-green-600">{"\u20B9"}{(c.paid_to_admin || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-yellow-600">{"\u20B9"}{(c.pending_to_admin || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-purple-600">{"\u20B9"}{(c.earned_from_subcenters || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Ledger Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="font-semibold text-gray-800">Commission Ledger (All Entries)</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">University</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">To</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-400">No commission ledger entries yet. Add students via centers to auto-generate.</td></tr>
                    ) : ledger.map((entry: any) => (
                      <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{entry.student_name || "-"}<br /><span className="text-xs text-gray-400">{entry.enrollment_no || ""}</span></td>
                        <td className="px-4 py-3 text-xs">{entry.university_name || "-"}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${entry.from_entity_type === "sub_center" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                            {entry.from_center_name || entry.from_entity_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${entry.to_entity_type === "admin" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>
                            {entry.to_entity_type === "admin" ? "Admin" : entry.to_center_name || "Center"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-emerald-600">{"\u20B9"}{(entry.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {entry.status || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {entry.status !== "paid" && (
                            <button onClick={() => markPaid(entry.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark as Paid">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editId ? "Edit Slab" : "Add Commission Slab"}</h2>
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Level *</label>
                <select value={form.slab_level || "admin_to_center"} onChange={e => setForm(f => ({ ...f, slab_level: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  {SLAB_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label} {"\u2014"} {l.desc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                <select value={form.university_id || ""} onChange={e => setForm(f => ({ ...f, university_id: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select University</option>
                  {universities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount ({"\u20B9"}) *</label>
                <input type="number" value={form.commission_amount || ""} onChange={e => setForm(f => ({ ...f, commission_amount: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Students</label>
                <input type="number" value={form.min_admissions || ""} onChange={e => setForm(f => ({ ...f, min_admissions: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                <input type="number" value={form.max_admissions || ""} onChange={e => setForm(f => ({ ...f, max_admissions: e.target.value ? parseInt(e.target.value) : 999 }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="999" />
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              {form.slab_level === "admin_to_center" && "Admin earns this amount per student from Centers."}
              {form.slab_level === "admin_to_subcenter" && "Admin earns this amount per student from Sub-centers."}
              {(form.slab_level === "center_to_subcenter" || !form.slab_level) && "Center earns this amount per student from its Sub-centers."}
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
