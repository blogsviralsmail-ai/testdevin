"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{background: '#0a0e1a', color: '#f1f5f9'}}>Loading...</div>}><RegisterForm /></Suspense>;
}

function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    collegeName: "", degree: "", year: "", address: "", state: "",
    programId: "", preferredMode: "",
  });
  const [programsList, setProgramsList] = useState<{id: string; title: string; mode: string}[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/programs").then(r => r.ok ? r.json() : []).then(data => {
      const list = Array.isArray(data) ? data : [];
      setProgramsList(list);
      const programParam = searchParams.get("program");
      if (programParam) {
        const match = list.find((p: {id: string; title: string}) => p.title === programParam || p.id === programParam);
        if (match) setForm(f => ({ ...f, programId: match.id }));
      }
    }).catch(() => {});
  }, [searchParams]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(referralCode ? { referralCode } : {}) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Upload photo if provided
      if (photoFile) {
        try {
          const fd = new FormData();
          fd.append("file", photoFile);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            await fetch("/api/auth/me", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avatar: uploadData.url }),
            });
          }
        } catch { /* photo upload failed */ }
      }
      // Upload resume if provided
      if (resumeFile) {
        setResumeUploading(true);
        try {
          const fd = new FormData();
          fd.append("file", resumeFile);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            await fetch("/api/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: "Resume", type: "resume", fileUrl: uploadData.url }),
            });
          }
        } catch { /* resume upload failed, user can re-upload later */ }
        setResumeUploading(false);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{background: '#0a0e1a'}}>
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px]" style={{borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', background: 'radial-gradient(ellipse, rgba(14,165,184,0.08), transparent 70%)', animation: 'morphBlob 15s ease-in-out infinite'}} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px]" style={{borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%', background: 'radial-gradient(ellipse, rgba(167,139,250,0.06), transparent 70%)', animation: 'morphBlob 18s ease-in-out infinite reverse'}} />
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12" style={{background: 'linear-gradient(135deg, rgba(14,165,184,0.1), rgba(167,139,250,0.08))'}}>
        <div className="text-white max-w-lg relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>KM</div>
            <span className="text-3xl font-bold" style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>KKHS Media</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">Start Your Internship Journey</h2>
          <p className="text-lg text-slate-400">
            Register, upload your documents, and get selected for exciting internship opportunities.
          </p>
          <div className="mt-8 space-y-3 text-slate-400">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white" style={{background: 'rgba(14,165,184,0.3)', border: '1px solid rgba(14,165,184,0.4)'}}>1</span>
              <span>Register with your details</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white" style={{background: 'rgba(14,165,184,0.3)', border: '1px solid rgba(14,165,184,0.4)'}}>2</span>
              <span>Upload documents & results</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white" style={{background: 'rgba(14,165,184,0.3)', border: '1px solid rgba(14,165,184,0.4)'}}>3</span>
              <span>Interview & get selected</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white" style={{background: 'rgba(14,165,184,0.3)', border: '1px solid rgba(14,165,184,0.4)'}}>4</span>
              <span>Receive Offer Letter & start learning!</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>IP</div>
            <span className="text-xl font-bold" style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>InternPro</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Student Registration</h1>
          <p className="text-slate-400 mb-6">Fill your details to apply for internship</p>

          {error && (
            <div className="px-4 py-3 rounded-lg mb-6 text-sm" style={{background: 'rgba(255,107,107,0.1)', color: '#fca5a5', border: '1px solid rgba(255,107,107,0.2)'}}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name *</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                  placeholder="Your full name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Phone *</label>
                <input type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                  placeholder="9876543210" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email *</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                placeholder="you@example.com" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">College Name</label>
                <input type="text" value={form.collegeName}
                  onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                  placeholder="e.g. IIT Delhi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Degree</label>
                <input type="text" value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                  placeholder="e.g. B.Tech" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Year</label>
                <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                  <option value="">Select year</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                  <option value="Passed Out">Passed Out</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Address</label>
                <input type="text" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                  placeholder="City, Area" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">State</label>
              <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                <option value="">Select State</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Assam">Assam</option>
                <option value="Bihar">Bihar</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Goa">Goa</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Haryana">Haryana</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Manipur">Manipur</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Odisha">Odisha</option>
                <option value="Punjab">Punjab</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Sikkim">Sikkim</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
                <option value="Tripura">Tripura</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                <option value="Delhi">Delhi</option>
                <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                <option value="Ladakh">Ladakh</option>
                <option value="Lakshadweep">Lakshadweep</option>
                <option value="Puducherry">Puducherry</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Program *</label>
              <select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} required>
                <option value="">-- Select Program --</option>
                {programsList.map(p => <option key={p.id} value={p.id}>{p.title} ({p.mode === "online" ? "Online" : p.mode === "offline" ? "Offline" : p.mode === "hybrid" ? "Hybrid" : p.mode})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Preferred Mode *</label>
              <select value={form.preferredMode} onChange={(e) => setForm({ ...form, preferredMode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} required>
                <option value="">-- Select Mode --</option>
                <option value="online">Online (Work from Home)</option>
                <option value="offline">Offline (Work from Office)</option>
                <option value="hybrid">Hybrid (Online + Offline)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Profile Photo</label>
              <div className="flex items-center gap-4">
                {photoPreview && <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover" style={{border: '2px solid rgba(14,165,184,0.3)'}} />}
                <input type="file" accept="image/*" onChange={handlePhotoChange}
                  className="w-full px-4 py-2 rounded-xl text-white outline-none text-sm" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
              </div>
              <p className="text-xs text-slate-600 mt-1">Upload your photo (used for ID card & profile)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Resume (PDF) *</label>
              <input type="file" accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 rounded-xl text-white outline-none text-sm" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
              <p className="text-xs text-slate-600 mt-1">Upload your resume (PDF/DOC, shown to admin)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Password *</label>
              <input type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                placeholder="Min 6 characters" required minLength={6} />
            </div>

            {referralCode && (
              <div className="rounded-xl p-3 text-sm" style={{background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.2)'}}>
                Referred by agent: <span className="font-semibold">{referralCode}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50" style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 0 #0a7c8a, 0 6px 15px rgba(14,165,184,0.3)'}}>
              {loading ? (resumeUploading ? "Uploading Resume..." : "Registering...") : "Register & Apply"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{color: '#22d3ee'}}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
