import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, X, TrendingUp, Wallet, Search, Users, IndianRupee, CheckCircle, AlertTriangle, ArrowUpDown } from "lucide-react";

export default function AdminCommissionSlabs() {
  const [deals, setDeals] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCenter, setFilterCenter] = useState("");
  const [filterUpdated, setFilterUpdated] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [tab, setTab] = useState<"deals" | "summary" | "payments">("deals");
  const [showAdd, setShowAdd] = useState(false);
  const [editDeal, setEditDeal] = useState<any>(null);
  const [form, setForm] = useState({ student_id: 0, sub_center_fee: "", center_deal: "", admin_deal: "", university_deal: "", admission_date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStudents, setBulkStudents] = useState<any[]>([]);
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);
  const [bulkForm, setBulkForm] = useState({ sub_center_fee: "", center_deal: "", admin_deal: "", university_deal: "", notes: "" });
  const [bulkSaving, setBulkSaving] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const fetchDeals = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterCenter) params.center_id = filterCenter;
    if (filterUpdated) params.filter_updated = filterUpdated;
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    api.get("/api/centers/deals", { params })
      .then(r => setDeals(r.data.deals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filterCenter, filterUpdated, sortBy, sortOrder]);

  const fetchSummary = useCallback(() => {
    api.get("/api/centers/deals/summary").then(r => setSummary(r.data)).catch(() => {});
  }, []);

  const fetchPayments = useCallback(() => {
    setPaymentsLoading(true);
    api.get("/api/centers/deals/payments")
      .then(r => setPayments(r.data.payments || []))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => {
    api.get("/api/centers", { params: { limit: 200 } }).then(r => setCenters(r.data.centers || [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (tab === "payments") fetchPayments();
  }, [tab, fetchPayments]);

  const searchStudents = useCallback((q: string) => {
    if (q.length < 2) { setAvailableStudents([]); return; }
    setLoadingStudents(true);
    api.get("/api/centers/deals/students-without-deals", { params: { search: q } })
      .then(r => setAvailableStudents(r.data.students || []))
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchStudents(studentSearch), 300);
    return () => clearTimeout(timer);
  }, [studentSearch, searchStudents]);

  const fetchBulkStudents = useCallback(() => {
    api.get("/api/centers/deals/students-without-deals", { params: { search: "" } })
      .then(r => setBulkStudents(r.data.students || []))
      .catch(() => {});
  }, []);

  const openAdd = () => {
    setEditDeal(null); setSelectedStudent(null); setStudentSearch("");
    setForm({ student_id: 0, sub_center_fee: "", center_deal: "", admin_deal: "", university_deal: "", admission_date: "", notes: "" });
    setShowAdd(true);
  };

  const openEdit = (deal: any) => {
    setEditDeal(deal);
    setSelectedStudent({ id: deal.student_id, name: deal.student_name, enrollment_no: deal.enrollment_no });
    setForm({ student_id: deal.student_id, sub_center_fee: String(deal.sub_center_fee || 0), center_deal: String(deal.center_deal || 0), admin_deal: String(deal.admin_deal || 0), university_deal: String(deal.university_deal || 0), admission_date: deal.admission_date || "", notes: deal.notes || "" });
    setShowAdd(true);
  };

  const handleSave = async () => {
    const studentId = editDeal ? editDeal.student_id : selectedStudent?.id;
    if (!studentId) { alert("Please select a student"); return; }
    setSaving(true);
    try {
      const payload = { sub_center_fee: parseFloat(form.sub_center_fee) || 0, center_deal: parseFloat(form.center_deal) || 0, admin_deal: parseFloat(form.admin_deal) || 0, university_deal: parseFloat(form.university_deal) || 0, admission_date: form.admission_date || null, notes: form.notes };
      if (editDeal) { await api.put(`/api/centers/deals/${editDeal.id}`, payload); }
      else { await api.post("/api/centers/deals", { student_id: studentId, ...payload }); }
      setShowAdd(false); fetchDeals(); fetchSummary();
    } catch (err: any) { alert(err.response?.data?.detail || "Error saving deal"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this deal entry?")) return;
    try { await api.delete(`/api/centers/deals/${id}`); fetchDeals(); fetchSummary(); }
    catch (err: any) { alert(err.response?.data?.detail || "Error deleting deal"); }
  };

  const handleBulkSave = async () => {
    if (!bulkSelected.length) { alert("Select at least one student"); return; }
    setBulkSaving(true);
    try {
      await api.post("/api/centers/deals/bulk", { student_ids: bulkSelected, sub_center_fee: parseFloat(bulkForm.sub_center_fee) || 0, center_deal: parseFloat(bulkForm.center_deal) || 0, admin_deal: parseFloat(bulkForm.admin_deal) || 0, university_deal: parseFloat(bulkForm.university_deal) || 0, notes: bulkForm.notes });
      setShowBulk(false); setBulkSelected([]); fetchDeals(); fetchSummary();
    } catch (err: any) { alert(err.response?.data?.detail || "Error"); }
    finally { setBulkSaving(false); }
  };

  const deletePayment = async (id: number) => {
    if (!confirm("Delete this payment record?")) return;
    try { await api.delete(`/api/centers/deals/payments/${id}`); fetchPayments(); fetchSummary(); }
    catch (err: any) { alert(err.response?.data?.detail || "Error"); }
  };

  const fmt = (n: number) => "\u20B9" + ((n || 0).toLocaleString("en-IN"));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deal Fees & Payments</h1>
          <p className="text-sm text-gray-500">Track student deals: Sub-center Fee {"\u2192"} Center Deal {"\u2192"} Admin Deal</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTab("deals")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "deals" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>Student Deals</button>
        <button onClick={() => setTab("summary")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "summary" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>Summary & Profits</button>
        <button onClick={() => setTab("payments")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "payments" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>Payment Tracking</button>
      </div>

      {tab === "deals" && (<>
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl"><Users className="h-6 w-6 text-blue-600" /></div>
                <div><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold text-gray-800">{summary.total_students || 0}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-emerald-100 p-3 rounded-xl"><IndianRupee className="h-6 w-6 text-emerald-600" /></div>
                <div><p className="text-sm text-gray-500">Total Sub-center Fees</p><p className="text-2xl font-bold text-emerald-600">{fmt(summary.total_sub_center_fee)}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-xl"><Wallet className="h-6 w-6 text-purple-600" /></div>
                <div><p className="text-sm text-gray-500">Admin Receivable</p><p className="text-2xl font-bold text-purple-600">{fmt(summary.total_admin_deal)}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-yellow-100 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-yellow-600" /></div>
                <div><p className="text-sm text-gray-500">Admin Pending</p><p className="text-2xl font-bold text-yellow-600">{fmt(summary.admin_pending)}</p></div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 flex-wrap items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-56" />
              </div>
              <select value={filterCenter} onChange={e => setFilterCenter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">All Centers</option>
                {centers.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.level === "sub_center" ? "(Sub)" : ""}</option>)}
              </select>
              <select value={filterUpdated} onChange={e => setFilterUpdated(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">All Deals</option>
                <option value="not_updated">Not Updated by Admin</option>
                <option value="updated">Updated by Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { fetchBulkStudents(); setShowBulk(true); setBulkForm({ sub_center_fee: "", center_deal: "", admin_deal: "", university_deal: "", notes: "" }); setBulkSelected([]); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 text-sm font-medium">
                <Users className="h-4 w-4" /> Bulk Add
              </button>
              <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Deal
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => { setSortBy("student_name"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Student {sortBy === "student_name" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mobile</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Center</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sub Center</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Counselor</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => { setSortBy("admission_date"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Adm. Date {sortBy === "admission_date" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">University / Course</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => { setSortBy("sub_center_fee"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>SC Fee {sortBy === "sub_center_fee" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => { setSortBy("center_deal"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Center Deal {sortBy === "center_deal" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => { setSortBy("admin_deal"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Admin Deal {sortBy === "admin_deal" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => { setSortBy("university_deal"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Univ Deal {sortBy === "university_deal" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">SC Profit</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Center Profit</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Admin Profit</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={15} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : deals.length === 0 ? (
                <tr><td colSpan={15} className="text-center py-8 text-gray-400">No deals configured yet. Click "Add Deal" to start.</td></tr>
              ) : deals.map(d => {
                const scP = (d.sub_center_fee || 0) - (d.center_deal || 0);
                const cP = (d.center_deal || 0) - (d.admin_deal || 0);
                const aP = (d.admin_deal || 0) - (d.university_deal || 0);
                const isNotUpdated = (!d.admin_deal || d.admin_deal === 0) && (!d.university_deal || d.university_deal === 0);
                const admissionDateLabel = d.admission_date
                  ? new Date(d.admission_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <tr key={d.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isNotUpdated ? "bg-amber-50 border-l-4 border-l-amber-400" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.student_name}</div>
                      {isNotUpdated && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          <AlertTriangle className="h-3 w-3" /> Not Updated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.student_phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{d.parent_center_name || d.center_name || "Direct"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{d.center_name || "Direct"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.student_counselor || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{admissionDateLabel}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{d.university_name || "-"}<br />{d.course_name || ""}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmt(d.sub_center_fee)}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">{fmt(d.center_deal)}</td>
                    <td className="px-4 py-3 text-right font-medium text-purple-600">{fmt(d.admin_deal)}</td>
                    <td className="px-4 py-3 text-right font-medium text-orange-600">{fmt(d.university_deal)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${scP >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(scP)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${cP >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(cP)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${aP >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(aP)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {tab === "summary" && summary && (<>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-6">
            <p className="text-sm opacity-80">Sub-center Total Profit</p>
            <p className="text-3xl font-bold mt-1">{fmt(summary.sub_center_profit)}</p>
            <p className="text-xs opacity-60 mt-1">Fees - Center Deals</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <p className="text-sm opacity-80">Center Total Profit</p>
            <p className="text-3xl font-bold mt-1">{fmt(summary.center_profit)}</p>
            <p className="text-xs opacity-60 mt-1">Center Deals - Admin Deals</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <p className="text-sm opacity-80">Admin Profit</p>
            <p className="text-3xl font-bold mt-1">{fmt(summary.admin_profit)}</p>
            <p className="text-xs opacity-60 mt-1">Admin Deal - University Deal</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
            <p className="text-sm opacity-80">University Total</p>
            <p className="text-3xl font-bold mt-1">{fmt(summary.total_university_deal)}</p>
            <p className="text-xs opacity-60 mt-1">Received: {fmt(summary.admin_received)} | Pending: {fmt(summary.admin_pending)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100"><h2 className="font-semibold text-gray-800">Center-wise Breakdown</h2></div>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Center</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Students</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total SC Fee</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Center Deal</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Admin Deal</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Univ Deal</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">SC Profit</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Center Profit</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Admin Profit</th>
              </tr>
            </thead>
            <tbody>
              {(!summary.center_breakdown || summary.center_breakdown.length === 0) ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">No data</td></tr>
              ) : summary.center_breakdown.map((c: any) => (
                <tr key={c.center_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.center_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.center_level === "sub_center" ? "bg-purple-100 text-purple-700" : c.center_level === "center" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                      {c.center_level === "sub_center" ? "Sub-center" : c.center_level === "center" ? "Center" : "Direct"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{c.student_count}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">{fmt(c.total_sub_center_fee)}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{fmt(c.total_center_deal)}</td>
                  <td className="px-4 py-3 text-right text-purple-600 font-medium">{fmt(c.total_admin_deal)}</td>
                  <td className="px-4 py-3 text-right text-orange-600 font-medium">{fmt(c.total_university_deal || 0)}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmt(c.total_sub_center_fee - c.total_center_deal)}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">{fmt(c.total_center_deal - c.total_admin_deal)}</td>
                  <td className="px-4 py-3 text-right font-medium text-purple-600">{fmt(c.total_admin_deal - (c.total_university_deal || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h3 className="font-semibold text-blue-800 mb-3">How Deal Fee Tracking Works</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Sub-center Fee:</strong> The amount sub-center/center charges the student. Student sees this.</p>
            <p><strong>Center Deal:</strong> The amount center gets from sub-center fee. Center sees this.</p>
            <p><strong>Admin Deal:</strong> The amount admin gets from center deal. Only admin sees this.</p>
            <p><strong>University Deal:</strong> The amount paid to the university. Only admin sees this.</p>
            <p className="pt-2 border-t border-blue-200">
              <strong>Example:</strong> SC Fee: {"\u20B9"}50,000, Center Deal: {"\u20B9"}40,000, Admin Deal: {"\u20B9"}30,000, Univ Deal: {"\u20B9"}20,000
              <br />SC profit: {"\u20B9"}10,000 | Center profit: {"\u20B9"}10,000 | Admin profit: {"\u20B9"}10,000 | University: {"\u20B9"}20,000
            </p>
          </div>
        </div>
      </>)}

      {tab === "payments" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100"><h2 className="font-semibold text-gray-800">Payment Records</h2></div>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">To</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mode</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">UTR</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentsLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No payment records yet.</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.student_name}<br /><span className="text-xs text-gray-400">{p.enrollment_no}</span></td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">{p.from_center_name || p.from_entity_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{p.to_entity_type === "admin" ? "Admin" : p.to_center_name || "Center"}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-xs">{p.payment_mode}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.utr_number || "-"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.paid_date ? new Date(p.paid_date).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deletePayment(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Deal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editDeal ? "Edit Deal" : "Add Student Deal"}</h2>
              <button onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!editDeal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  {selectedStudent ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">{selectedStudent.name}</p>
                        <p className="text-xs text-blue-600">{selectedStudent.enrollment_no || selectedStudent.phone}</p>
                      </div>
                      <button onClick={() => { setSelectedStudent(null); setStudentSearch(""); }} className="ml-auto text-blue-400 hover:text-blue-600"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div>
                      <input type="text" placeholder="Search student name or phone..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      {loadingStudents && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
                      {availableStudents.length > 0 && (
                        <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                          {availableStudents.map(s => (
                            <button key={s.id} onClick={() => { setSelectedStudent(s); setForm(f => ({ ...f, student_id: s.id })); setAvailableStudents([]); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm">
                              <span className="font-medium">{s.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{s.enrollment_no} | {s.center_name || "No center"}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {editDeal && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800">{selectedStudent?.name}</p>
                  <p className="text-xs text-gray-500">{selectedStudent?.enrollment_no}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-center Fee ({"\u20B9"})</label>
                  <input type="number" value={form.sub_center_fee} onChange={e => setForm({ ...form, sub_center_fee: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="50000" />
                  <p className="text-xs text-gray-400 mt-0.5">Student pays this</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center Deal ({"\u20B9"})</label>
                  <input type="number" value={form.center_deal} onChange={e => setForm({ ...form, center_deal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="40000" />
                  <p className="text-xs text-gray-400 mt-0.5">Center receives this</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Deal ({"\u20B9"})</label>
                  <input type="number" value={form.admin_deal} onChange={e => setForm({ ...form, admin_deal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="30000" />
                  <p className="text-xs text-gray-400 mt-0.5">Admin receives this</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University Deal ({"\u20B9"})</label>
                  <input type="number" value={form.university_deal} onChange={e => setForm({ ...form, university_deal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="20000" />
                  <p className="text-xs text-gray-400 mt-0.5">Paid to university</p>
                </div>
              </div>

              {(form.sub_center_fee || form.center_deal || form.admin_deal || form.university_deal) && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Profit Preview</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">SC Profit:</span>
                      <span className="ml-1 font-medium text-emerald-600">{fmt((parseFloat(form.sub_center_fee) || 0) - (parseFloat(form.center_deal) || 0))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Center Profit:</span>
                      <span className="ml-1 font-medium text-blue-600">{fmt((parseFloat(form.center_deal) || 0) - (parseFloat(form.admin_deal) || 0))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Admin Profit:</span>
                      <span className="ml-1 font-medium text-purple-600">{fmt((parseFloat(form.admin_deal) || 0) - (parseFloat(form.university_deal) || 0))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">University:</span>
                      <span className="ml-1 font-medium text-orange-600">{fmt(parseFloat(form.university_deal) || 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional notes..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editDeal ? "Update Deal" : "Save Deal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Bulk Add Deals</h2>
              <button onClick={() => setShowBulk(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-center Fee ({"\u20B9"})</label>
                  <input type="number" value={bulkForm.sub_center_fee} onChange={e => setBulkForm({ ...bulkForm, sub_center_fee: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center Deal ({"\u20B9"})</label>
                  <input type="number" value={bulkForm.center_deal} onChange={e => setBulkForm({ ...bulkForm, center_deal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Deal ({"\u20B9"})</label>
                  <input type="number" value={bulkForm.admin_deal} onChange={e => setBulkForm({ ...bulkForm, admin_deal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University Deal ({"\u20B9"})</label>
                  <input type="number" value={bulkForm.university_deal} onChange={e => setBulkForm({ ...bulkForm, university_deal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">Select Students ({bulkSelected.length} selected)</p>
                  <button onClick={() => setBulkSelected(bulkSelected.length === bulkStudents.length ? [] : bulkStudents.map(s => s.id))} className="text-xs text-blue-600 hover:underline">
                    {bulkSelected.length === bulkStudents.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {bulkStudents.length === 0 ? (
                    <p className="text-center py-4 text-gray-400 text-sm">All students already have deals</p>
                  ) : bulkStudents.map(s => (
                    <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer">
                      <input type="checkbox" checked={bulkSelected.includes(s.id)} onChange={() => setBulkSelected(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} />
                      <div className="text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{s.center_name || "No center"}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowBulk(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleBulkSave} disabled={bulkSaving || !bulkSelected.length} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                  {bulkSaving ? "Saving..." : `Save ${bulkSelected.length} Deals`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
