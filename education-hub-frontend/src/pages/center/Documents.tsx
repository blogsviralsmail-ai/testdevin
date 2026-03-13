import { useState, useEffect, useCallback } from "react";
import api, { getUser } from "../../lib/api";
import { FileText, Upload, Eye, X, Search, CheckCircle, XCircle, Calendar, StickyNote, Phone } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

const DOC_TYPES = ["Marksheet", "Original Degree", "Transcript", "Bonafide Letter", "Duplicate Degree", "Duplicate Marksheet", "Aadhar Card", "Photo", "Certificate", "Signature", "Other"];
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
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [matchedStudents, setMatchedStudents] = useState<any[]>([]);
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
    setUploadForm(prev => ({ ...prev, phone }));
    setSelectedStudent(null);
    if (phone.length >= 3) {
      const matches = students.filter(s => (s.phone || "").includes(phone) || (s.name || "").toLowerCase().includes(phone.toLowerCase()));
      setMatchedStudents(matches.slice(0, 10));
      if (phone.length >= 10) {
        const exact = matches.find((s: any) => s.phone === phone);
        if (exact) { setSelectedStudent(exact); setMatchedStudents([]); }
      }
    } else { setMatchedStudents([]); }
  };

  const selectStudentForUpload = (s: any) => {
    setSelectedStudent(s);
    setUploadForm(prev => ({ ...prev, phone: s.phone || "" }));
    setMatchedStudents([]);
  };

  const handleUpload = async () => {
    if (!selectedStudent || !uploadForm.file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadForm.file);
      const uploadRes = await api.post("/api/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const fileUrl = uploadRes.data.url || uploadRes.data.filename || "";
      await api.post("/api/documents", {
        student_id: selectedStudent.id,
        doc_type: uploadForm.document_type || "other",
        file_path: fileUrl,
        status: "approved",
        notes: uploadForm.notes || "",
      });
      loadDocs();
      setShowUpload(false);
      setUploadForm({});
      setSelectedStudent(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
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
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-7 w-7 text-orange-600" /> Documents ({docs.length})
        </h1>
        <button onClick={() => { setShowUpload(true); setUploadForm({}); setSelectedStudent(null); setMatchedStudents([]); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium">
          <Upload className="h-4 w-4" /> Upload Document
        </button>
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Document</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Student</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Mobile</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Date & Note</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">File</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No documents found</td></tr>
            ) : docs.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">{(d.doc_type || d.document_type || "").replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-500">#{d.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.student_name || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{d.student_phone || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABELS[d.status] || d.status}
                  </span>
                </td>
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
                        <button onClick={() => handleApprove(d.id)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 inline-flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />Approve
                        </button>
                        <button onClick={() => handleReject(d.id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 inline-flex items-center gap-1">
                          <XCircle className="h-3 w-3" />Reject
                        </button>
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

      {/* Dispatch Modal */}
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
                <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select Status</option>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={statusForm.date} onChange={e => setStatusForm({ ...statusForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
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

      {/* Upload Document Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Document</h2>
              <button onClick={() => { setShowUpload(false); setMatchedStudents([]); setSelectedStudent(null); }}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student (search by phone or name)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input type="text" value={uploadForm.phone || ""} onChange={(e) => searchByPhone(e.target.value)}
                    placeholder="Enter mobile number or name..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                </div>
                {matchedStudents.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {matchedStudents.map((s: any) => (
                      <button key={s.id} onClick={() => selectStudentForUpload(s)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-0">
                        <span className="font-medium">{s.name}</span> <span className="text-gray-500">| {s.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedStudent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <span className="text-green-700 font-medium">Student: {selectedStudent.name}</span>{" "}
                  <span className="text-green-600">({selectedStudent.phone})</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select value={uploadForm.document_type || ""} onChange={e => setUploadForm(f => ({ ...f, document_type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select Type</option>
                  {DOC_TYPES.map((t) => <option key={t} value={t.toLowerCase().replace(/\s+/g, "_")}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={uploadForm.notes || ""} onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (PDF/Image)</label>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 text-sm w-fit">
                  <Upload className="h-4 w-4" />
                  {uploadForm.file ? uploadForm.file.name : "Choose File"}
                  <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                    onChange={(e) => setUploadForm(f => ({ ...f, file: e.target.files?.[0] }))} />
                </label>
              </div>
              <button onClick={handleUpload} disabled={uploading || !selectedStudent || !uploadForm.file}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 text-sm">
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
