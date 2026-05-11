"use client";

import { useState, useEffect, useCallback } from "react";
import { getDomainLabel, getModeLabel, getFeeTypeLabel, formatCurrency } from "@/lib/utils";

import DataToolbar from "@/components/DataToolbar";
import { exportToCSV, exportToPDF, buildTableHTML } from "@/lib/export-utils";
interface Program {
  id: string;
  title: string;
  domain: string;
  mode: string;
  duration: number;
  feeType: string;
  feeAmount: number;
  stipendAmount: number;
  maxSeats: number;
  isPublished: boolean;
  thumbnail: string | null;
  organization: { name: string };
  batches: { id: string; name: string; isActive: boolean; _count: { enrollments: number } }[];
}

interface UserSession { id: string; role: string; }

export default function ProgramsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<UserSession | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", domain: "web-dev", customDomain: "", mode: "online", duration: "90",
    feeType: "free", feeAmount: "0", stipendAmount: "0", maxSeats: "50", thumbnail: "",
  });
  const [uploading, setUploading] = useState(false);

  const fetchPrograms = useCallback(async () => {
    const res = await fetch("/api/programs");
    if (res.ok) setPrograms(await res.json());
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => d && setUser(d.user)).catch(() => {});
  }, [fetchPrograms]);

  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isTL = user?.role === "teamleader";

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setForm((prev) => ({ ...prev, thumbnail: data.url }));
    }
    setUploading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const submitData = { ...form, domain: form.domain === "other" && form.customDomain.trim() ? form.customDomain.trim() : form.domain };
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ title: "", description: "", domain: "web-dev", customDomain: "", mode: "online", duration: "90", feeType: "free", feeAmount: "0", stipendAmount: "0", maxSeats: "50", thumbnail: "" });
      fetchPrograms();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create program");
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await fetch(`/api/programs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    fetchPrograms();
  };

  const deleteProgram = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all batches, tasks, resources, and quizzes under this program.`)) return;
    const res = await fetch(`/api/programs/${id}`, { method: "DELETE" });
    if (res.ok) fetchPrograms();
    else { const data = await res.json(); alert(data.error || "Failed to delete"); }
  };

  const getFilteredForExport = () => {
    return (programs || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "Programs", [{ key: "title", label: "Title" }, { key: "domain", label: "Domain" }, { key: "duration", label: "Duration" }, { key: "mode", label: "Mode" }, { key: "feeType", label: "Fee Type" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "title", label: "Title" }, { key: "domain", label: "Domain" }, { key: "duration", label: "Duration" }, { key: "mode", label: "Mode" }, { key: "feeType", label: "Fee Type" }];
    exportToPDF("Programs", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Programs</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search programs..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
          <p className="text-slate-400 text-sm">Manage your internship programs</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2] transition">
            {showForm ? "Cancel" : "+ New Program"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border border-white/[0.06] mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Program</h2>
          {error && <p className="text-red-400 text-sm mb-4 bg-transparent p-2 rounded">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Domain</label>
              <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                {["web-dev", "app-dev", "data-science", "ai-ml", "marketing", "design", "content-writing", "graphic-design", "video-editing", "cyber-security", "seo", "social-media", "cloud-computing", "devops", "blockchain", "iot", "robotics", "hr", "finance", "sales", "other"].map((d) => (
                  <option key={d} value={d}>{getDomainLabel(d)}</option>
                ))}
              </select>
              {form.domain === "other" && (
                <input value={form.customDomain} onChange={(e) => setForm({ ...form, customDomain: e.target.value })} placeholder="Enter custom domain name" className="w-full px-3 py-2 border rounded-lg text-sm text-white mt-2" required />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mode</label>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Duration (days)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fee Type</label>
              <select value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                <option value="free">Free — No charge, no stipend</option>
                <option value="paid">Paid — Student pays fee to company</option>
                <option value="stipend">Stipend — Company pays student monthly</option>
              </select>
            </div>
            {form.feeType === "paid" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fee Amount (₹)</label>
                <input type="number" value={form.feeAmount} onChange={(e) => setForm({ ...form, feeAmount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            )}
            {form.feeType === "stipend" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Stipend/Month (₹)</label>
                <input type="number" value={form.stipendAmount} onChange={(e) => setForm({ ...form, stipendAmount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Max Seats</label>
              <input type="number" value={form.maxSeats} onChange={(e) => setForm({ ...form, maxSeats: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Thumbnail Photo</label>
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleThumbnailUpload(e.target.files[0]); }}
                className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
              {uploading && <p className="text-xs text-[#60a5fa] mt-1">Uploading...</p>}
              {form.thumbnail && <img src={form.thumbnail} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
          </div>
          <button type="submit" className="mt-4 bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2] transition">Create Program</button>
        </form>
      )}

      <div className="grid gap-4">
        {programs.length === 0 ? (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 border border-white/[0.06] text-center">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-slate-400">No programs yet. Create your first program!</p>
          </div>
        ) : (
          programs.map((program) => {
            const totalStudents = program.batches.reduce((sum, b) => sum + b._count.enrollments, 0);
            return (
              <div key={program.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border border-white/[0.06] card-hover">
                <div className="flex items-start justify-between">
                  {program.thumbnail && (
                    <img src={program.thumbnail} alt={program.title} className="w-16 h-16 object-cover rounded-lg mr-4 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{program.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${program.isPublished ? "bg-emerald-500/10 text-emerald-400" : "bg-transparent text-slate-400"}`}>
                        {program.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs bg-transparent text-[#22d3ee] px-2 py-1 rounded">{getDomainLabel(program.domain)}</span>
                      <span className="text-xs bg-transparent text-[#60a5fa] px-2 py-1 rounded">{getModeLabel(program.mode)}</span>
                      <span className="text-xs bg-transparent text-[#a78bfa] px-2 py-1 rounded">{program.duration} days</span>
                      <span className="text-xs bg-transparent text-emerald-400 px-2 py-1 rounded">{getFeeTypeLabel(program.feeType)}{program.feeType === "paid" ? ` - ${formatCurrency(program.feeAmount)}` : program.feeType === "stipend" ? ` - ${formatCurrency(program.stipendAmount)}/mo` : ""}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <span>👥 {totalStudents}/{program.maxSeats} students</span>
                      <span>📦 {program.batches.length} batches</span>
                      <span>🏢 {program.organization.name}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => togglePublish(program.id, program.isPublished)} className="text-sm text-[#22d3ee] hover:text-[#0EA5B8]">
                        {program.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => deleteProgram(program.id, program.title)} className="text-sm text-red-400 hover:text-red-800">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
