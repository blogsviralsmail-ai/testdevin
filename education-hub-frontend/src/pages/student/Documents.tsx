import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { FileText, Upload, Loader2, Eye, Lock } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

interface Document {
  id: number;
  doc_type: string;
  doc_name: string;
  file_url: string;
  file_path: string;
  status: string;
  remarks: string;
  created_at: string;
  _locked?: boolean;
  _required_percent?: number;
  _paid_percent?: number;
  fee_access?: string;
}

export default function StudentDocuments() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("marksheet");
  const [docName, setDocName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showFeePopup, setShowFeePopup] = useState<Document | null>(null);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    try {
      const res = await api.get("/api/documents");
      setDocs(res.data);
    } catch { /* empty */ }
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await api.post("/api/documents/upload", fd);
      const fileUrl = uploadRes.data.url;

      // Get student id from logged-in student profile
      const studentRes = await api.get("/api/students/me");
      const studentId = studentRes.data?.id;
      if (!studentId) {
        alert("Student record not found. Please contact admin.");
        setUploading(false);
        return;
      }

      await api.post("/api/documents", {
        student_id: studentId,
        doc_type: docType,
        doc_name: docName || file.name,
        file_url: fileUrl,
      });
      setFile(null);
      setDocName("");
      loadDocs();
    } catch {
      alert("Upload failed");
    }
    setUploading(false);
  }

  const docTypes = ["marksheet", "certificate", "aadhar", "photo", "migration", "character_certificate", "transfer_certificate", "other"];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2"><FileText className="h-5 w-5 sm:h-6 sm:w-6" /> My Documents</h1>

      {/* Upload Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Upload Document</h2>
        <form onSubmit={handleUpload} className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              {docTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
            <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. 10th Marksheet" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required />
          </div>
          <button type="submit" disabled={uploading || !file} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </button>
        </form>
      </div>

      {/* Documents List - Cards on mobile, table on desktop */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-100">
          {docs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No documents found. Upload your documents above.</div>
          ) : docs.map(doc => (
            <div key={doc.id} className="p-3 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.doc_name || doc.doc_type?.replace(/_/g, " ") || "-"}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium capitalize">{doc.doc_type?.replace(/_/g, " ")}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      doc.status === "approved" ? "bg-green-50 text-green-700" :
                      doc.status === "rejected" ? "bg-red-50 text-red-700" :
                      doc.status === "office_received" ? "bg-blue-50 text-blue-700" :
                      doc.status === "online_available" ? "bg-indigo-50 text-indigo-700" :
                      doc.status === "dispatched" ? "bg-purple-50 text-purple-700" :
                      "bg-yellow-50 text-yellow-700"
                    }`}>{doc.status === "pending_review" ? "Under Review" : doc.status === "approved" ? "Approved" : doc.status === "rejected" ? "Rejected" : doc.status === "office_received" ? "Office Received" : doc.status === "online_available" ? "Online Available" : doc.status === "dispatched" ? "Dispatched" : doc.status === "pending" ? "Pending" : doc.status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || doc.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</p>
                </div>
                {doc._locked ? (
                  <button onClick={() => setShowFeePopup(doc)} className="flex items-center gap-1 text-xs text-red-600 flex-shrink-0 px-2 py-1 bg-red-50 rounded-lg">
                    <Lock className="h-3.5 w-3.5" /> Locked
                  </button>
                ) : (doc.file_url || doc.file_path) && (
                  <a href={(() => { const url = doc.file_url || doc.file_path; return url.startsWith("/") ? API + url : url; })()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0 px-2 py-1 bg-blue-50 rounded-lg">
                    <Eye className="h-3.5 w-3.5" /> View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-[640px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {docs.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium capitalize">{doc.doc_type?.replace(/_/g, " ")}</span>
                </td>
                <td className="px-4 py-3 font-medium text-sm">{doc.doc_name || doc.doc_type?.replace(/_/g, " ") || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    doc.status === "approved" ? "bg-green-50 text-green-700" :
                    doc.status === "rejected" ? "bg-red-50 text-red-700" :
                    doc.status === "office_received" ? "bg-blue-50 text-blue-700" :
                    doc.status === "online_available" ? "bg-indigo-50 text-indigo-700" :
                    doc.status === "dispatched" ? "bg-purple-50 text-purple-700" :
                    "bg-yellow-50 text-yellow-700"
                  }`}>{doc.status === "pending_review" ? "Under Review" : doc.status === "approved" ? "Approved" : doc.status === "rejected" ? "Rejected" : doc.status === "office_received" ? "Office Received" : doc.status === "online_available" ? "Online Available" : doc.status === "dispatched" ? "Dispatched" : doc.status === "pending" ? "Pending" : doc.status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || doc.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td>
                <td className="px-4 py-3 text-right">
                  {doc._locked ? (
                    <button onClick={() => setShowFeePopup(doc)} className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                      <Lock className="h-4 w-4" /> Fees Required
                    </button>
                  ) : (doc.file_url || doc.file_path) && (
                    <a href={(() => { const url = doc.file_url || doc.file_path; return url.startsWith("/") ? API + url : url; })()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" /> View
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No documents found. Upload your documents above.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
      {/* Fee Required Popup */}
      {showFeePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Fees Payment Required</h2>
            <p className="text-sm text-gray-600 mb-4">
              This document requires <span className="font-bold text-red-600">{showFeePopup._required_percent}%</span> fee payment to view.
              {showFeePopup._paid_percent !== undefined && (
                <> You have paid <span className="font-bold text-green-600">{showFeePopup._paid_percent?.toFixed(1)}%</span> so far.</>)}
            </p>
            <p className="text-xs text-gray-500 mb-4">Please pay the required fees first, then you can access this document.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowFeePopup(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
              <button onClick={() => { setShowFeePopup(null); navigate("/student/fees"); }} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Pay Fees</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
