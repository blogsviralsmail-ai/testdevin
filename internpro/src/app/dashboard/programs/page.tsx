"use client";

import { useState, useEffect, useCallback } from "react";
import { getDomainLabel, getModeLabel, getFeeTypeLabel, formatCurrency } from "@/lib/utils";

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
  organization: { name: string };
  batches: { id: string; name: string; isActive: boolean; _count: { enrollments: number } }[];
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", domain: "web-dev", mode: "online", duration: "90",
    feeType: "free", feeAmount: "0", stipendAmount: "0", maxSeats: "50",
  });

  const fetchPrograms = useCallback(async () => {
    const res = await fetch("/api/programs");
    if (res.ok) setPrograms(await res.json());
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ title: "", description: "", domain: "web-dev", mode: "online", duration: "90", feeType: "free", feeAmount: "0", stipendAmount: "0", maxSeats: "50" });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600 text-sm">Manage your internship programs</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
          {showForm ? "Cancel" : "+ New Program"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Program</h2>
          {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                {["web-dev", "app-dev", "data-science", "ai-ml", "marketing", "design", "content-writing", "graphic-design", "video-editing", "cyber-security", "seo", "social-media", "cloud-computing", "devops", "blockchain", "iot", "robotics", "hr", "finance", "sales", "other"].map((d) => (
                  <option key={d} value={d}>{getDomainLabel(d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
              <select value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                <option value="free">Free — No charge, no stipend</option>
                <option value="paid">Paid — Student pays fee to company</option>
                <option value="stipend">Stipend — Company pays student monthly</option>
              </select>
            </div>
            {form.feeType === "paid" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (₹)</label>
                <input type="number" value={form.feeAmount} onChange={(e) => setForm({ ...form, feeAmount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            )}
            {form.feeType === "stipend" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stipend/Month (₹)</label>
                <input type="number" value={form.stipendAmount} onChange={(e) => setForm({ ...form, stipendAmount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Seats</label>
              <input type="number" value={form.maxSeats} onChange={(e) => setForm({ ...form, maxSeats: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">Create Program</button>
        </form>
      )}

      <div className="grid gap-4">
        {programs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-600">No programs yet. Create your first program!</p>
          </div>
        ) : (
          programs.map((program) => {
            const totalStudents = program.batches.reduce((sum, b) => sum + b._count.enrollments, 0);
            return (
              <div key={program.id} className="bg-white rounded-xl p-6 border border-gray-100 card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${program.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {program.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{getDomainLabel(program.domain)}</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{getModeLabel(program.mode)}</span>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">{program.duration} days</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">{getFeeTypeLabel(program.feeType)}{program.feeType === "paid" ? ` - ${formatCurrency(program.feeAmount)}` : program.feeType === "stipend" ? ` - ${formatCurrency(program.stipendAmount)}/mo` : ""}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>👥 {totalStudents}/{program.maxSeats} students</span>
                      <span>📦 {program.batches.length} batches</span>
                      <span>🏢 {program.organization.name}</span>
                    </div>
                  </div>
                  <button onClick={() => togglePublish(program.id, program.isPublished)} className="text-sm text-indigo-600 hover:text-indigo-800">
                    {program.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
