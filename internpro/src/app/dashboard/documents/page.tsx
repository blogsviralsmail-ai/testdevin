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
  const [form, setForm] = useState({ type: "resume", title: "", fileUrl: "" });

  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

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
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
            className="px-3 py-2 rounded-lg border">
            <option value="resume">Resume / CV</option>
            <option value="marksheet">Marksheet</option>
            <option value="id_card">ID Card</option>
            <option value="photo">Passport Photo</option>
            <option value="aadhar">Aadhar Card</option>
            <option value="other">Other</option>
          </select>
          <input type="text" placeholder="Document Title" value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            className="px-3 py-2 rounded-lg border" required />
          <input type="url" placeholder="File URL (upload link)" value={form.fileUrl}
            onChange={(e) => setForm({...form, fileUrl: e.target.value})}
            className="px-3 py-2 rounded-lg border" required />
          <button type="submit" disabled={uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {uploading ? "Uploading..." : "Submit"}
          </button>
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
