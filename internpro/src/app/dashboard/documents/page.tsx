"use client";

import { useState, useEffect, useCallback } from "react";

interface Document {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  status: string;
  remarks: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

interface UserSession { id: string; role: string; }

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [form, setForm] = useState({ type: "resume", title: "", fileUrl: "" });
  const [user, setUser] = useState<UserSession | null>(null);
  const [reviewDoc, setReviewDoc] = useState<Document | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: "approved", remarks: "" });
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    const [docRes, meRes] = await Promise.all([
      fetch("/api/documents"),
      fetch("/api/auth/me"),
    ]);
    if (docRes.ok) setDocuments(await docRes.json());
    if (meRes.ok) { const d = await meRes.json(); setUser(d.user); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isTL = user?.role === "teamleader";

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert("File must be less than 10MB"); return; }
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, fileUrl: data.url }));
      } else { alert("File upload failed. Try again."); }
    } catch { alert("Upload error. Please try again."); }
    setFileUploading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.fileUrl) return;
    setUploading(true);
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ type: "resume", title: "", fileUrl: "" });
    setUploading(false);
    fetchData();
  };

  const handleReview = async () => {
    if (!reviewDoc) return;
    await fetch("/api/documents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewDoc.id, status: reviewForm.status, remarks: reviewForm.remarks }),
    });
    setReviewDoc(null);
    setReviewForm({ status: "approved", remarks: "" });
    fetchData();
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filtered = documents.filter(d => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = d.user?.name?.toLowerCase().includes(q);
      const emailMatch = d.user?.email?.toLowerCase().includes(q);
      const titleMatch = d.title.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !titleMatch) return false;
    }
    return true;
  });

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isStudent ? "My Documents" : "Student Documents"}
        </h1>
        <p className="text-gray-600">
          {isStudent ? "Upload your documents for verification." : "Review and verify student-submitted documents."}
        </p>
      </div>

      {/* Upload Form — Students only */}
      {isStudent && (
        <div className="bg-white rounded-xl p-6 border mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
                className="px-3 py-2 rounded-lg border text-sm">
                <option value="resume">Resume / CV</option>
                <option value="marksheet">Marksheet</option>
                <option value="id_card">ID Card</option>
                <option value="photo">Passport Photo</option>
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="certificate">Certificate</option>
                <option value="other">Other</option>
              </select>
              <input type="text" placeholder="Document Title" value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                className="px-3 py-2 rounded-lg border text-sm" required />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Upload File</label>
                <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm" />
                <p className="text-xs text-gray-400 mt-0.5">PDF, Images, Docs — max 10MB</p>
                {fileUploading && <p className="text-xs text-blue-600 mt-0.5">Uploading file...</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Or paste a URL</label>
                <input type="url" placeholder="https://..." value={form.fileUrl}
                  onChange={(e) => setForm({...form, fileUrl: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-sm" />
              </div>
              {form.fileUrl && <span className="text-xs text-green-600 mt-4">File ready</span>}
              <button type="submit" disabled={uploading || !form.fileUrl}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
                {uploading ? "Submitting..." : "Submit Document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + Search — Admin/TL */}
      {(isAdmin || isTL) && (
        <div className="space-y-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {["pending", "approved", "rejected", "all"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${filterStatus === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {s === "all" ? `All (${documents.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${documents.filter(d => d.status === s).length})`}
              </button>
            ))}
          </div>
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, or document title..."
              className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900"
            />
          </div>
        </div>
      )}

      {/* Documents List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-gray-500">{isStudent ? "No documents uploaded yet." : "No documents to review."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {!isStudent && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                {(isAdmin || isTL) && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((doc) => (
                <tr key={doc.id}>
                  {!isStudent && (
                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium text-gray-900">{doc.user?.name}</p>
                      <p className="text-gray-500 text-xs">{doc.user?.email}</p>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <a href={doc.fileUrl} target="_blank" className="text-indigo-600 hover:underline font-medium text-sm">
                      {doc.title}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{doc.type.replace("_", " ")}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.remarks || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(doc.createdAt).toLocaleDateString("en-IN")}</td>
                  {(isAdmin || isTL) && (
                    <td className="px-6 py-4">
                      <button onClick={() => { setReviewDoc(doc); setReviewForm({ status: "approved", remarks: "" }); }}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700">
                        Review
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Review Document</h3>
            <p className="text-sm text-gray-600 mb-1"><strong>Student:</strong> {reviewDoc.user?.name}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Title:</strong> {reviewDoc.title}</p>
            <p className="text-sm text-gray-600 mb-3"><strong>Type:</strong> {reviewDoc.type.replace("_", " ")}</p>
            <a href={reviewDoc.fileUrl} target="_blank" className="text-indigo-600 hover:underline text-sm mb-4 block">View Document →</a>
            <div className="space-y-3">
              <select value={reviewForm.status} onChange={(e) => setReviewForm({...reviewForm, status: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border text-sm">
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="pending">Keep Pending</option>
              </select>
              <textarea placeholder="Remarks (optional)" value={reviewForm.remarks}
                onChange={(e) => setReviewForm({...reviewForm, remarks: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border text-sm" rows={3} />
              <div className="flex gap-2">
                <button onClick={handleReview}
                  className={`flex-1 py-2 text-white rounded-lg text-sm ${reviewForm.status === "approved" ? "bg-green-600 hover:bg-green-700" : reviewForm.status === "rejected" ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"}`}>
                  {reviewForm.status === "approved" ? "Approve" : reviewForm.status === "rejected" ? "Reject" : "Save"}
                </button>
                <button onClick={() => setReviewDoc(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
