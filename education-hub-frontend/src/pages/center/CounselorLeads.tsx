import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, X, Search, Phone, ArrowUpDown, UserCheck, RefreshCw, Download } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "followup", label: "Follow Up", color: "bg-yellow-100 text-yellow-700" },
  { value: "callback", label: "Call Back", color: "bg-orange-100 text-orange-700" },
  { value: "not_picked", label: "Not Picked", color: "bg-gray-100 text-gray-600" },
  { value: "interested", label: "Interested", color: "bg-green-100 text-green-700" },
  { value: "not_interested", label: "Not Interested", color: "bg-red-100 text-red-600" },
  { value: "converted", label: "Converted", color: "bg-emerald-100 text-emerald-700" },
  { value: "closed", label: "Closed", color: "bg-slate-100 text-slate-600" },
];

const FOLLOWUP_FILTERS = [
  { value: "", label: "All Follow-ups" },
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "no_followup", label: "No Follow-up Set" },
];

const SOURCE_OPTIONS = ["manual", "website", "phone", "walk-in", "referral", "social_media", "whatsapp"];

export default function CenterCounselorLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [followupFilter, setFollowupFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", father_name: "", mobile: "", email: "", counselor_name: "",
    current_status: "new", followup_date: "", remarks: "", source: "manual",
    university_interest: "", course_interest: "",
  });

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status_filter = statusFilter;
    if (followupFilter) params.followup_filter = followupFilter;
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    api.get("/api/centers/counselor-leads", { params })
      .then(r => setLeads(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter, followupFilter, sortBy, sortOrder]);

  const fetchStats = useCallback(() => {
    api.get("/api/centers/counselor-leads/stats").then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    api.get("/api/universities").then(r => setUniversities(r.data.universities || r.data || [])).catch(() => {});
    api.get("/api/categories", { params: { limit: 500 } }).then(r => setCourses(r.data.categories || r.data || [])).catch(() => {});
  }, []);

  const resetForm = () => setForm({
    name: "", father_name: "", mobile: "", email: "", counselor_name: "",
    current_status: "new", followup_date: "", remarks: "", source: "manual",
    university_interest: "", course_interest: "",
  });

  const openAdd = () => { setEditLead(null); resetForm(); setShowModal(true); };

  const openEdit = (lead: any) => {
    setEditLead(lead);
    setForm({
      name: lead.name || "", father_name: lead.father_name || "",
      mobile: lead.mobile || "", email: lead.email || "",
      counselor_name: lead.counselor_name || "", current_status: lead.current_status || "new",
      followup_date: lead.followup_date || "", remarks: lead.remarks || "",
      source: lead.source || "manual", university_interest: lead.university_interest || "",
      course_interest: lead.course_interest || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.mobile) { alert("Name and Mobile are required"); return; }
    setSaving(true);
    try {
      if (editLead) {
        await api.put(`/api/centers/counselor-leads/${editLead.id}`, form);
      } else {
        await api.post("/api/centers/counselor-leads", form);
      }
      setShowModal(false); fetchLeads(); fetchStats();
    } catch (err: any) { alert(err.response?.data?.detail || "Error saving lead"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this lead?")) return;
    try { await api.delete(`/api/centers/counselor-leads/${id}`); fetchLeads(); fetchStats(); }
    catch (err: any) { alert(err.response?.data?.detail || "Error deleting"); }
  };

  const handleConvert = async (lead: any) => {
    if (!confirm(`Convert "${lead.name}" to student admission?`)) return;
    try {
      await api.post(`/api/centers/counselor-leads/${lead.id}/convert`);
      fetchLeads(); fetchStats();
      alert("Lead marked as converted. Go to Students page to add this student.");
    } catch (err: any) { alert(err.response?.data?.detail || "Error converting"); }
  };

  const handleCSV = () => {
    const headers = ["Name", "Father Name", "Mobile", "Email", "Counselor", "Status", "Follow-up Date", "Remarks", "Source", "Enquiry Date"];
    const rows = leads.map(l => [
      l.name, l.father_name || "", l.mobile, l.email || "", l.counselor_name || "",
      l.current_status, l.followup_date || "", l.remarks || "", l.source || "",
      l.enquiry_datetime || l.created_at || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "counselor_leads.csv"; a.click();
  };

  const getStatusBadge = (status: string) => {
    const s = STATUS_OPTIONS.find(o => o.value === status);
    return s ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
      : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{status}</span>;
  };

  const formatDate = (d: string) => {
    if (!d) return "\u2014";
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("desc"); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Counselor Leads / Calling Data</h1>
          <p className="text-sm text-gray-500">Manage your calling data, follow-ups, and convert leads to admissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm font-medium">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm font-medium">
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">New</p>
            <p className="text-2xl font-bold text-blue-600">{stats.statuses?.new || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">Follow Up</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.statuses?.followup || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">Interested</p>
            <p className="text-2xl font-bold text-green-600">{stats.statuses?.interested || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 border-amber-200 bg-amber-50">
            <p className="text-xs text-amber-600">Today Follow-ups</p>
            <p className="text-2xl font-bold text-amber-700">{stats.today_followups || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 border-red-200 bg-red-50">
            <p className="text-xs text-red-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue_followups || 0}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search name, mobile, email, counselor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={followupFilter} onChange={e => setFollowupFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
            {FOLLOWUP_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button onClick={() => { setSearch(""); setStatusFilter(""); setFollowupFilter(""); }} className="p-2 text-gray-400 hover:text-gray-600" title="Clear filters">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("name")}>
                Name {sortBy === "name" && <ArrowUpDown className="inline h-3 w-3" />}
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Father Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("mobile")}>
                Mobile {sortBy === "mobile" && <ArrowUpDown className="inline h-3 w-3" />}
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("counselor_name")}>
                Counselor {sortBy === "counselor_name" && <ArrowUpDown className="inline h-3 w-3" />}
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("current_status")}>
                Status {sortBy === "current_status" && <ArrowUpDown className="inline h-3 w-3" />}
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("followup_date")}>
                Follow-up {sortBy === "followup_date" && <ArrowUpDown className="inline h-3 w-3" />}
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Remarks</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("enquiry_datetime")}>
                Enquiry Date {sortBy === "enquiry_datetime" && <ArrowUpDown className="inline h-3 w-3" />}
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">No leads found. Click "Add Lead" to start.</td></tr>
            ) : leads.map(l => {
              const isOverdue = l.followup_date && new Date(l.followup_date) < new Date() && l.current_status !== "converted" && l.current_status !== "closed";
              return (
                <tr key={l.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isOverdue ? "bg-red-50 border-l-4 border-l-red-400" : ""}`}>
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3 text-gray-600">{l.father_name || "\u2014"}</td>
                  <td className="px-4 py-3">
                    <a href={`tel:${l.mobile}`} className="text-emerald-600 hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {l.mobile}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{l.email || "\u2014"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{l.counselor_name || "\u2014"}</td>
                  <td className="px-4 py-3">{getStatusBadge(l.current_status)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                      {formatDate(l.followup_date)}
                      {isOverdue && " (Overdue)"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate" title={l.remarks}>{l.remarks || "\u2014"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(l.enquiry_datetime || l.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(l)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Edit"><Edit2 className="h-4 w-4" /></button>
                      {l.current_status !== "converted" && (
                        <button onClick={() => handleConvert(l)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Convert to Admission"><UserCheck className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => handleDelete(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editLead ? "Edit Lead" : "Add New Lead"}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Lead name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                  <input type="text" value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Father's name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input type="text" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="10-digit number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Counselor Name</label>
                  <input type="text" value={form.counselor_name} onChange={e => setForm({ ...form, counselor_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Counselor who handled" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.current_status} onChange={e => setForm({ ...form, current_status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <input type="date" value={form.followup_date} onChange={e => setForm({ ...form, followup_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University Interest</label>
                  <select value={form.university_interest} onChange={e => setForm({ ...form, university_interest: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Select University</option>
                    {universities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Interest</label>
                  <select value={form.course_interest} onChange={e => setForm({ ...form, course_interest: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Select Course</option>
                    {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" rows={2} placeholder="Notes about this lead..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? "Saving..." : editLead ? "Update Lead" : "Add Lead"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
