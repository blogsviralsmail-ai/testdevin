import { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock, IndianRupee, Send, X, ChevronDown, Upload, FileText, Loader2 } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", cover_letter: "", resume_url: "" });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get("/api/careers?status=active").then(r => setJobs(r.data || [])).catch(() => {});
  }, []);

  const apply = async () => {
    if (!form.name || !form.email) return;
    setUploading(true);
    let resumeUrl = form.resume_url;
    if (resumeFile) {
      const fd = new FormData();
      fd.append("file", resumeFile);
      try {
        const uploadRes = await api.post("/api/careers/upload-resume", fd);
        resumeUrl = uploadRes.data.url;
      } catch { /* ignore upload error */ }
    }
    await api.post(`/api/careers/${selected.id}/apply`, { ...form, resume_url: resumeUrl });
    setUploading(false);
    setSubmitted(true);
    setTimeout(() => { setShowApply(false); setSubmitted(false); setForm({ name: "", email: "", phone: "", cover_letter: "", resume_url: "" }); setResumeFile(null); }, 2000);
  };

  return (
    <div>
      <SEO
        title="Careers - Join Our Team"
        description="Join India's fastest-growing education consulting platform. Explore career opportunities at Education Hub - growth, work-life balance, and impactful work."
        keywords="education hub careers, education jobs, consulting jobs Jaipur, education sector jobs, career opportunities"
        canonical="/careers"
      />
      <div className="bg-gradient-to-r from-teal-900 to-teal-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-lg text-teal-200 max-w-2xl mx-auto">Be part of India's fastest-growing education consulting platform. We're looking for passionate individuals.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map(j => (
              <div key={j.id} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{j.title}</h3>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {j.department && <span className="flex items-center gap-1 text-sm text-gray-600"><Briefcase className="h-4 w-4" /> {j.department}</span>}
                      {j.location && <span className="flex items-center gap-1 text-sm text-gray-600"><MapPin className="h-4 w-4" /> {j.location}</span>}
                      <span className="flex items-center gap-1 text-sm text-gray-600"><Clock className="h-4 w-4" /> {j.type}</span>
                      {j.salary_range && <span className="flex items-center gap-1 text-sm text-gray-600"><IndianRupee className="h-4 w-4" /> {j.salary_range}</span>}
                    </div>
                    {j.experience && <p className="text-sm text-gray-500 mb-2">Experience: {j.experience}</p>}
                    
                    {selected?.id === j.id && (
                      <div className="mt-4 border-t pt-4">
                        {j.description && <div className="mb-3"><h4 className="font-semibold text-sm mb-1">Description</h4><p className="text-sm text-gray-600">{j.description}</p></div>}
                        {j.requirements && <div><h4 className="font-semibold text-sm mb-1">Requirements</h4><p className="text-sm text-gray-600 whitespace-pre-line">{j.requirements}</p></div>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(selected?.id === j.id ? null : j)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1">
                      Details <ChevronDown className={`h-4 w-4 transition-transform ${selected?.id === j.id ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => { setSelected(j); setShowApply(true); }} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-1">
                      <Send className="h-4 w-4" /> Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No openings right now</h3>
            <p className="text-gray-400">Check back soon or send your resume to careers@asffeducationhub.com</p>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApply && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">Apply for {selected.title}</h2>
              <button onClick={() => setShowApply(false)}><X className="h-5 w-5" /></button>
            </div>
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Send className="h-8 w-8 text-green-600" /></div>
                <h3 className="text-lg font-bold text-green-600">Application Submitted!</h3>
                <p className="text-sm text-gray-500">We'll get back to you soon.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name *" className="w-full px-4 py-2.5 border rounded-lg text-sm" />
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" className="w-full px-4 py-2.5 border rounded-lg text-sm" />
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full px-4 py-2.5 border rounded-lg text-sm" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Resume (PDF, DOC, DOCX)</label>
                  <div className="relative">
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files?.[0] || null)} className="hidden" id="resume-upload" />
                    <label htmlFor="resume-upload" className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors">
                      {resumeFile ? (
                        <><FileText className="h-5 w-5 text-teal-600 flex-shrink-0" /><span className="text-teal-700 font-medium truncate">{resumeFile.name}</span></>
                      ) : (
                        <><Upload className="h-5 w-5 text-gray-400 flex-shrink-0" /><span className="text-gray-500">Click to upload resume...</span></>
                      )}
                    </label>
                    {resumeFile && <button type="button" onClick={() => setResumeFile(null)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>}
                  </div>
                </div>
                <textarea value={form.cover_letter} onChange={e => setForm({ ...form, cover_letter: e.target.value })} placeholder="Cover Letter / Message" rows={3} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
                <button onClick={apply} disabled={uploading} className="w-full py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <>Submit Application</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Why Join */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">Why Join Education Hub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Growth Opportunities", desc: "Fast-growing company with excellent career advancement paths" },
              { title: "Work-Life Balance", desc: "Flexible working hours and supportive work environment" },
              { title: "Impactful Work", desc: "Help shape the future of thousands of students across India" },
            ].map((w, i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{w.title}</h3>
                <p className="text-sm text-gray-600">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
