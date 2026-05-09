"use client";
import { useState, useEffect } from "react";

interface ProgressItem {
  id: string;
  student: { id: string; name: string; email: string; avatar?: string };
  program: { title: string; domain: string; duration: number };
  batchName: string;
  status: string;
  joiningDate: string | null;
  currentWorkDay: number;
  totalDays: number;
  completionPercent: number;
  presentDays: number;
  submissionsCount: number;
  certificatesCount: number;
  streak: number;
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [programFilter, setProgramFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/progress").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.json()),
    ]).then(([p, m]) => {
      setProgress(Array.isArray(p) ? p : []);
      setUser(m.user || m);
      setLoading(false);
    });
  }, []);

  const isStudent = user?.role === "student";
  const programs = [...new Set(progress.map(p => p.program.title))];
  const filtered = programFilter === "all" ? progress : progress.filter(p => p.program.title === programFilter);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isStudent ? "My Progress" : "Student Progress Tracker"}</h1>
        <p className="text-sm text-gray-500">{isStudent ? "Track your internship journey" : "Monitor student progress across all programs"}</p>
      </div>

      {/* Program Filter */}
      {programs.length > 1 && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-gray-700">Filter by Course:</label>
            <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm text-gray-900 min-w-[250px]">
              <option value="all">All Courses ({progress.length})</option>
              {programs.map(p => <option key={p} value={p}>{p} ({progress.filter(pr => pr.program.title === p).length})</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Stats Cards (for students) */}
      {isStudent && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={`stats-${p.id}`} className="contents">
              <div className="bg-white rounded-xl p-4 border text-center">
                <p className="text-3xl font-bold text-indigo-600">{p.completionPercent}%</p>
                <p className="text-xs text-gray-500 mt-1">Completion</p>
              </div>
              <div className="bg-white rounded-xl p-4 border text-center">
                <p className="text-3xl font-bold text-green-600">{p.currentWorkDay}</p>
                <p className="text-xs text-gray-500 mt-1">Working Days</p>
              </div>
              <div className="bg-white rounded-xl p-4 border text-center">
                <p className="text-3xl font-bold text-orange-600">{p.streak}</p>
                <p className="text-xs text-gray-500 mt-1">Day Streak</p>
              </div>
              <div className="bg-white rounded-xl p-4 border text-center">
                <p className="text-3xl font-bold text-purple-600">{p.submissionsCount}</p>
                <p className="text-xs text-gray-500 mt-1">Tasks Done</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No progress data available.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-5 border">
              <div className="flex items-start justify-between">
                <div>
                  {!isStudent && <p className="font-semibold text-gray-900">{p.student.name}</p>}
                  <p className="text-sm text-gray-600">{p.program.title} &mdash; {p.batchName}</p>
                  {p.joiningDate && <p className="text-xs text-gray-400">Joined: {new Date(p.joiningDate).toLocaleDateString()}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${p.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {p.status}
                  </span>
                  {p.streak > 0 && <p className="text-xs text-orange-600 mt-1">{p.streak} day streak</p>}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Day {p.currentWorkDay} of {p.totalDays}</span>
                  <span>{p.completionPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${p.completionPercent >= 100 ? "bg-green-500" : p.completionPercent >= 50 ? "bg-indigo-500" : "bg-orange-500"}`}
                    style={{ width: `${Math.min(100, p.completionPercent)}%` }}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
                <span>Attendance: {p.presentDays} days</span>
                <span>Tasks: {p.submissionsCount}</span>
                <span>Certificates: {p.certificatesCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
