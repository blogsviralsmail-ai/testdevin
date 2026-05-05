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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name || "User"}!
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
