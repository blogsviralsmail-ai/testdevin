import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Briefcase, Search, MapPin, Clock, Building2, Calendar, Upload, X } from "lucide-react";

interface Job {
  id: number; company_name: string; title: string; description: string;
  location: string; job_type: string; salary_range: string; eligibility: string;
  last_date: string; status: string; created_at: string; has_applied?: number;
}
interface Visit {
  id: number; company_name: string; visit_date: string; visit_time: string;
  venue: string; description: string; contact_person: string; status: string;
}

export default function StudentPlacements() {
  const [tab, setTab] = useState<"jobs" | "visits">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [j, v] = await Promise.all([api.get("/api/placements/jobs"), api.get("/api/placements/visits")]);
      setJobs(j.data); setVisits(v.data);
    } catch {} finally { setLoading(false); }
  }

  async function submitApplication() {
    if (!applyJob) return;
    setApplying(true);
    try {
      let resume_url = "";
      if (resumeFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(resumeFile);
        });
        const uploadRes = await api.post("/api/placements/upload-resume", {
          filename: resumeFile.name,
          data: base64.split(",")[1]
        });
        resume_url = uploadRes.data.url;
      }
      await api.post("/api/placements/jobs/" + applyJob.id + "/apply", {
        cover_letter: coverLetter,
        resume_url
      });
      setApplyJob(null);
      setCoverLetter("");
      setResumeFile(null);
      loadAll();
      alert("Application submitted successfully!");
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to apply");
    } finally { setApplying(false); }
  }

  const filteredJobs = jobs.filter(j => j.company_name.toLowerCase().includes(search.toLowerCase()) || j.title.toLowerCase().includes(search.toLowerCase()));
  const filteredVisits = visits.filter(v => v.company_name.toLowerCase().includes(search.toLowerCase()));

  const isExpired = (d: string) => d && new Date(d) < new Date();

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        <h1 className="text-xl sm:text-2xl font-bold">Placement Portal</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-full sm:w-fit">
        <button onClick={() => setTab("jobs")} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium ${tab === "jobs" ? "bg-white shadow" : "text-gray-600"}`}>
          <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1" /> Jobs ({jobs.length})
        </button>
        <button onClick={() => setTab("visits")} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium ${tab === "visits" ? "bg-white shadow" : "text-gray-600"}`}>
          <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1" /> Visits ({visits.length})
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      {tab === "jobs" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map(j => (
            <div key={j.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{j.title}</h3>
                  <p className="text-blue-600 font-medium text-sm">{j.company_name}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${j.status === "active" && !isExpired(j.last_date) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {isExpired(j.last_date) ? "Expired" : j.status}
                </span>
              </div>
              {j.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{j.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{j.job_type}</span>
                {j.salary_range && <span className="font-medium text-green-600">{j.salary_range}</span>}
              </div>
              {j.eligibility && <p className="text-xs text-gray-500 mb-3"><span className="font-medium">Eligibility:</span> {j.eligibility}</p>}
              <div className="flex items-center justify-between pt-3 border-t">
                {j.last_date && <span className="text-xs text-gray-400">Deadline: {new Date(j.last_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                {j.has_applied ? (
                  <span className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">Applied</span>
                ) : j.status === "active" && !isExpired(j.last_date) ? (
                  <button onClick={() => setApplyJob(j)} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Apply Now
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {filteredJobs.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No job openings available</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisits.map(v => (
            <div key={v.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{v.company_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.status === "upcoming" ? "bg-blue-100 text-blue-700" : v.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{v.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                    {v.visit_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(v.visit_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                    {v.visit_time && <span>{v.visit_time}</span>}
                    {v.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.venue}</span>}
                  </div>
                  {v.description && <p className="text-sm text-gray-600 mt-2">{v.description}</p>}
                  {v.contact_person && <p className="text-xs text-gray-400 mt-1">Contact: {v.contact_person}</p>}
                </div>
              </div>
            </div>
          ))}
          {filteredVisits.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No company visits scheduled</p>
            </div>
          )}
        </div>
      )}

      {/* Apply Modal */}
      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Apply - {applyJob.title}</h2>
              <button onClick={() => setApplyJob(null)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">{applyJob.company_name}</p>
              <div>
                <label className="block text-sm font-medium mb-1">Resume (PDF)</label>
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">{resumeFile ? resumeFile.name : "Click to upload resume"}</span>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cover Letter (optional)</label>
                <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={4} placeholder="Why are you interested in this role..." className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button onClick={() => setApplyJob(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={submitApplication} disabled={applying} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {applying ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
