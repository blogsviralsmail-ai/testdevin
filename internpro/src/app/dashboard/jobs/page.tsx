"use client";
import { useState, useEffect } from "react";

interface JobApplication { id: string; userId: string; user?: { name: string; email: string; phone?: string }; resume?: string; coverNote?: string; status: string; createdAt: string; }
interface Job { id: string; title: string; company: string; description: string; location?: string; salary?: string; type: string; skills?: string; isActive: boolean; hasApplied: boolean; applicationCount: number; applications?: JobApplication[]; createdAt: string; }

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [skillFilter, setSkillFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewApplicants, setViewApplicants] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", company: "KKHS Media Private Limited", description: "", location: "", salary: "", type: "full-time", skills: "" });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user || d));
    fetchJobs();
  }, []);

  const fetchJobs = async () => { const r = await fetch("/api/jobs"); if (r.ok) setJobs(await r.json()); };

  const createJob = async () => {
    const r = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { setShowCreate(false); setForm({ title: "", company: "KKHS Media Private Limited", description: "", location: "", salary: "", type: "full-time", skills: "" }); fetchJobs(); }
  };

  const applyJob = async (id: string) => {
    const r = await fetch(`/api/jobs/${id}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (r.ok) fetchJobs(); else { const err = await r.json(); alert(err.error); }
  };

  const toggleJob = async (id: string, active: boolean) => {
    await fetch(`/api/jobs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !active }) });
    fetchJobs();
  };

  const deleteJob = async (id: string, title: string) => {
    if (!confirm(`Delete job "${title}"?`)) return;
    const r = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (r.ok) fetchJobs();
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
          <p className="text-sm text-gray-500">Placement opportunities for top performers</p>
        </div>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Post Job</button>}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input placeholder="Filter by skill..." value={skillFilter} onChange={e => setSkillFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-w-[200px]" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">All Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
          {(skillFilter || typeFilter !== "all") && <button onClick={() => { setSkillFilter(""); setTypeFilter("all"); }} className="text-xs text-indigo-600 hover:underline">Clear Filters</button>}
        </div>
      </div>

      {/* Applicants Modal */}
      {viewApplicants && (() => {
        const job = jobs.find(j => j.id === viewApplicants);
        if (!job || !job.applications) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Applicants — {job.title}</h2>
                <button onClick={() => setViewApplicants(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              {job.applications.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No applicants yet.</p>
              ) : (
                <div className="space-y-3">
                  {job.applications.map(app => (
                    <div key={app.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{app.user?.name || "Unknown"}</p>
                          <p className="text-sm text-gray-500">{app.user?.email}{app.user?.phone ? ` • ${app.user.phone}` : ""}</p>
                        </div>
                        <div className="flex gap-2">
                          {app.resume && <a href={app.resume} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Resume</a>}
                          <a href={`/portfolio/${app.userId}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Portfolio</a>
                        </div>
                      </div>
                      {app.coverNote && <p className="text-sm text-gray-600 mt-2">{app.coverNote}</p>}
                      <p className="text-xs text-gray-400 mt-1">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.filter(job => {
          if (typeFilter !== "all" && job.type !== typeFilter) return false;
          if (skillFilter && job.skills && !job.skills.toLowerCase().includes(skillFilter.toLowerCase())) return false;
          if (skillFilter && !job.skills) return false;
          return true;
        }).map(job => (
          <div key={job.id} className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm text-indigo-600">{job.company}</p>
              </div>
              {!job.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Closed</span>}
            </div>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {job.location && <span className="text-xs bg-gray-100 px-2 py-1 rounded">📍 {job.location}</span>}
              {job.salary && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">💰 {job.salary}</span>}
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{job.type}</span>
            </div>
            {job.skills && (
              <div className="flex flex-wrap gap-1 mt-2">
                {job.skills.split(",").map((s, i) => <span key={i} className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{s.trim()}</span>)}
              </div>
            )}
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              {user?.role === "student" ? (
                job.hasApplied ? <span className="text-sm text-green-600 font-medium">Applied</span> : <button onClick={() => applyJob(job.id)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Apply Now</button>
              ) : (
                <button onClick={() => setViewApplicants(job.id)} className="text-sm text-indigo-600 hover:underline">{job.applicationCount} applications</button>
              )}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleJob(job.id, job.isActive)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">{job.isActive ? "Close" : "Reopen"}</button>
                  <button onClick={() => deleteJob(job.id, job.title)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && <div className="text-center py-12 text-gray-400">No job postings yet.</div>}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Post a Job</h2>
            <div className="space-y-3">
              <input placeholder="Job Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Job Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg h-24" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input placeholder="Salary/Stipend" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border rounded-lg">
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
                <input placeholder="Skills (comma-sep)" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={createJob} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Post Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
