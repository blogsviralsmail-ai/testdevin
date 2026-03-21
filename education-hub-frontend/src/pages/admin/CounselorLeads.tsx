import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, X, Search, Phone, ArrowUpDown, UserCheck, RefreshCw, Download, Upload, FileSpreadsheet } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700", border: "border-blue-300" },
  { value: "followup", label: "Follow Up", color: "bg-yellow-100 text-yellow-700", border: "border-yellow-300" },
  { value: "callback", label: "Call Back", color: "bg-orange-100 text-orange-700", border: "border-orange-300" },
  { value: "not_picked", label: "Not Picked", color: "bg-gray-100 text-gray-600", border: "border-gray-300" },
  { value: "interested", label: "Interested", color: "bg-green-100 text-green-700", border: "border-green-300" },
  { value: "not_interested", label: "Not Interested", color: "bg-red-100 text-red-600", border: "border-red-300" },
  { value: "converted", label: "Converted", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-300" },
  { value: "closed", label: "Closed", color: "bg-slate-100 text-slate-600", border: "border-slate-300" },
];

const FOLLOWUP_FILTERS = [
  { value: "", label: "All Follow-ups" },
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "no_followup", label: "No Follow-up Set" },
];

const SOURCE_OPTIONS = ["manual", "website", "phone", "walk-in", "referral", "social_media", "whatsapp"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

export default function AdminCounselorLeads() {
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
  const [counselors, setCounselors] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", father_name: "", mobile: "", email: "", counselor_name: "",
    current_status: "new", followup_date: "", remarks: "", source: "manual",
    university_interest: "", course_interest: "",
  });

  // Convert to Admission state - use ref to prevent data loss during re-renders
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertLead, setConvertLead] = useState<any>(null);
  const convertLeadRef = useRef<any>(null);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({
    password: "", email: "", university_id: "", category_id: "", total_fees: "",
    admission_type: "FRESH_ADMISSION", gender: "", dob: "", address: "", city: "", state: "",
    pincode: "", aadhar_number: "", category_caste: "", nationality: "Indian",
    mother_name: "", guardian_name: "", guardian_phone: "",
    tenth_board: "", tenth_year: "", tenth_percentage: "",
    twelfth_board: "", twelfth_year: "", twelfth_percentage: "",
  });

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

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
    api.get("/api/centers/counselors").then(r => setCounselors(Array.isArray(r.data) ? r.data : [])).catch(() => {});
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

  const openConvertModal = (lead: any, e?: React.MouseEvent) => {
    // Maximum event isolation to prevent any parent/sibling handlers from firing
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) { e.nativeEvent.stopImmediatePropagation(); }
    }
    // Deep-copy lead data into both state AND ref so it survives any re-render
    const leadCopy = JSON.parse(JSON.stringify(lead));
    convertLeadRef.current = leadCopy;
    setConvertLead(leadCopy);
    setConvertForm({
      password: "", email: leadCopy.email || "", university_id: leadCopy.university_interest ? String(leadCopy.university_interest) : "",
      category_id: leadCopy.course_interest ? String(leadCopy.course_interest) : "", total_fees: "",
      admission_type: "FRESH_ADMISSION", gender: "", dob: "", address: "", city: "", state: "",
      pincode: "", aadhar_number: "", category_caste: "", nationality: "Indian",
      mother_name: "", guardian_name: "", guardian_phone: "",
      tenth_board: "", tenth_year: "", tenth_percentage: "",
      twelfth_board: "", twelfth_year: "", twelfth_percentage: "",
    });
    setShowConvertModal(true);
  };

  const handleConvert = async () => {
    if (!convertForm.password) { alert("Password is required for student login"); return; }
    if (!convertForm.university_id) { alert("University is required"); return; }
    if (!convertForm.category_id) { alert("Course is required"); return; }
    setConverting(true);
    try {
      const payload = {
        ...convertForm,
        university_id: convertForm.university_id ? parseInt(String(convertForm.university_id)) : null,
        category_id: convertForm.category_id ? parseInt(String(convertForm.category_id)) : null,
        total_fees: convertForm.total_fees ? parseFloat(String(convertForm.total_fees)) : 0,
      };
      const leadData = convertLeadRef.current || convertLead;
      const res = await api.post(`/api/centers/counselor-leads/${leadData.id}/convert`, payload);
      setShowConvertModal(false);
      convertLeadRef.current = null;
      fetchLeads(); fetchStats();
      alert(`Student created successfully!\n\nLogin: ${leadData.mobile}\nStudent ID: ${res.data.student_id}\n\nStudent has been added to the Students list.`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error converting lead to admission");
    } finally { setConverting(false); }
  };

  const handleBulkImport = async () => {
    if (!bulkData.trim()) { alert("Please paste CSV data or upload a file"); return; }
    setBulkImporting(true);
    setBulkResult(null);
    try {
      const lines = bulkData.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
      const leadsArr = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });
        return obj;
      });
      const res = await api.post("/api/centers/counselor-leads/bulk-import", leadsArr);
      setBulkResult(res.data);
      fetchLeads(); fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error importing leads");
    } finally { setBulkImporting(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setBulkData(ev.target?.result as string || ""); };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csv = "name,father_name,mobile,email,counselor_name,current_status,followup_date,remarks,source\nJohn Doe,Robert Doe,9876543210,john@example.com,Counselor A,new,2026-04-01,Interested in MBA,phone\nJane Smith,David Smith,9876543211,jane@example.com,Counselor B,followup,2026-04-02,Called twice,website";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "leads_sample.csv"; a.click();
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

  const filteredCourses = convertForm.university_id
    ? courses.filter((c: any) => String(c.university_id) === String(convertForm.university_id))
    : courses;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Counselor Leads / Calling Data</h1>
          <p className="text-sm text-gray-500">Manage counselor calling data, follow-ups, and convert to admissions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleCSV} className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-green-700 text-sm font-medium">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => { setShowBulkModal(true); setBulkResult(null); setBulkData(""); }} className="bg-purple-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-purple-700 text-sm font-medium">
            <Upload className="h-4 w-4" /> Bulk Upload
          </button>
          <button onClick={openAdd} className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 text-sm font-medium">
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setStatusFilter("")} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === "" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
          All {stats ? `(${stats.total})` : ""}
        </button>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === s.value ? `${s.color} shadow-md ring-2 ring-offset-1 ${s.border}` : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            {s.label} {stats?.statuses?.[s.value] !== undefined ? `(${stats.statuses[s.value]})` : ""}
          </button>
        ))}
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-sm border p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-gray-800">{stats.total}</p></div>
          <div className="bg-white rounded-xl shadow-sm border p-4"><p className="text-xs text-gray-500">New</p><p className="text-2xl font-bold text-blue-600">{stats.statuses?.new || 0}</p></div>
          <div className="bg-white rounded-xl shadow-sm border p-4"><p className="text-xs text-gray-500">Follow Up</p><p className="text-2xl font-bold text-yellow-600">{stats.statuses?.followup || 0}</p></div>
          <div className="bg-white rounded-xl shadow-sm border p-4"><p className="text-xs text-gray-500">Interested</p><p className="text-2xl font-bold text-green-600">{stats.statuses?.interested || 0}</p></div>
          <div className="bg-white rounded-xl shadow-sm border p-4 border-amber-200 bg-amber-50"><p className="text-xs text-amber-600">Today Follow-ups</p><p className="text-2xl font-bold text-amber-700">{stats.today_followups || 0}</p></div>
          <div className="bg-white rounded-xl shadow-sm border p-4 border-red-200 bg-red-50"><p className="text-xs text-red-500">Overdue</p><p className="text-2xl font-bold text-red-600">{stats.overdue_followups || 0}</p></div>
        </div>
      )}

      {/* ── Search & Followup Filter ── */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search name, mobile, email, counselor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full" />
          </div>
          <select value={followupFilter} onChange={e => setFollowupFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {FOLLOWUP_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button onClick={() => { setSearch(""); setStatusFilter(""); setFollowupFilter(""); }} className="p-2 text-gray-400 hover:text-gray-600" title="Clear filters"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort("name")}>Name {sortBy === "name" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Father Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort("mobile")}>Mobile {sortBy === "mobile" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort("counselor_name")}>Counselor {sortBy === "counselor_name" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort("current_status")}>Status {sortBy === "current_status" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort("followup_date")}>Follow-up {sortBy === "followup_date" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Remarks</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort("enquiry_datetime")}>Enquiry Date {sortBy === "enquiry_datetime" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">No leads found. Click &quot;Add Lead&quot; to start.</td></tr>
            ) : leads.map(l => {
              const isOverdue = l.followup_date && new Date(l.followup_date) < new Date() && l.current_status !== "converted" && l.current_status !== "closed";
              return (
                <tr key={l.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isOverdue ? "bg-red-50 border-l-4 border-l-red-400" : ""}`}>
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3 text-gray-600">{l.father_name || "\u2014"}</td>
                  <td className="px-4 py-3"><a href={`tel:${l.mobile}`} className="text-blue-600 hover:underline flex items-center gap-1"><Phone className="h-3 w-3" /> {l.mobile}</a></td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{l.email || "\u2014"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{l.counselor_name || "\u2014"}</td>
                  <td className="px-4 py-3">{getStatusBadge(l.current_status)}</td>
                  <td className="px-4 py-3"><span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>{formatDate(l.followup_date)}{isOverdue && " (Overdue)"}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate" title={l.remarks}>{l.remarks || "\u2014"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(l.enquiry_datetime || l.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <button onClick={() => openEdit(l)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 className="h-4 w-4" /></button>
                      {l.current_status !== "converted" && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation(); openConvertModal(l, e); }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 font-medium flex items-center gap-1"
                          title="Convert to Admission"
                          type="button"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Convert to Admission
                        </button>
                      )}
                      {l.current_status === "converted" && (<span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded">Admitted</span>)}
                      <button onClick={() => handleDelete(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ══ Add / Edit Lead Modal ══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editLead ? "Edit Lead" : "Add New Lead"}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Lead name" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Father&#39;s Name</label><input type="text" value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Father's name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label><input type="text" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10-digit number" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@example.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Counselor Name</label><select value={form.counselor_name} onChange={e => setForm({ ...form, counselor_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select Counselor</option>{counselors.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.current_status} onChange={e => setForm({ ...form, current_status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label><input type="date" value={form.followup_date} onChange={e => setForm({ ...form, followup_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Source</label><select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">{SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">University Interest</label><select value={form.university_interest} onChange={e => setForm({ ...form, university_interest: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select University</option>{universities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Course Interest</label><select value={form.course_interest} onChange={e => setForm({ ...form, course_interest: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select Course</option>{courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label><textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Notes about this lead..." /></div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editLead ? "Update Lead" : "Add Lead"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Convert to Admission Modal ══ */}
      {showConvertModal && (convertLead || convertLeadRef.current) && (() => { const cl = convertLead || convertLeadRef.current; return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setShowConvertModal(false); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b bg-emerald-50">
              <div>
                <h2 className="text-lg font-bold text-emerald-800">Convert to Admission</h2>
                <p className="text-sm text-emerald-600">Converting: {cl.name} ({cl.mobile})</p>
              </div>
              <button onClick={() => setShowConvertModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Lead info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Lead Information (auto-filled)</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-blue-700">
                  <span>Name: <strong>{cl.name}</strong></span>
                  <span>Mobile: <strong>{cl.mobile}</strong></span>
                  <span>Father: <strong>{cl.father_name || "N/A"}</strong></span>
                </div>
              </div>

              {/* Credentials */}
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <p className="text-sm font-bold text-red-800 mb-2">Student Login Credentials *</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Username (Mobile)</label><input type="text" value={cl.mobile} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Password *</label><input type="password" value={convertForm.password} onChange={e => setConvertForm({ ...convertForm, password: e.target.value })} className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Set student password" /></div>
                </div>
              </div>

              {/* Academic */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Academic Information *</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">University *</label><select value={convertForm.university_id} onChange={e => setConvertForm({ ...convertForm, university_id: e.target.value, category_id: "" })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select University</option>{universities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Course *</label><select value={convertForm.category_id} onChange={e => setConvertForm({ ...convertForm, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select Course</option>{filteredCourses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Total Fees</label><input type="number" value={convertForm.total_fees} onChange={e => setConvertForm({ ...convertForm, total_fees: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" /></div>
                </div>
              </div>

              {/* Personal */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Personal Details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input type="email" value={convertForm.email} onChange={e => setConvertForm({ ...convertForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="email@example.com" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Gender</label><select value={convertForm.gender} onChange={e => setConvertForm({ ...convertForm, gender: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label><input type="date" value={convertForm.dob} onChange={e => setConvertForm({ ...convertForm, dob: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Category</label><select value={convertForm.category_caste} onChange={e => setConvertForm({ ...convertForm, category_caste: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="">Select</option><option value="General">General</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="EWS">EWS</option></select></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Aadhar Number</label><input type="text" value={convertForm.aadhar_number} onChange={e => setConvertForm({ ...convertForm, aadhar_number: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="12-digit" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Admission Type</label><select value={convertForm.admission_type} onChange={e => setConvertForm({ ...convertForm, admission_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="FRESH_ADMISSION">Fresh Admission</option><option value="LATERAL_ENTRY">Lateral Entry</option><option value="RE_ADMISSION">Re-Admission</option></select></div>
                </div>
              </div>

              {/* Family */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Family Details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Mother&#39;s Name</label><input type="text" value={convertForm.mother_name} onChange={e => setConvertForm({ ...convertForm, mother_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Name</label><input type="text" value={convertForm.guardian_name} onChange={e => setConvertForm({ ...convertForm, guardian_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Phone</label><input type="text" value={convertForm.guardian_phone} onChange={e => setConvertForm({ ...convertForm, guardian_phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Address</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><input type="text" value={convertForm.address} onChange={e => setConvertForm({ ...convertForm, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Full address" /></div>
                  <div><input type="text" value={convertForm.city} onChange={e => setConvertForm({ ...convertForm, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="City" /></div>
                  <div><select value={convertForm.state} onChange={e => setConvertForm({ ...convertForm, state: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="">Select State</option>{INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><input type="text" value={convertForm.pincode} onChange={e => setConvertForm({ ...convertForm, pincode: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Pincode" /></div>
                </div>
              </div>

              {/* Education */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Education Details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">10th Board</label><input type="text" value={convertForm.tenth_board} onChange={e => setConvertForm({ ...convertForm, tenth_board: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="CBSE/RBSE" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">10th Year</label><input type="text" value={convertForm.tenth_year} onChange={e => setConvertForm({ ...convertForm, tenth_year: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="2020" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">10th %</label><input type="text" value={convertForm.tenth_percentage} onChange={e => setConvertForm({ ...convertForm, tenth_percentage: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="85%" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">12th Board</label><input type="text" value={convertForm.twelfth_board} onChange={e => setConvertForm({ ...convertForm, twelfth_board: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="CBSE/RBSE" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">12th Year</label><input type="text" value={convertForm.twelfth_year} onChange={e => setConvertForm({ ...convertForm, twelfth_year: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="2022" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">12th %</label><input type="text" value={convertForm.twelfth_percentage} onChange={e => setConvertForm({ ...convertForm, twelfth_percentage: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="80%" /></div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button onClick={() => setShowConvertModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleConvert} disabled={converting} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 font-medium">{converting ? "Converting..." : "Convert to Admission & Create Student"}</button>
              </div>
            </div>
          </div>
        </div>
      ); })()}

      {/* ══ Bulk Upload Modal ══ */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b bg-purple-50">
              <div><h2 className="text-lg font-bold text-purple-800">Bulk Upload Leads</h2><p className="text-sm text-purple-600">Upload CSV file or paste data</p></div>
              <button onClick={() => setShowBulkModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">CSV Format (required columns: name, mobile)</p>
                  <button onClick={downloadSampleCSV} className="text-xs text-purple-600 hover:underline flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" /> Download Sample</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="text-xs border border-gray-200 w-full">
                    <thead className="bg-gray-100"><tr>{["name","father_name","mobile","email","counselor_name","current_status","followup_date","remarks","source"].map(h => <th key={h} className="px-2 py-1 border text-left font-medium">{h}</th>)}</tr></thead>
                    <tbody><tr>{["John Doe","Robert","9876543210","john@ex.com","Counselor A","new","2026-04-01","MBA interest","phone"].map((v,i) => <td key={i} className="px-2 py-1 border text-gray-500">{v}</td>)}</tr></tbody>
                  </table>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label><input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Or Paste CSV Data</label><textarea value={bulkData} onChange={e => setBulkData(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none" rows={8} placeholder={"name,father_name,mobile,email,...\nJohn Doe,Robert,9876543210,..."} /></div>
              {bulkResult && (
                <div className={`border rounded-lg p-3 ${bulkResult.errors?.length > 0 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}>
                  <p className="text-sm font-medium">{bulkResult.imported} of {bulkResult.total} leads imported successfully</p>
                  {bulkResult.errors?.length > 0 && (<ul className="text-xs text-red-600 mt-1 list-disc pl-4">{bulkResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>)}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Close</button>
                <button onClick={handleBulkImport} disabled={bulkImporting || !bulkData.trim()} className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 font-medium">{bulkImporting ? "Importing..." : "Import Leads"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
