import { useState, useEffect, useRef } from "react";
import { Target, Plus, Pencil, Trash2, X, MessageSquare, Zap, ArrowUpDown, Calendar, Download, ArrowRightLeft, History, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import api from "../../lib/api";

const STATUSES = ["new", "contacted", "interested", "qualified", "negotiation", "converted", "lost"];
const formatDate = (d: string) => { if (!d) return ""; try { const dt = new Date(d.replace(" ", "T")); return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; } };
const STATUS_COLORS: Record<string, string> = { new: "bg-blue-100 text-blue-700", contacted: "bg-amber-100 text-amber-700", interested: "bg-purple-100 text-purple-700", qualified: "bg-cyan-100 text-cyan-700", negotiation: "bg-orange-100 text-orange-700", converted: "bg-green-100 text-green-700", lost: "bg-red-100 text-red-700" };
const FOLLOW_UP_FILTERS = [
  { value: "", label: "All Follow-ups" },
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "no_followup", label: "No Follow-up" },
];

export default function LeadsAdmin() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [counselors, setCounselors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showFollowUp, setShowFollowUp] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [fuForm, setFuForm] = useState({ note: "", follow_up_type: "call", next_follow_up: "" });
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [showHistory, setShowHistory] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{added: number; skipped: number; errors?: string[]} | null>(null);
  const [bulkTab, setBulkTab] = useState<"csv" | "paste">("csv");
  const [pasteData, setPasteData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "website", status: "new", university_interest: "", course_interest: "", notes: "", assigned_to: "", follow_up_date: "" });

  const load = () => {
    const params: any = {};
    if (filter) params.status = filter;
    if (followUpFilter) params.follow_up_filter = followUpFilter;
    if (sortBy) { params.sort_by = sortBy; params.sort_order = sortOrder; }
    api.get("/api/leads", { params }).then(r => setLeads(r.data || [])).catch(() => {});
    api.get("/api/leads/stats").then(r => setStats(r.data || {})).catch(() => {});
  };
  useEffect(() => { load(); api.get("/api/leads/counselors").then(r => setCounselors(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [filter, followUpFilter, sortBy, sortOrder]);

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null };
    if (editing) { await api.put(`/api/leads/${editing.id}`, payload); }
    else { await api.post("/api/leads", payload); }
    setShowForm(false); setEditing(null); setForm({ name: "", email: "", phone: "", source: "website", status: "new", university_interest: "", course_interest: "", notes: "", assigned_to: "", follow_up_date: "" }); load();
  };

  const del = async (id: number) => { if (confirm("Delete?")) { await api.delete(`/api/leads/${id}`); load(); } };
  const edit = (l: any) => { setForm({ name: l.name, email: l.email || "", phone: l.phone || "", source: l.source, status: l.status, university_interest: l.university_interest || "", course_interest: l.course_interest || "", notes: l.notes || "", assigned_to: l.assigned_to?.toString() || "", follow_up_date: l.follow_up_date || "" }); setEditing(l); setShowForm(true); };
  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(prev => prev.length === leads.length ? [] : leads.map(l => l.id));
  const bulkDelete = async () => { if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} leads?`)) return; await api.delete("/api/leads/bulk", { data: { ids: selectedIds } }); setSelectedIds([]); load(); };
  const toggleSort = (field: string) => { if (sortBy === field) setSortOrder(prev => prev === "asc" ? "desc" : "asc"); else { setSortBy(field); setSortOrder("desc"); } };
  const openFollowUps = async (l: any) => { setShowFollowUp(l); const r = await api.get(`/api/leads/${l.id}/follow-ups`); setFollowUps(r.data || []); };
  const addFollowUp = async () => { if (!fuForm.note) return; await api.post(`/api/leads/${showFollowUp.id}/follow-up`, fuForm); setFuForm({ note: "", follow_up_type: "call", next_follow_up: "" }); const r = await api.get(`/api/leads/${showFollowUp.id}/follow-ups`); setFollowUps(r.data || []); };
  const autoAssign = async () => { await api.post("/api/leads/auto-assign"); load(); };
  const downloadCSV = () => {
    const token = localStorage.getItem("admin_token");
    let url = `/api/leads/download-csv?token=${token}`;
    if (filter) url += `&status=${filter}`;
    window.open((import.meta.env.VITE_API_URL || "") + url);
  };
  const transferLeads = async () => {
    if (!selectedIds.length || !transferTo) return;
    await api.put("/api/leads/transfer", { ids: selectedIds, assigned_to: parseInt(transferTo), note: transferNote });
    setSelectedIds([]); setShowTransfer(false); setTransferTo(""); setTransferNote(""); load();
  };
  const openHistory = async (l: any) => { setShowHistory(l); const r = await api.get(`/api/leads/${l.id}/history`); setHistory(r.data || []); };


  const downloadSampleCSV = () => {
    const csv = "Name,Phone,Email,Source,Status,University Interest,Course Interest,Notes\nRahul Sharma,9876543210,rahul@email.com,website,new,Chandigarh University,BCA,Interested in BCA\nPriya Singh,8765432109,priya@email.com,referral,contacted,LPU,MBA,Called once\nAmit Kumar,7654321098,,walk-in,new,Parul University,B.Tech,Walk-in enquiry";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sample_leads.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploading(true); setBulkResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/leads/bulk-upload", fd);
      setBulkResult(res.data);
      load();
    } catch (err: any) {
      setBulkResult({ added: 0, skipped: 0, errors: [err?.response?.data?.detail || "Upload failed"] });
    }
    setBulkUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkPaste = async () => {
    if (!pasteData.trim()) return;
    setBulkUploading(true); setBulkResult(null);
    try {
      // Parse pasted data: each line = one lead (Name, Phone, Email format)
      const lines = pasteData.trim().split("\n").filter(l => l.trim());
      const leads = lines.map(line => {
        const parts = line.split(/[,\t]+/).map(p => p.trim());
        return { name: parts[0] || "", phone: parts[1] || "", email: parts[2] || "", source: "website", status: "new" };
      }).filter(l => l.name);
      const res = await api.post("/api/leads/bulk-add", { leads });
      setBulkResult(res.data);
      setPasteData("");
      load();
    } catch (err: any) {
      setBulkResult({ added: 0, skipped: 0, errors: [err?.response?.data?.detail || "Failed to add leads"] });
    }
    setBulkUploading(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Target className="h-7 w-7 text-orange-600" /> Lead Management</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { if (!selectedIds.length) { alert("Please select leads to transfer"); return; } setShowTransfer(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><ArrowRightLeft className="h-4 w-4" /> Transfer{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}</button>
          {selectedIds.length > 0 && (
            <button onClick={bulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete ({selectedIds.length})</button>
          )}
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={autoAssign} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"><Zap className="h-4 w-4" /> Auto-Assign</button>
          <button onClick={() => { setShowBulkUpload(true); setBulkResult(null); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"><Upload className="h-4 w-4" /> Bulk Upload</button>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", email: "", phone: "", source: "website", status: "new", university_interest: "", course_interest: "", notes: "", assigned_to: "", follow_up_date: "" }); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"><Plus className="h-4 w-4" /> Add Lead</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
        {[{ label: "Total", val: stats.total, color: "bg-gray-600" }, { label: "New", val: stats.new, color: "bg-blue-600" }, { label: "Contacted", val: stats.contacted, color: "bg-amber-600" }, { label: "Interested", val: stats.interested, color: "bg-purple-600" }, { label: "Qualified", val: stats.qualified, color: "bg-cyan-600" }, { label: "Negotiation", val: stats.negotiation, color: "bg-orange-600" }, { label: "Converted", val: stats.converted, color: "bg-green-600" }, { label: "Lost", val: stats.lost, color: "bg-red-600" }].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFilter(s.label === "Total" ? "" : s.label.toLowerCase())}>
            <div className={`text-2xl font-bold text-white ${s.color} w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2`}>{s.val || 0}</div>
            <p className="text-xs font-medium text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <button onClick={() => setFilter("")} className={`px-3 py-1.5 rounded-lg text-sm ${!filter ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm capitalize ${filter === s ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}>{s}</button>
        ))}
        <span className="text-gray-300 mx-1">|</span>
        <select value={followUpFilter} onChange={e => setFollowUpFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
          {FOLLOW_UP_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button onClick={() => toggleSort("follow_up_date")} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${sortBy === "follow_up_date" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
          <Calendar className="h-3.5 w-3.5" /> Follow-up Date {sortBy === "follow_up_date" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
        <button onClick={() => toggleSort("created_at")} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${sortBy === "created_at" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
          <ArrowUpDown className="h-3.5 w-3.5" /> Created {sortBy === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">{editing ? "Edit Lead" : "Add Lead"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name *" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="px-3 py-2 border rounded-lg text-sm" />
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="website">Website</option><option value="referral">Referral</option><option value="walk-in">Walk-in</option><option value="phone">Phone</option><option value="social">Social Media</option>
                </select>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">Unassigned</option>
                  {counselors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={form.university_interest} onChange={e => setForm({ ...form, university_interest: e.target.value })} placeholder="University Interest" className="px-3 py-2 border rounded-lg text-sm" />
                <input value={form.course_interest} onChange={e => setForm({ ...form, course_interest: e.target.value })} placeholder="Course Interest" className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button onClick={save} className="w-full py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">{editing ? "Update" : "Add Lead"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-ups Modal */}
      {showFollowUp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">Follow-ups: {showFollowUp.name}</h2>
              <button onClick={() => setShowFollowUp(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <textarea value={fuForm.note} onChange={e => setFuForm({ ...fuForm, note: e.target.value })} placeholder="Follow-up note..." rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={fuForm.follow_up_type} onChange={e => setFuForm({ ...fuForm, follow_up_type: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="call">Call</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="meeting">Meeting</option>
                </select>
                <input type="date" value={fuForm.next_follow_up} onChange={e => setFuForm({ ...fuForm, next_follow_up: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <button onClick={addFollowUp} className="w-full py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">Add Follow-up</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {followUps.map(f => (
                <div key={f.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${f.follow_up_type === "call" ? "bg-blue-100 text-blue-700" : f.follow_up_type === "email" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>{f.follow_up_type}</span>
                    <span className="text-xs text-gray-400">{f.created_at?.split("T")[0] || f.created_at?.split(" ")[0]}</span>
                  </div>
                  <p className="text-sm">{f.note}</p>
                  {f.next_follow_up && <p className="text-xs text-gray-500 mt-1">Next: {f.next_follow_up}</p>}
                </div>
              ))}
              {followUps.length === 0 && <p className="text-gray-500 text-center py-4">No follow-ups yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">Transfer {selectedIds.length} Lead(s)</h2>
              <button onClick={() => setShowTransfer(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select Employee</option>
                {counselors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
              <textarea value={transferNote} onChange={e => setTransferNote(e.target.value)} placeholder="Transfer note (optional) - reason for transfer..." rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button onClick={transferLeads} disabled={!transferTo} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Transfer Leads</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">Lead History: {showHistory.name}</h2>
              <button onClick={() => setShowHistory(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map(h => (
                <div key={h.id} className={`border rounded-lg p-3 ${h.action === 'transfer' ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.action === 'transfer' ? 'bg-blue-200 text-blue-800' : 'bg-amber-200 text-amber-800'}`}>{h.action === 'transfer' ? 'Transfer' : 'Status Change'}</span>
                    <span className="text-xs text-gray-500">{h.created_at?.split('T')[0] || h.created_at?.split(' ')[0]} {h.created_at?.split('T')[1]?.substring(0,5) || ''}</span>
                  </div>
                  {h.action === 'transfer' && (
                    <p className="text-sm"><span className="text-gray-500">From:</span> <span className="font-medium">{h.from_user_name || 'Unassigned'}</span> <span className="text-gray-400">→</span> <span className="font-medium">{h.to_user_name || 'Unknown'}</span></p>
                  )}
                  {h.action === 'status_change' && (
                    <p className="text-sm"><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{h.old_status || 'N/A'}</span> <span className="text-gray-400">→</span> <span className="font-medium capitalize">{h.new_status || 'N/A'}</span></p>
                  )}
                  {h.note && <p className="text-xs text-gray-600 mt-1">Note: {h.note}</p>}
                  <p className="text-xs text-gray-400 mt-1">By: {h.performed_by_name || 'System'}</p>
                </div>
              ))}
              {history.length === 0 && <p className="text-gray-500 text-center py-6">No history records yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-purple-600" /> Bulk Lead Upload</h2>
              <button onClick={() => setShowBulkUpload(false)}><X className="h-5 w-5" /></button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
              <button onClick={() => setBulkTab("csv")} className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${bulkTab === "csv" ? "bg-white shadow-sm text-purple-700" : "text-gray-600"}`}>
                <Upload className="h-4 w-4 inline mr-1" /> CSV File Upload
              </button>
              <button onClick={() => setBulkTab("paste")} className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${bulkTab === "paste" ? "bg-white shadow-sm text-purple-700" : "text-gray-600"}`}>
                <FileSpreadsheet className="h-4 w-4 inline mr-1" /> Paste Data
              </button>
            </div>

            {bulkTab === "csv" && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-800 mb-2">CSV Format Guide:</p>
                  <p className="text-xs text-purple-600 mb-2">Your CSV should have headers like: <strong>Name, Phone, Email, Source, Status, University Interest, Course Interest, Notes</strong></p>
                  <p className="text-xs text-purple-500 mb-3">Only <strong>Name</strong> is required. Other columns are optional.</p>
                  <div className="bg-white rounded-lg border border-purple-200 p-3 mb-2">
                    <p className="text-xs font-semibold text-purple-700 mb-1">Example CSV:</p>
                    <table className="w-full text-xs text-purple-600">
                      <thead><tr className="border-b border-purple-100"><th className="text-left py-1 pr-2">Name</th><th className="text-left py-1 pr-2">Phone</th><th className="text-left py-1 pr-2">Email</th><th className="text-left py-1 pr-2">Source</th><th className="text-left py-1">Status</th></tr></thead>
                      <tbody>
                        <tr><td className="py-0.5 pr-2">Rahul Sharma</td><td className="py-0.5 pr-2">9876543210</td><td className="py-0.5 pr-2">rahul@email.com</td><td className="py-0.5 pr-2">website</td><td className="py-0.5">new</td></tr>
                        <tr><td className="py-0.5 pr-2">Priya Singh</td><td className="py-0.5 pr-2">8765432109</td><td className="py-0.5 pr-2">priya@email.com</td><td className="py-0.5 pr-2">referral</td><td className="py-0.5">contacted</td></tr>
                        <tr><td className="py-0.5 pr-2">Amit Kumar</td><td className="py-0.5 pr-2">7654321098</td><td className="py-0.5 pr-2"></td><td className="py-0.5 pr-2">walk-in</td><td className="py-0.5">new</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <button onClick={downloadSampleCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700">
                    <Download className="h-3.5 w-3.5" /> Download Sample CSV
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input type="file" ref={fileInputRef} accept=".csv,.xlsx,.xls" onChange={handleBulkCSV} className="hidden" />
                  {bulkUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                      <p className="text-sm text-gray-600">Uploading leads...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-10 w-10 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">Click to upload CSV file</p>
                      <p className="text-xs text-gray-500">or drag and drop</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {bulkTab === "paste" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Paste Format:</p>
                  <p className="text-xs text-blue-600">Each line = one lead. Format: <strong>Name, Phone, Email</strong> (comma or tab separated)</p>
                  <p className="text-xs text-blue-500 mt-1">Example: <code>Rahul Sharma, 9876543210, rahul@email.com</code></p>
                </div>
                <textarea
                  value={pasteData}
                  onChange={e => setPasteData(e.target.value)}
                  placeholder={"Amit Kumar, 9876543210, amit@email.com\nPriya Singh, 8765432109\nRajesh Verma, 7654321098, rajesh@email.com"}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                />
                <button
                  onClick={handleBulkPaste}
                  disabled={bulkUploading || !pasteData.trim()}
                  className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bulkUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding Leads...</> : <><Plus className="h-4 w-4" /> Add All Leads</>}
                </button>
              </div>
            )}

            {/* Result */}
            {bulkResult && (
              <div className={`mt-4 p-4 rounded-lg ${bulkResult.added > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-sm font-medium ${bulkResult.added > 0 ? "text-green-700" : "text-red-700"}`}>
                  {bulkResult.added > 0 ? `${bulkResult.added} leads successfully added!` : "No leads were added."}
                  {bulkResult.skipped > 0 && ` (${bulkResult.skipped} skipped)`}
                </p>
                {bulkResult.errors && bulkResult.errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    {bulkResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 w-10"><input type="checkbox" checked={selectedIds.length === leads.length && leads.length > 0} onChange={toggleAll} /></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Interest</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned To</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Follow-up</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(l.id)} onChange={() => toggleSelect(l.id)} /></td>
                <td className="px-4 py-3">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-gray-500">{l.email} | {l.phone}</div>
                </td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{l.source}</span></td>
                <td className="px-4 py-3 text-xs">{l.university_interest} {l.course_interest && `/ ${l.course_interest}`}</td>
                <td className="px-4 py-3 text-xs">{l.assigned_name || "Unassigned"}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs capitalize ${STATUS_COLORS[l.status] || "bg-gray-100 text-gray-600"}`}>{l.status}</span></td>
                <td className="px-4 py-3 text-xs">{l.follow_up_date ? formatDate(l.follow_up_date) : "N/A"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openFollowUps(l)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Follow-ups"><MessageSquare className="h-4 w-4" /></button>
                    <button onClick={() => openHistory(l)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="History"><History className="h-4 w-4" /></button>
                    <button onClick={() => edit(l)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => del(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-500">No leads found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
