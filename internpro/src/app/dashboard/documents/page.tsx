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
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [form, setForm] = useState({ type: "resume", title: "", fileUrl: "" });

  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

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
      } else {
        alert("File upload failed. Try again.");
      }
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
    fetchDocuments();
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-600">Upload your documents for verification. Admin will review them.</p>
      </div>

      {/* Upload Form */}
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

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-gray-500">No documents uploaded yet. Upload your resume and other documents to apply for internships.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4">
                    <a href={doc.fileUrl} target="_blank" className="text-indigo-600 hover:underline font-medium">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
