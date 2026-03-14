import { useState, useEffect, useCallback } from "react";
import api, { getUser } from "../../lib/api";
import { Plus, X, FileText, Upload, CheckCircle, XCircle, Eye, Search, Trash2, Phone, Calendar, StickyNote } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

const DOC_TYPES = ["Marksheet", "Original Degree", "Transcript", "Bonafide Letter", "Duplicate Degree", "Duplicate Marksheet"];
const ALL_STATUSES = ["pending_review", "approved", "rejected", "pending", "processing", "office_received", "online_available", "dispatched", "received"];
const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending Review", approved: "Approved", rejected: "Rejected", pending: "Pending",
  processing: "Processing", office_received: "Office Received", online_available: "Online Available",
  dispatched: "Dispatched", received: "Received"
};
const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700", received: "bg-green-100 text-green-700",
  dispatched: "bg-blue-100 text-blue-700", rejected: "bg-red-100 text-red-700",
  processing: "bg-yellow-100 text-yellow-700", office_received: "bg-indigo-100 text-indigo-700",
  online_available: "bg-teal-100 text-teal-700", pending_review: "bg-orange-100 text-orange-700",
  pending: "bg-gray-100 text-gray-700"
};
const formatDate = (d: string) => {
  if (!d) return "";
  try { const dt = new Date(d.replace(" ", "T")); return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

export default function CenterDocuments() {
  const [docs, setDocs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: "", document_type: "marksheet", notes: "", phone: "", fee_access: "without_fees", fee_percent_required: "" as string | number });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [matchedStudents, setMatchedStudents] = useState<any[]>([]);
  const [studentName, setStudentName] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDispatch, setShowDispatch] = useState<number | null>(null);
  const [dispatchForm, setDispatchForm] = useState({ date: new Date().toISOString().split("T")[0], note: "" });
  const [showStatusChange, setShowStatusChange] = useState<number | null>(null);
  const [statusForm, setStatusForm] = useState({ status: "", date: new Date().toISOString().split("T")[0], note: "" });
  const user = getUser();
  const centerId = user?.center?.id;

  const fetchStudents = useCallback(() => {
    if (!centerId) return;
    api.get(`/api/centers/${centerId}/students`, { params: { limit: 500 } })
      .then(r => setStudents(r.data.students || []))
      .catch(() => {});
  }, [centerId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const loadDocs = useCallback(() => {
    if (!centerId) return;
    setLoading(true);
    api.get(`/api/centers/${centerId}/students`, { params: { limit: 500 } })
      .then(async (r) => {
        const studentList = r.data.students || [];
        const allDocs: any[] = [];
        const promises = studentList.map((s: any) =>
          api.get(`/api/documents/student/${s.id}`)
            .then(res => {
              const studentDocs = res.data.documents || res.data || [];
              studentDocs.forEach((d: any) => {
                allDocs.push({ ...d, student_name: s.name, student_phone: s.phone, student_id: s.id });
              });
            })
            .catch(() => {})
        );
        await Promise.all(promises);
        let filtered = allDocs;
        if (filterType) filtered = filtered.filter(d => (d.doc_type || "").toLowerCase() === filterType.toLowerCase());
        if (filterStatus) filtered = filtered.filter(d => d.status === filterStatus);
        if (phoneSearch) filtered = filtered.filter(d => (d.student_phone || "").includes(phoneSearch));
        filtered.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        setDocs(filtered);
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [centerId, filterType, filterStatus, phoneSearch]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const searchByPhone = (phone: string) => {
    setForm(prev => ({ ...prev, phone }));
    setStudentName("");
    if (phone.length >= 3) {
      const matches = students.filter(s => (s.phone || "").includes(phone) || (s.name || "").toLowerCase().includes(phone.toLowerCase()));
      setMatchedStudents(matches.slice(0, 10));
      if (phone.length >= 10) {
        const exact = matches.find((s: any) => s.phone === phone);
        if (exact) { setForm(prev => ({ ...prev, student_id: exact.id.toString() })); setStudentName(exact.name); setMatchedStudents([]); }
      }
    } else { setMatchedStudents([]); }
  };

  const selectStudent = (s: any) => {
    setForm(prev => ({ ...prev, student_id: s.id.toString(), phone: s.phone || "" }));
    setStudentName(s.name);
    setMatchedStudents([]);
  };

  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(prev => prev.length === docs.length ? [] : docs.map(d => d.id));
  const bulkDelete = async () => {
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} documents?`)) return;
    try {
      await api.delete("/api/documents/bulk", { data: { ids: selectedIds } });
      setSelectedIds([]);
      loadDocs();
    } catch { alert("Delete failed"); }
  };

  const handleSave = async () => {
    let file_path = "";
    if (uploadFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", uploadFile);
        const res = await api.post("/api/documents/upload", fd);
        file_path = res.data.url || res.data.file_path || "";
      } catch { /* empty */ }
      setUploading(false);
    }
    try {
      await api.post("/api/documents", {
        student_id: form.student_id ? parseInt(form.student_id) : null,
        doc_type: form.document_type,
        file_path,
        status: "approved",
        notes: form.notes,
        fee_access: form.fee_access,
        fee_percent_required: form.fee_access === "after_fees" ? (Number(form.fee_percent_required) || 0) : 0,
      });
      setShowForm(false);
      setUploadFile(null);
      setStudentName("");
      setMatchedStudents([]);
      loadDocs();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to add document");
    }
  };

  const handleApprove = async (id: number) => {
    try { await api.put(`/api/documents/${id}/approve`); loadDocs(); } catch { alert("Approve failed"); }
  };
  const handleReject = async (id: number) => {
    try { await api.put(`/api/documents/${id}/reject`); loadDocs(); } catch { alert("Reject failed"); }
  };
  const handleDispatchSubmit = async () => {
    if (!showDispatch) return;
    try {
      await api.put(`/api/documents/${showDispatch}/dispatch`, { date: dispatchForm.date, note: dispatchForm.note });
      setShowDispatch(null); setDispatchForm({ date: new Date().toISOString().split("T")[0], note: "" }); loadDocs();
    } catch { alert("Dispatch failed"); }
  };
  const handleStatusChangeSubmit = async () => {
    if (!showStatusChange || !statusForm.status) return;
    try {
      await api.put(`/api/documents/${showStatusChange}/status`, { status: statusForm.status, date: statusForm.date, note: statusForm.note });
      setShowStatusChange(null); setStatusForm({ status: "", date: new Date().toISOString().split("T")[0], note: "" }); loadDocs();
    } catch { alert("Status change failed"); }
  };
  const handleReceive = async (id: number) => {
    try { await api.put(`/api/documents/${id}/receive`, { date: new Date().toISOString().split("T")[0] }); loadDocs(); } catch { alert("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="h-7 w-7 text-orange-600" /> Documents ({docs.length})</h1>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <button onClick={bulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1">
              <Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})
            </button>
          )}
          <button onClick={() => { setShowForm(true); setForm({ student_id: "", document_type: "marksheet", notes: "", phone: "", fee_access: "without_fees", fee_percent_required: "" }); setStudentName(""); setUploadFile(null); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="h-4 w-4" /> Add Document
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input type="text" value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} placeholder="Search by mobile number..."
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg w-full text-sm outline-none" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
          <option value="">All Types</option>
          {DOC_TYPES.map((t) => <option key={t} value={t.toLowerCase().replace(/\s+/g, "_")}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
          <option value="">All Status</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 w-10"><input type="checkbox" checked={selectedIds.length === docs.length && docs.length > 0} onChange={toggleAll} /></th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Document</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Student</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Mobile</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Date & Note</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">File</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No documents found</td></tr>
            ) : docs.map((d) => (
              <tr key={d.id} className={`hover:bg-gray-50 ${selectedIds.includes(d.id) ? "bg-blue-50" : ""}`}>
                <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => toggleSelect(d.id)} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-orange-100 rounded-lg flex items-center justify-center"><FileText className="h-4 w-4 text-orange-600" /></div>
                    <div><p className="font-medium text-sm capitalize">{(d.doc_type || d.document_type || "").replace(/_/g, " ")}</p><p className="text-xs text-gray-500">#{d.id}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{d.student_name || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{d.student_phone || "-"}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-700"}`}>{STATUS_LABELS[d.status] || d.status}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                  {d.status_date && <div className="font-medium text-gray-700">Date: {formatDate(d.status_date)}</div>}
                  {d.dispatched_date && <div>Dispatched: {formatDate(d.dispatched_date)}</div>}
                  {d.received_date && <div>Received: {formatDate(d.received_date)}</div>}
                  {d.notes && <div className="text-indigo-600 mt-0.5">Note: {d.notes}</div>}
                  {d.created_at && <div className="text-gray-400">Created: {formatDate(d.created_at)}</div>}
                </td>
                <td className="px-4 py-3 text-sm hidden lg:table-cell">
                  {(d.file_path || d.file_url) ? (
                    <a href={((d.file_path || d.file_url) || "").startsWith("/") ? API + (d.file_path || d.file_url) : (d.file_path || d.file_url)}
                      target="_blank" rel="noreferrer"
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />View
                    </a>
                  ) : "\u2014"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {d.status === "pending_review" && (
                      <>
                        <button onClick={() => handleApprove(d.id)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 inline-flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approve</button>
                        <button onClick={() => handleReject(d.id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 inline-flex items-center gap-1"><XCircle className="h-3 w-3" />Reject</button>
                      </>
                    )}
                    {d.status !== "dispatched" && d.status !== "received" && d.status !== "pending_review" && (
                      <button onClick={() => { setShowDispatch(d.id); setDispatchForm({ date: new Date().toISOString().split("T")[0], note: "" }); }}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />Dispatch
                      </button>
                    )}
                    {d.status === "dispatched" && (
                      <button onClick={() => handleReceive(d.id)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 inline-flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />Received
                      </button>
                    )}
                    <button onClick={() => { setShowStatusChange(d.id); setStatusForm({ status: "", date: new Date().toISOString().split("T")[0], note: "" }); }}
                      className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 inline-flex items-center gap-1">
                      <StickyNote className="h-3 w-3" />Status
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dispatch Modal with Date & Note */}
      {showDispatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Dispatch Document</h2>
              <button onClick={() => setShowDispatch(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Date</label>
                <input type="date" value={dispatchForm.date} onChange={e => setDispatchForm({ ...dispatchForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <textarea value={dispatchForm.note} onChange={e => setDispatchForm({ ...dispatchForm, note: e.target.value })}
                  placeholder="e.g. Sent via courier, tracking #123..." rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <button onClick={handleDispatchSubmit} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Mark as Dispatched
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusChange !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Change Document Status</h2>
              <button onClick={() => setShowStatusChange(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select Status</option>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={statusForm.date} onChange={e => setStatusForm({ ...statusForm, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <textarea value={statusForm.note} onChange={e => setStatusForm({ ...statusForm, note: e.target.value })}
                  placeholder="Add a note about this status change..." rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <button onClick={handleStatusChangeSubmit} disabled={!statusForm.status}
                className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal — matching admin exactly */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Document</h2>
              <button onClick={() => { setShowForm(false); setMatchedStudents([]); setStudentName(""); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Mobile Number</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input type="text" value={form.phone} onChange={(e) => searchByPhone(e.target.value)}
                    placeholder="Enter mobile number to find student..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                </div>
                {matchedStudents.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {matchedStudents.map((s: any) => (
                      <button key={s.id} onClick={() => selectStudent(s)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-0">
                        <span className="font-medium">{s.name}</span> <span className="text-gray-500">| {s.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {studentName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <span className="text-green-700 font-medium">Student: {studentName}</span>{" "}
                  <span className="text-green-600">(ID: {form.student_id})</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
                  {DOC_TYPES.map((t) => <option key={t} value={t.toLowerCase().replace(/\s+/g, "_")}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Access Control</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="fee_access" value="without_fees" checked={form.fee_access === "without_fees"}
                      onChange={() => setForm({ ...form, fee_access: "without_fees", fee_percent_required: 0 })} className="text-blue-600" />
                    <span className="text-sm">Without Fees (Free Access)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="fee_access" value="after_fees" checked={form.fee_access === "after_fees"}
                      onChange={() => setForm({ ...form, fee_access: "after_fees" })} className="text-blue-600" />
                    <span className="text-sm">After Fees</span>
                  </label>
                </div>
                {form.fee_access === "after_fees" && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Required Fee % (student must pay this % of total fees to view)</label>
                    <input type="number" min="1" max="100" value={form.fee_percent_required}
                      onChange={(e) => setForm({ ...form, fee_percent_required: e.target.value === "" ? "" : parseInt(e.target.value) || 0 })}
                      placeholder="e.g. 80, 90, 100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document (PDF/Image)</label>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 text-sm w-fit">
                  <Upload className="h-4 w-4" />
                  {uploadFile ? uploadFile.name : "Choose File"}
                  <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <button onClick={handleSave} disabled={uploading || !form.student_id}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm">
                {uploading ? "Uploading..." : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
