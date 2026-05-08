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
    { label: "Pending Applications", value: stats.pendingApplications || 0, icon: "📋", color: "bg-orange-500" },
    { label: "Scheduled Interviews", value: stats.scheduledInterviews || 0, icon: "🎤", color: "bg-blue-500" },
    { label: "Selected Students", value: stats.selectedStudents || 0, icon: "🎓", color: "bg-green-500" },
    { label: "Active Programs", value: stats.totalPrograms || 0, icon: "📚", color: "bg-indigo-500" },
    { label: "Total Students", value: stats.totalStudents || 0, icon: "👥", color: "bg-purple-500" },
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue || 0), icon: "💰", color: "bg-pink-500" },
  ];

  const studentCards = [
    { label: "My Applications", value: stats.totalEnrollments || 0, icon: "📋", color: "bg-blue-500" },
    { label: "Days Completed", value: stats.totalAttendance || 0, icon: "📅", color: "bg-indigo-500" },
    { label: "Tasks Completed", value: stats.completedTasks || 0, icon: "📝", color: "bg-green-500" },
    { label: "Total Tasks", value: stats.totalTasks || 0, icon: "📋", color: "bg-purple-500" },
    { label: "Completion %", value: `${stats.completionPercentage || 0}%`, icon: "📊", color: "bg-yellow-500" },
    { label: "Certificates", value: stats.totalCertificates || 0, icon: "🏆", color: "bg-pink-500" },
  ];

  const leaderCards = [
    { label: "My Batches", value: stats.totalBatches || 0, icon: "📦", color: "bg-indigo-500" },
    { label: "Total Students", value: stats.totalStudents || 0, icon: "👥", color: "bg-blue-500" },
    { label: "Pending Reviews", value: stats.completedTasks || 0, icon: "📝", color: "bg-orange-500" },
    { label: "Active Enrollments", value: stats.activeEnrollments || 0, icon: "🎓", color: "bg-green-500" },
  ];

  const cards = user?.role === "student" ? studentCards : user?.role === "teamleader" ? leaderCards : adminCards;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">IP</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Blinking CSS Animations */}
      {user?.role === "student" && (
        <style>{`
          @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
          @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
          @keyframes glowGreen { 0%,100% { box-shadow:0 0 5px #22c55e; } 50% { box-shadow:0 0 20px #22c55e, 0 0 40px #22c55e33; } }
          @keyframes glowRed { 0%,100% { box-shadow:0 0 5px #ef4444; } 50% { box-shadow:0 0 20px #ef4444, 0 0 40px #ef444433; } }
          @keyframes glowBlue { 0%,100% { box-shadow:0 0 5px #6366f1; } 50% { box-shadow:0 0 20px #6366f1, 0 0 40px #6366f133; } }
          @keyframes glowYellow { 0%,100% { box-shadow:0 0 5px #eab308; } 50% { box-shadow:0 0 20px #eab308, 0 0 40px #eab30833; } }
        `}</style>
      )}

      {/* Status Banner for Students */}
      {user?.role === "student" && stats.enrollmentStatus && stats.enrollmentStatus !== "applied" && (
        <div className={`mb-6 rounded-xl p-5 relative overflow-hidden ${
          stats.enrollmentStatus === "selected" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" :
          stats.enrollmentStatus === "shortlisted" ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white" :
          stats.enrollmentStatus === "interview_scheduled" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" :
          stats.enrollmentStatus === "rejected" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white" :
          "bg-gray-100 text-gray-800"
        }`} style={{ animation: `${
          stats.enrollmentStatus === "selected" ? "glowGreen" :
          stats.enrollmentStatus === "rejected" ? "glowRed" :
          stats.enrollmentStatus === "interview_scheduled" ? "glowBlue" :
          "glowYellow"
        } 2s infinite` }}>
          <div className="flex items-center gap-4">
            <div className="text-4xl" style={{ animation: "blink 1.5s infinite" }}>
              {stats.enrollmentStatus === "selected" ? "🎉" :
               stats.enrollmentStatus === "shortlisted" ? "⭐" :
               stats.enrollmentStatus === "interview_scheduled" ? "🎤" :
               stats.enrollmentStatus === "rejected" ? "😔" : "📋"}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ animation: "blink 1.5s infinite" }}>
                {stats.enrollmentStatus === "selected" ? "Congratulations! You are SELECTED!" :
                 stats.enrollmentStatus === "shortlisted" ? "You are SHORTLISTED!" :
                 stats.enrollmentStatus === "interview_scheduled" ? "Interview Scheduled!" :
                 stats.enrollmentStatus === "rejected" ? "Application Not Approved" : "Application Status"}
              </h2>
              <p className="text-sm opacity-90 mt-1">
                {stats.enrollmentStatus === "selected" ? "Welcome aboard! Check your offer letter and complete the joining formalities." :
                 stats.enrollmentStatus === "shortlisted" ? "Great news! You have been shortlisted. Stay tuned for further updates." :
                 stats.enrollmentStatus === "interview_scheduled" ? "Your interview is scheduled. Check details below and be prepared!" :
                 stats.enrollmentStatus === "rejected" ? "Unfortunately your application was not approved this time. You can apply again." : ""}
              </p>
            </div>
            <a href={stats.enrollmentStatus === "interview_scheduled" ? "/dashboard/interviews" : stats.enrollmentStatus === "selected" ? "/dashboard/offer-letter" : "/dashboard/applications"}
              className="ml-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition whitespace-nowrap"
              style={{ animation: "pulse 2s infinite" }}>
              {stats.enrollmentStatus === "interview_scheduled" ? "View Interview" :
               stats.enrollmentStatus === "selected" ? "View Offer Letter" :
               stats.enrollmentStatus === "shortlisted" ? "View Details" : "View Status"}
            </a>
          </div>
        </div>
      )}

      {/* Documents Prompt Animation for New Students */}
      {showDocsPrompt && user?.role === "student" && (
        <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white relative overflow-hidden" style={{ animation: "glowYellow 2s infinite" }}>
          <div className="relative z-10 flex items-center gap-4">
            <div className="text-4xl" style={{ animation: "blink 1s infinite" }}>📄</div>
            <div>
              <h2 className="text-xl font-bold" style={{ animation: "blink 1.2s infinite" }}>Submit Your Documents!</h2>
              <p className="text-orange-100 mb-3">Upload your resume and documents to proceed with your application.</p>
              <a href="/dashboard/documents"
                className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-orange-50 transition"
                style={{ animation: "pulse 1.5s infinite" }}>
                Submit Documents Now →
              </a>
            </div>
          </div>
          <button onClick={() => setShowDocsPrompt(false)} className="absolute top-3 right-3 text-white/70 hover:text-white text-xl">&times;</button>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user.name}!
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {user?.role === "student" ? "Track your internship progress" :
             user?.role === "teamleader" ? "Manage your team and review tasks" :
             "Manage applications, interviews, and internship programs"}
          </p>
        </div>
        {user?.role === "admin" && (
          <button onClick={handleSeed} disabled={seeding}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50">
            {seeding ? "Seeding..." : "Load Demo Data"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-6 border border-gray-100 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-xl ${card.color} flex items-center justify-center text-2xl text-white`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Interviews for Students */}
      {user?.role === "student" && upcomingInterviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Interviews</h2>
          <div className="grid gap-4">
            {upcomingInterviews.map((iv) => (
              <div key={iv.id} className={`bg-white rounded-xl border overflow-hidden ${iv.status === "scheduled" ? "border-indigo-300 shadow-md" : ""}`}>
                {iv.status === "scheduled" && (
                  <div className="bg-indigo-600 text-white px-4 py-1.5 text-xs font-semibold tracking-wide">UPCOMING INTERVIEW</div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900">{iv.enrollment.batch.program.title}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Date</p>
                      <p className="text-sm font-semibold text-gray-900">{new Date(iv.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Time</p>
                      <p className="text-sm font-semibold text-gray-900">{new Date(iv.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Duration</p>
                      <p className="text-sm font-semibold text-gray-900">{iv.duration} min</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Mode</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{iv.mode}</p>
                    </div>
                  </div>
                  {iv.meetLink && iv.status === "scheduled" && (
                    <a href={iv.meetLink} target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition">
                      🔗 Join Meeting
                    </a>
                  )}
                  {!iv.meetLink && iv.status === "scheduled" && (
                    <p className="mt-3 text-center text-sm text-yellow-700 bg-yellow-50 rounded-lg py-2">Meeting link will be shared before the interview</p>
                  )}
                  {iv.result && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        iv.result === "selected" ? "bg-green-100 text-green-800" :
                        iv.result === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
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
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(user?.role === "admin" || user?.role === "organization") && (
            <>
              <a href="/dashboard/applications" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">📋</span>
                <span className="text-sm text-gray-700">Review Applications</span>
              </a>
              <a href="/dashboard/interviews" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">🎤</span>
                <span className="text-sm text-gray-700">Interviews</span>
              </a>
              <a href="/dashboard/programs" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">📚</span>
                <span className="text-sm text-gray-700">Programs</span>
              </a>
              <a href="/dashboard/completion" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">🎓</span>
                <span className="text-sm text-gray-700">Completion</span>
              </a>
            </>
          )}
          {user?.role === "teamleader" && (
            <>
              <a href="/dashboard/reviews" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">✅</span>
                <span className="text-sm text-gray-700">Review Tasks</span>
              </a>
              <a href="/dashboard/students" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">👥</span>
                <span className="text-sm text-gray-700">My Students</span>
              </a>
              <a href="/dashboard/completion" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">🎓</span>
                <span className="text-sm text-gray-700">Completion</span>
              </a>
              <a href="/dashboard/resources" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">🎥</span>
                <span className="text-sm text-gray-700">Study Material</span>
              </a>
            </>
          )}
          {user?.role === "student" && (
            <>
              <a href="/dashboard/interviews" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">🎤</span>
                <span className="text-sm text-gray-700">My Interviews</span>
              </a>
              <a href="/dashboard/tasks" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">📝</span>
                <span className="text-sm text-gray-700">My Tasks</span>
              </a>
              <a href="/dashboard/documents" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">📄</span>
                <span className="text-sm text-gray-700">My Documents</span>
              </a>
              <a href="/dashboard/offer-letter" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">📨</span>
                <span className="text-sm text-gray-700">Offer Letter</span>
              </a>
              <a href="/dashboard/resources" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                <span className="text-2xl">🎥</span>
                <span className="text-sm text-gray-700">Study Material</span>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
