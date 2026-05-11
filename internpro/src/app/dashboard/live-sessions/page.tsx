"use client";
import { useState, useEffect, useCallback } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

interface LiveSession { id: string; title: string; description?: string; programId?: string; meetLink?: string; platform: string; scheduledAt: string; duration: number; status: string; recordingUrl?: string; hostName: string; programTitle?: string; }
interface Program { id: string; title: string; }

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [programFilter, setProgramFilter] = useState("all");
  const [form, setForm] = useState({ title: "", description: "", programId: "", meetLink: "", platform: "google_meet", scheduledAt: "", duration: "60" });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    const params = programFilter !== "all" ? `?programId=${programFilter}` : "";
    const [sRes, pRes, mRes] = await Promise.all([
      fetch(`/api/live-sessions${params}`), fetch("/api/programs"), fetch("/api/auth/me"),
    ]);
    if (sRes.ok) setSessions(await sRes.json());
    if (pRes.ok) setPrograms(await pRes.json());
    if (mRes.ok) { const d = await mRes.json(); setUser(d.user || d); }
  }, [programFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isAdmin = user?.role === "admin" || user?.role === "organization" || user?.role === "teamleader";

  const handleCreate = async () => {
    const res = await fetch("/api/live-sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, programId: form.programId || undefined, duration: parseInt(form.duration) }),
    });
    if (res.ok) { setShowForm(false); setForm({ title: "", description: "", programId: "", meetLink: "", platform: "google_meet", scheduledAt: "", duration: "60" }); fetchData(); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/live-sessions/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const deleteSession = async (id: string, title: string) => {
    if (!confirm(`Delete session "${title}"?`)) return;
    const r = await fetch(`/api/live-sessions/${id}`, { method: "DELETE" });
    if (r.ok) fetchData();
  };

  const now = new Date();
  const searchFiltered = sessions.filter(s => !searchQuery.trim() || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())));
  const upcoming = searchFiltered.filter(s => new Date(s.scheduledAt) > now && s.status === "scheduled");
  const past = searchFiltered.filter(s => new Date(s.scheduledAt) <= now || s.status === "completed");

  const platformIcons: Record<string, string> = { google_meet: "📹", zoom: "💻", other: "🔗" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Sessions</h1>
          <p className="text-sm text-slate-500">Scheduled doubt-clearing sessions and webinars</p>
        </div>
        {isAdmin && <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">+ Schedule Session</button>}
      </div>

      {/* Search + Filter */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search sessions..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-white focus:ring-2 focus:ring-[#0EA5B8] focus:border-indigo-500" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400">✕</button>}
          </div>
          {programs.length > 1 && (
            <>
              <label className="text-sm font-medium text-slate-300">Course:</label>
              <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm text-white min-w-[250px]">
                <option value="all">All Courses</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Schedule Live Session</h2>
            <div className="space-y-3">
              <input placeholder="Session Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select value={form.programId} onChange={e => setForm({ ...form, programId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">General (All students)</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="google_meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="other">Other</option>
                </select>
                <input type="number" placeholder="Duration (min)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input placeholder="Meet/Zoom Link" value={form.meetLink} onChange={e => setForm({ ...form, meetLink: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 text-sm">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Upcoming Sessions</h2>
        {upcoming.length === 0 ? (
          <>
            <PaymentBlockMessage feature="Live Sessions" />
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-8 border text-center text-slate-500">No upcoming sessions scheduled.</div>
          </>
        ) : (
          <div className="space-y-3">
            {upcoming.map(s => (
              <div key={s.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border border-indigo-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{platformIcons[s.platform] || "🔗"}</span>
                      <h3 className="font-semibold text-white">{s.title}</h3>
                    </div>
                    {s.description && <p className="text-sm text-slate-500 mt-1">{s.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>Host: {s.hostName}</span>
                      {s.programTitle && <span>{s.programTitle}</span>}
                      <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                      <span>{s.duration} min</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {s.meetLink && <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs">Join</a>}
                    {isAdmin && (
                      <>
                        <button onClick={() => updateStatus(s.id, "completed")} className="text-xs px-2 py-1 bg-transparent text-[#60a5fa] rounded hover:bg-blue-500/10">Mark Done</button>
                        <button onClick={() => deleteSession(s.id, s.title)} className="text-xs px-2 py-1 bg-transparent text-red-400 rounded hover:bg-red-500/10">Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Past Sessions</h2>
          <div className="space-y-3">
            {past.map(s => (
              <div key={s.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border opacity-75">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-300">{s.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>{s.hostName}</span>
                      {s.programTitle && <span>{s.programTitle}</span>}
                      <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                      <span className="capitalize">{s.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {s.recordingUrl && <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#22d3ee] hover:underline">Watch Recording</a>}
                    {isAdmin && <button onClick={() => deleteSession(s.id, s.title)} className="text-xs px-2 py-1 bg-transparent text-red-400 rounded hover:bg-red-500/10">Delete</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
