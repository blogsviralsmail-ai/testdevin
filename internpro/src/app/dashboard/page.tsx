"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  totalStudents?: number;
  totalPrograms?: number;
  totalBatches?: number;
  activeEnrollments?: number;
  totalCertificates?: number;
  totalRevenue?: number;
  totalEnrollments?: number;
  totalAttendance?: number;
  totalTasks?: number;
  completedTasks?: number;
  pendingApplications?: number;
  scheduledInterviews?: number;
  selectedStudents?: number;
  completionPercentage?: number;
  enrollmentStatus?: string;
}

interface UserInfo {
  role: string;
  name: string;
}

interface UpcomingInterview {
  id: string;
  scheduledAt: string;
  duration: number;
  mode: string;
  meetLink: string | null;
  status: string;
  result: string | null;
  enrollment: {
    batch: { program: { title: string; domain: string } };
  };
  interviewer: { name: string } | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({});
  const [user, setUser] = useState<UserInfo | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [showDocsPrompt, setShowDocsPrompt] = useState(false);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);

  const fetchData = useCallback(async () => {
    const [statsRes, userRes] = await Promise.all([
      fetch("/api/stats"),
      fetch("/api/auth/me"),
    ]);
    if (statsRes.ok) setStats(await statsRes.json());
    if (userRes.ok) {
      const data = await userRes.json();
      setUser(data.user);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Check if student needs to submit documents + fetch interviews
  useEffect(() => {
    if (user?.role === "student") {
      fetch("/api/documents").then(r => r.json()).then(docs => {
        if (!docs || docs.length === 0) setShowDocsPrompt(true);
      }).catch(() => {});
      fetch("/api/interviews").then(r => r.ok ? r.json() : []).then(data => {
        setUpcomingInterviews(data);
      }).catch(() => {});
    }
  }, [user]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      alert(data.message || "Seed complete!");
      fetchData();
    } catch {
      alert("Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const adminCards = [
    { label: "Pending Applications", value: stats.pendingApplications || 0, icon: "📋", gradient: "from-amber-500/20 to-orange-500/20", accent: "#f59e0b" },
    { label: "Scheduled Interviews", value: stats.scheduledInterviews || 0, icon: "🎤", gradient: "from-blue-500/20 to-indigo-500/20", accent: "#60a5fa" },
    { label: "Selected Students", value: stats.selectedStudents || 0, icon: "🎓", gradient: "from-emerald-500/20 to-green-500/20", accent: "#34d399" },
    { label: "Active Programs", value: stats.totalPrograms || 0, icon: "📚", gradient: "from-cyan-500/20 to-teal-500/20", accent: "#0EA5B8" },
    { label: "Total Students", value: stats.totalStudents || 0, icon: "👥", gradient: "from-violet-500/20 to-[#a78bfa]/20", accent: "#a78bfa" },
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue || 0), icon: "💰", gradient: "from-rose-500/20 to-pink-500/20", accent: "#FF6B6B" },
  ];

  const studentCards = [
    { label: "My Applications", value: stats.totalEnrollments || 0, icon: "📋", gradient: "from-blue-500/20 to-indigo-500/20", accent: "#60a5fa" },
    { label: "Days Completed", value: stats.totalAttendance || 0, icon: "📅", gradient: "from-cyan-500/20 to-teal-500/20", accent: "#0EA5B8" },
    { label: "Tasks Completed", value: stats.completedTasks || 0, icon: "📝", gradient: "from-emerald-500/20 to-green-500/20", accent: "#34d399" },
    { label: "Total Tasks", value: stats.totalTasks || 0, icon: "📋", gradient: "from-violet-500/20 to-[#a78bfa]/20", accent: "#a78bfa" },
    { label: "Completion %", value: `${stats.completionPercentage || 0}%`, icon: "📊", gradient: "from-amber-500/20 to-orange-500/20", accent: "#f59e0b" },
    { label: "Certificates", value: stats.totalCertificates || 0, icon: "🏆", gradient: "from-rose-500/20 to-pink-500/20", accent: "#FF6B6B" },
  ];

  const leaderCards = [
    { label: "My Batches", value: stats.totalBatches || 0, icon: "📦", gradient: "from-cyan-500/20 to-teal-500/20", accent: "#0EA5B8" },
    { label: "Total Students", value: stats.totalStudents || 0, icon: "👥", gradient: "from-blue-500/20 to-indigo-500/20", accent: "#60a5fa" },
    { label: "Pending Reviews", value: stats.completedTasks || 0, icon: "📝", gradient: "from-amber-500/20 to-orange-500/20", accent: "#f59e0b" },
    { label: "Active Enrollments", value: stats.activeEnrollments || 0, icon: "🎓", gradient: "from-emerald-500/20 to-green-500/20", accent: "#34d399" },
  ];

  const cards = user?.role === "student" ? studentCards : user?.role === "teamleader" ? leaderCards : adminCards;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 animate-pulse" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>IP</div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Glow animations */}
      {user?.role === "student" && (
        <style>{`
          @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
          @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
          @keyframes glowGreen { 0%,100% { box-shadow:0 0 10px rgba(52,211,153,0.2); } 50% { box-shadow:0 0 30px rgba(52,211,153,0.4); } }
          @keyframes glowRed { 0%,100% { box-shadow:0 0 10px rgba(248,113,113,0.2); } 50% { box-shadow:0 0 30px rgba(248,113,113,0.4); } }
          @keyframes glowBlue { 0%,100% { box-shadow:0 0 10px rgba(14,165,184,0.2); } 50% { box-shadow:0 0 30px rgba(14,165,184,0.4); } }
          @keyframes glowYellow { 0%,100% { box-shadow:0 0 10px rgba(251,191,36,0.2); } 50% { box-shadow:0 0 30px rgba(251,191,36,0.4); } }
        `}</style>
      )}

      {/* Status Banner for Students */}
      {user?.role === "student" && stats.enrollmentStatus && stats.enrollmentStatus !== "applied" && (
        <div className="mb-6 rounded-2xl p-5 relative overflow-hidden" style={{
          background: stats.enrollmentStatus === "selected" ? 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.1))' :
            stats.enrollmentStatus === "shortlisted" ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))' :
            stats.enrollmentStatus === "interview_scheduled" ? 'linear-gradient(135deg, rgba(14,165,184,0.15), rgba(167,139,250,0.1))' :
            stats.enrollmentStatus === "rejected" ? 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(239,68,68,0.1))' :
            'rgba(255,255,255,0.05)',
          border: `1px solid ${stats.enrollmentStatus === "selected" ? 'rgba(52,211,153,0.3)' :
            stats.enrollmentStatus === "shortlisted" ? 'rgba(251,191,36,0.3)' :
            stats.enrollmentStatus === "interview_scheduled" ? 'rgba(14,165,184,0.3)' :
            stats.enrollmentStatus === "rejected" ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)'}`,
          animation: `${stats.enrollmentStatus === "selected" ? "glowGreen" :
            stats.enrollmentStatus === "rejected" ? "glowRed" :
            stats.enrollmentStatus === "interview_scheduled" ? "glowBlue" : "glowYellow"} 3s infinite`
        }}>
          <div className="flex items-center gap-4">
            <div className="text-4xl" style={{ animation: "blink 2s infinite" }}>
              {stats.enrollmentStatus === "selected" ? "🎉" :
               stats.enrollmentStatus === "shortlisted" ? "⭐" :
               stats.enrollmentStatus === "interview_scheduled" ? "🎤" :
               stats.enrollmentStatus === "rejected" ? "😔" : "📋"}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white" style={{ animation: "blink 2s infinite" }}>
                {stats.enrollmentStatus === "selected" ? "Congratulations! You are SELECTED!" :
                 stats.enrollmentStatus === "shortlisted" ? "You are SHORTLISTED!" :
                 stats.enrollmentStatus === "interview_scheduled" ? "Interview Scheduled!" :
                 stats.enrollmentStatus === "rejected" ? "Application Not Approved" : "Application Status"}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {stats.enrollmentStatus === "selected" ? "Welcome aboard! Check your offer letter and complete the joining formalities." :
                 stats.enrollmentStatus === "shortlisted" ? "Great news! You have been shortlisted. Stay tuned for further updates." :
                 stats.enrollmentStatus === "interview_scheduled" ? "Your interview is scheduled. Check details below and be prepared!" :
                 stats.enrollmentStatus === "rejected" ? "Unfortunately your application was not approved this time. You can apply again." : ""}
              </p>
            </div>
            <a href={stats.enrollmentStatus === "interview_scheduled" ? "/dashboard/interviews" : stats.enrollmentStatus === "selected" ? "/dashboard/offer-letter" : "/dashboard/applications"}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap text-white"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', animation: "pulse 2s infinite" }}>
              {stats.enrollmentStatus === "interview_scheduled" ? "View Interview" :
               stats.enrollmentStatus === "selected" ? "View Offer Letter" :
               stats.enrollmentStatus === "shortlisted" ? "View Details" : "View Status"}
            </a>
          </div>
        </div>
      )}

      {/* Documents Submission Popup */}
      {showDocsPrompt && user?.role === "student" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', animation: "fadeInUp 0.3s ease-out" }}>
          <div className="rounded-3xl p-8 max-w-md mx-4 text-center relative overflow-hidden" style={{background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20" style={{background: 'radial-gradient(ellipse, #0EA5B8, transparent)'}} />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-20" style={{background: 'radial-gradient(ellipse, #a78bfa, transparent)'}} />
            <div className="relative z-10">
              <div className="text-6xl mb-4" style={{ animation: "pulse 1.5s infinite" }}>📄</div>
              <h2 className="text-2xl font-bold text-white mb-2">Please Submit Your Documents</h2>
              <p className="text-slate-400 mb-6">Upload your documents (Resume, ID Proof, etc.) to complete your application.</p>
              <button
                onClick={() => { setShowDocsPrompt(false); window.location.href = "/dashboard/documents"; }}
                className="w-full py-3 rounded-xl text-white font-semibold text-lg transition-all hover:shadow-[0_0_30px_rgba(14,165,184,0.3)]"
                style={{ background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', animation: "pulse 2s infinite" }}>
                OK — Submit Documents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user.name}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.role === "student" ? "Track your internship progress" :
             user?.role === "teamleader" ? "Manage your team and review tasks" :
             "Manage applications, interviews, and internship programs"}
          </p>
        </div>
        {user?.role === "admin" && (
          <button onClick={handleSeed} disabled={seeding}
            className="text-white px-4 py-2 rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(14,165,184,0.3)] disabled:opacity-50"
            style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)'}}>
            {seeding ? "Seeding..." : "Load Demo Data"}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {cards.map((card, i) => (
          <div key={card.label} className="group p-6 rounded-2xl transition-all duration-500 hover:-translate-y-1" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            animationDelay: `${i * 0.05}s`,
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-2">{card.label}</p>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-2xl transition-transform group-hover:scale-110`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{background: 'rgba(255,255,255,0.05)'}}>
              <div className="h-full rounded-full transition-all duration-700" style={{width: '60%', background: `linear-gradient(90deg, ${card.accent}, transparent)`}} />
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Interviews for Students */}
      {user?.role === "student" && upcomingInterviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Your Interviews</h2>
          <div className="grid gap-4">
            {upcomingInterviews.map((iv) => (
              <div key={iv.id} className="rounded-2xl overflow-hidden transition-all" style={{
                background: 'rgba(255,255,255,0.03)',
                border: iv.status === "scheduled" ? '1px solid rgba(14,165,184,0.3)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: iv.status === "scheduled" ? '0 0 20px rgba(14,165,184,0.1)' : 'none',
              }}>
                {iv.status === "scheduled" && (
                  <div className="px-4 py-1.5 text-xs font-semibold tracking-wide text-white" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>UPCOMING INTERVIEW</div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-white">{iv.enrollment.batch.program.title}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="rounded-xl p-2.5 text-center" style={{background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)'}}>
                      <p className="text-[10px] text-slate-500 uppercase">Date</p>
                      <p className="text-sm font-semibold text-white">{new Date(iv.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center" style={{background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)'}}>
                      <p className="text-[10px] text-slate-500 uppercase">Time</p>
                      <p className="text-sm font-semibold text-white">{new Date(iv.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center" style={{background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)'}}>
                      <p className="text-[10px] text-slate-500 uppercase">Duration</p>
                      <p className="text-sm font-semibold text-white">{iv.duration} min</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center" style={{background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)'}}>
                      <p className="text-[10px] text-slate-500 uppercase">Mode</p>
                      <p className="text-sm font-semibold text-white capitalize">{iv.mode}</p>
                    </div>
                  </div>
                  {iv.meetLink && iv.status === "scheduled" && (
                    <a href={iv.meetLink} target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 text-white rounded-xl font-semibold text-sm transition-all hover:shadow-[0_0_20px_rgba(14,165,184,0.3)]"
                      style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)'}}>
                      🔗 Join Meeting
                    </a>
                  )}
                  {!iv.meetLink && iv.status === "scheduled" && (
                    <p className="mt-3 text-center text-sm rounded-xl py-2" style={{background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24'}}>Meeting link will be shared before the interview</p>
                  )}
                  {iv.result && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                        background: iv.result === "selected" ? 'rgba(52,211,153,0.15)' : iv.result === "rejected" ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                        color: iv.result === "selected" ? '#6ee7b7' : iv.result === "rejected" ? '#fca5a5' : '#fde68a',
                        border: `1px solid ${iv.result === "selected" ? 'rgba(52,211,153,0.3)' : iv.result === "rejected" ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`,
                      }}>
                        {iv.result === "selected" ? "Selected!" : iv.result === "rejected" ? "Not Selected" : "Shortlisted"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-2xl p-6" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(user?.role === "admin" || user?.role === "organization") && (
            <>
              <a href="/dashboard/applications" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">📋</span>
                <span className="text-sm text-slate-300">Review Applications</span>
              </a>
              <a href="/dashboard/interviews" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">🎤</span>
                <span className="text-sm text-slate-300">Interviews</span>
              </a>
              <a href="/dashboard/programs" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">📚</span>
                <span className="text-sm text-slate-300">Programs</span>
              </a>
              <a href="/dashboard/completion" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">🎓</span>
                <span className="text-sm text-slate-300">Completion</span>
              </a>
            </>
          )}
          {user?.role === "teamleader" && (
            <>
              <a href="/dashboard/reviews" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">✅</span>
                <span className="text-sm text-slate-300">Review Tasks</span>
              </a>
              <a href="/dashboard/students" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">👥</span>
                <span className="text-sm text-slate-300">My Students</span>
              </a>
              <a href="/dashboard/completion" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">🎓</span>
                <span className="text-sm text-slate-300">Completion</span>
              </a>
              <a href="/dashboard/resources" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">🎥</span>
                <span className="text-sm text-slate-300">Study Material</span>
              </a>
            </>
          )}
          {user?.role === "student" && (
            <>
              <a href="/dashboard/interviews" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">🎤</span>
                <span className="text-sm text-slate-300">My Interviews</span>
              </a>
              <a href="/dashboard/tasks" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">📝</span>
                <span className="text-sm text-slate-300">My Tasks</span>
              </a>
              <a href="/dashboard/documents" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">📄</span>
                <span className="text-sm text-slate-300">My Documents</span>
              </a>
              <a href="/dashboard/offer-letter" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">📨</span>
                <span className="text-sm text-slate-300">Offer Letter</span>
              </a>
              <a href="/dashboard/resources" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-2xl">🎥</span>
                <span className="text-sm text-slate-300">Study Material</span>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
