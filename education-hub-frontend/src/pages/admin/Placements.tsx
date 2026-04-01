import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Briefcase, Plus, Edit2, Trash2, Search, X, Building2, Calendar, Users } from "lucide-react";

interface Job {
  id: number; company_name: string; company_logo: string; title: string; description: string;
  location: string; job_type: string; salary_range: string; eligibility: string; last_date: string;
  status: string; created_at: string; application_count?: number;
}
interface Visit {
  id: number; company_name: string; visit_date: string; visit_time: string; venue: string;
  description: string; contact_person: string; status: string;
}
interface Application {
  id: number; student_name: string; enrollment_no: string; resume_url: string; cover_letter: string;
  status: string; created_at: string;
}

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];

export default function AdminPlacements() {
  const [tab, setTab] = useState<"jobs" | "visits">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [search, setSearch] = useState("");
  const [viewApps, setViewApps] = useState<{ jobId: number; jobTitle: string } | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobForm, setJobForm] = useState({ company_name: "", title: "", description: "", location: "", job_type: "Full-time", salary_range: "", eligibility: "", last_date: "", status: "active" });
  const [visitForm, setVisitForm] = useState({ company_name: "", visit_date: "", visit_time: "", venue: "", description: "", contact_person: "", status: "upcoming" });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [j, v] = await Promise.all([api.get("/api/placements/jobs"), api.get("/api/placements/visits")]);
      setJobs(j.data); setVisits(v.data);
    } catch {} finally { setLoading(false); }
  }

  function openNewJob() { setEditingJob(null); setJobForm({ company_name: "", title: "", description: "", location: "", job_type: "Full-time", salary_range: "", eligibility: "", last_date: "", status: "active" }); setShowJobForm(true); }
  function openEditJob(j: Job) { setEditingJob(j); setJobForm({ company_name: j.company_name, title: j.title, description: j.description || "", location: j.location || "", job_type: j.job_type, salary_range: j.salary_range || "", eligibility: j.eligibility || "", last_date: j.last_date || "", status: j.status }); setShowJobForm(true); }

  async function saveJob() {
    try {
      if (editingJob) await api.put("/api/placements/jobs/" + editingJob.id, jobForm);
      else await api.post("/api/placements/jobs", jobForm);
      setShowJobForm(false); loadAll();
    } catch {}
  }
  async function delJob(id: number) { if (!confirm("Delete?")) return; try { await api.delete("/api/placements/jobs/" + id); loadAll(); } catch {} }

  function openNewVisit() { setEditingVisit(null); setVisitForm({ company_name: "", visit_date: "", visit_time: "", venue: "", description: "", contact_person: "", status: "upcoming" }); setShowVisitForm(true); }
  function openEditVisit(v: Visit) { setEditingVisit(v); setVisitForm({ company_name: v.company_name, visit_date: v.visit_date || "", visit_time: v.visit_time || "", venue: v.venue || "", description: v.description || "", contact_person: v.contact_person || "", status: v.status }); setShowVisitForm(true); }

  async function saveVisit() {
    try {
      if (editingVisit) await api.put("/api/placements/visits/" + editingVisit.id, visitForm);
      else await api.post("/api/placements/visits", visitForm);
      setShowVisitForm(false); loadAll();
    } catch {}
  }
  async function delVisit(id: number) { if (!confirm("Delete?")) return; try { await api.delete("/api/placements/visits/" + id); loadAll(); } catch {} }

  async function viewApplications(jobId: number, title: string) {
    setViewApps({ jobId, jobTitle: title });
    try { const r = await api.get("/api/placements/jobs/" + jobId + "/applications"); setApplications(r.data); } catch {}
  }

  async function updateAppStatus(appId: number, status: string) {
    try { await api.put("/api/placements/applications/" + appId, { status }); if (viewApps) viewApplications(viewApps.jobId, viewApps.jobTitle); } catch {}
  }

  const filteredJobs = jobs.filter(j => j.company_name.toLowerCase().includes(search.toLowerCase()) || j.title.toLowerCase().includes(search.toLowerCase()));
  const filteredVisits = visits.filter(v => v.company_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Briefcase className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Placement Portal</h1>
        </div>
        <button onClick={tab === "jobs" ? openNewJob : openNewVisit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> {tab === "jobs" ? "Add Job" : "Add Visit"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab("jobs")} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "jobs" ? "bg-white shadow" : "text-gray-600"}`}>
          <Briefcase className="h-4 w-4 inline mr-1" /> Job Openings ({jobs.length})
        </button>
        <button onClick={() => setTab("visits")} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "visits" ? "bg-white shadow" : "text-gray-600"}`}>
          <Building2 className="h-4 w-4 inline mr-1" /> Company Visits ({visits.length})
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      {tab === "jobs" ? (
        <div className="space-y-3">
          {filteredJobs.map(j => (
            <div key={j.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{j.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${j.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{j.status}</span>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">{j.company_name}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {j.location && <span>{j.location}</span>}
                    <span>{j.job_type}</span>
                    {j.salary_range && <span>{j.salary_range}</span>}
                    {j.last_date && <span>Deadline: {new Date(j.last_date).toLocaleDateString("en-IN")}</span>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => viewApplications(j.id, j.title)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"><Users className="h-3.5 w-3.5" /> View Applications</button>
                  <button onClick={() => openEditJob(j)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => delJob(j.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {filteredJobs.length === 0 && <div className="text-center py-12 text-gray-500">No jobs found</div>}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisits.map(v => (
            <div key={v.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{v.company_name}</h3>
                  <div className="flex gap-3 mt-1 text-sm text-gray-500">
                    {v.visit_date && <span><Calendar className="h-3 w-3 inline mr-1" />{new Date(v.visit_date).toLocaleDateString("en-IN")}</span>}
                    {v.visit_time && <span>{v.visit_time}</span>}
                    {v.venue && <span>{v.venue}</span>}
                  </div>
                  {v.description && <p className="text-sm text-gray-600 mt-1">{v.description}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openEditVisit(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => delVisit(v.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {filteredVisits.length === 0 && <div className="text-center py-12 text-gray-500">No visits found</div>}
        </div>
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingJob ? "Edit Job" : "New Job Opening"}</h2>
              <button onClick={() => setShowJobForm(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Company *</label><input value={jobForm.company_name} onChange={e => setJobForm({...jobForm, company_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Job Title *</label><input value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Location</label><input value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Job Type</label><select value={jobForm.job_type} onChange={e => setJobForm({...jobForm, job_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">{JOB_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Salary Range</label><input value={jobForm.salary_range} onChange={e => setJobForm({...jobForm, salary_range: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 3-5 LPA" /></div>
                <div><label className="block text-sm font-medium mb-1">Last Date</label><input type="date" value={jobForm.last_date} onChange={e => setJobForm({...jobForm, last_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Eligibility</label><input value={jobForm.eligibility} onChange={e => setJobForm({...jobForm, eligibility: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. B.Tech, MBA" /></div>
              <div><label className="block text-sm font-medium mb-1">Status</label><select value={jobForm.status} onChange={e => setJobForm({...jobForm, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="active">Active</option><option value="closed">Closed</option></select></div>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button onClick={() => setShowJobForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={saveJob} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editingJob ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Visit Form Modal */}
      {showVisitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingVisit ? "Edit Visit" : "New Company Visit"}</h2>
              <button onClick={() => setShowVisitForm(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Company Name *</label><input value={visitForm.company_name} onChange={e => setVisitForm({...visitForm, company_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Visit Date</label><input type="date" value={visitForm.visit_date} onChange={e => setVisitForm({...visitForm, visit_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Visit Time</label><input type="time" value={visitForm.visit_time} onChange={e => setVisitForm({...visitForm, visit_time: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Venue</label><input value={visitForm.venue} onChange={e => setVisitForm({...visitForm, venue: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={visitForm.description} onChange={e => setVisitForm({...visitForm, description: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Contact Person</label><input value={visitForm.contact_person} onChange={e => setVisitForm({...visitForm, contact_person: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Status</label><select value={visitForm.status} onChange={e => setVisitForm({...visitForm, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button onClick={() => setShowVisitForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={saveVisit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editingVisit ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {viewApps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Applications - {viewApps.jobTitle}</h2>
              <button onClick={() => setViewApps(null)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4">
              {applications.length === 0 ? <p className="text-center py-8 text-gray-400">No applications yet</p> : (
                <div className="space-y-3">
                  {applications.map(a => (
                    <div key={a.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{a.student_name}</p>
                        <p className="text-xs text-gray-500">{a.enrollment_no} | Applied: {new Date(a.created_at).toLocaleDateString("en-IN")}</p>
                        {a.cover_letter && <p className="text-xs text-gray-600 mt-1">{a.cover_letter}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {a.resume_url && <a href={a.resume_url} target="_blank" className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full">Resume</a>}
                        <select value={a.status} onChange={e => updateAppStatus(a.id, e.target.value)} className="text-xs px-2 py-1 border rounded-lg">
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interviewed">Interviewed</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
