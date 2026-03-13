import { useState, useEffect, useCallback } from "react";
import api, { getUser } from "../../lib/api";
import { FileText, Upload, Download, Eye, X, Search } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function CenterDocuments() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState<Record<string, any>>({});
  const user = getUser();
  const centerId = user?.center?.id;

  const fetchStudents = useCallback(() => {
    if (!centerId) return;
    setLoading(true);
    api.get(`/api/centers/${centerId}/students`, { params: { search, limit: 100 } })
      .then(r => setStudents(r.data.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [centerId, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchDocuments = (studentId: number) => {
    api.get(`/api/documents/student/${studentId}`)
      .then(r => setDocuments(r.data.documents || r.data || []))
      .catch(() => setDocuments([]));
  };

  const selectStudent = (s: any) => {
    setSelectedStudent(s);
    fetchDocuments(s.id);
  };

  const handleUpload = async () => {
    if (!selectedStudent || !uploadForm.file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadForm.file);
      fd.append("document_type", uploadForm.document_type || "other");
      fd.append("student_id", selectedStudent.id.toString());
      await api.post("/api/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      fetchDocuments(selectedStudent.id);
      setShowUpload(false);
      setUploadForm({});
    } catch (err: any) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <p className="text-sm text-gray-500">Manage student documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Student List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p className="text-center py-4 text-gray-400 text-sm">Loading...</p>
            ) : students.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-sm">No students found</p>
            ) : students.map(s => (
              <button key={s.id} onClick={() => selectStudent(s)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${selectedStudent?.id === s.id ? "bg-emerald-50 border border-emerald-200" : "hover:bg-gray-50 border border-transparent"}`}>
                <p className="font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500">{s.enrollment_no || s.phone}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {!selectedStudent ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a student to view documents</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">{selectedStudent.name}</h2>
                  <p className="text-xs text-gray-500">{selectedStudent.enrollment_no} | {selectedStudent.phone}</p>
                </div>
                <button onClick={() => setShowUpload(true)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-emerald-700">
                  <Upload className="h-4 w-4" /> Upload
                </button>
              </div>
              {documents.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.document_type || doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {doc.file_url && (
                          <>
                            <a href={doc.file_url.startsWith("/") ? API + doc.file_url : doc.file_url} target="_blank" rel="noreferrer"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="h-4 w-4" /></a>
                            <a href={doc.file_url.startsWith("/") ? API + doc.file_url : doc.file_url} download
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><Download className="h-4 w-4" /></a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select value={uploadForm.document_type || ""} onChange={e => setUploadForm(f => ({ ...f, document_type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select Type</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="photo">Photo</option>
                  <option value="marksheet">Marksheet</option>
                  <option value="certificate">Certificate</option>
                  <option value="signature">Signature</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input type="file" onChange={e => setUploadForm(f => ({ ...f, file: e.target.files?.[0] }))}
                  className="w-full text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleUpload} disabled={uploading || !uploadForm.file}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700">
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
