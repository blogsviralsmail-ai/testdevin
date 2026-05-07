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
}

interface UserInfo {
  role: string;
  name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({});
  const [user, setUser] = useState<UserInfo | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [showDocsPrompt, setShowDocsPrompt] = useState(false);

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

  // Check if student needs to submit documents
  useEffect(() => {
    if (user?.role === "student") {
      fetch("/api/documents").then(r => r.json()).then(docs => {
        if (!docs || docs.length === 0) setShowDocsPrompt(true);
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
      {/* Documents Prompt Animation for New Students */}
      {showDocsPrompt && user?.role === "student" && (
        <div className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden" style={{ animation: "fadeInUp 0.6s ease-out" }}>
          <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } } @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }`}</style>
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2">Welcome to your Internship Dashboard!</h2>
            <p className="text-indigo-100 mb-4">Please submit your documents to get started with your internship journey.</p>
            <a href="/dashboard/documents"
              className="inline-block bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition"
              style={{ animation: "pulse 2s infinite" }}>
              Submit Documents Now
            </a>
          </div>
          <button onClick={() => setShowDocsPrompt(false)} className="absolute top-3 right-3 text-white/70 hover:text-white text-xl">&times;</button>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-2 -top-6 w-20 h-20 bg-white/5 rounded-full" />
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
