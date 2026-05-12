"use client";
import { useState, useEffect } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

import DataToolbar from "@/components/DataToolbar";
import { serverExportCSV, serverExportPDF } from "@/lib/export-utils";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleExportCSV = () => serverExportCSV("progress");

  const handleExportPDF = () => serverExportPDF("progress", "Progress");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{isStudent ? "My Progress" : "Student Progress Tracker"}</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search students..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
        <p className="text-sm text-slate-500">{isStudent ? "Track your internship journey" : "Monitor student progress across all programs"}</p>
      </div>

      {/* Program Filter */}
      {programs.length > 1 && (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-slate-300">Filter by Course:</label>
            <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm text-white min-w-[250px]">
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
              <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border text-center">
                <p className="text-3xl font-bold text-[#22d3ee]">{p.completionPercent}%</p>
                <p className="text-xs text-slate-500 mt-1">Completion</p>
              </div>
              <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border text-center">
                <p className="text-3xl font-bold text-emerald-400">{p.currentWorkDay}</p>
                <p className="text-xs text-slate-500 mt-1">Working Days</p>
              </div>
              <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border text-center">
                <p className="text-3xl font-bold text-orange-600">{p.streak}</p>
                <p className="text-xs text-slate-500 mt-1">Day Streak</p>
              </div>
              <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border text-center">
                <p className="text-3xl font-bold text-[#a78bfa]">{p.submissionsCount}</p>
                <p className="text-xs text-slate-500 mt-1">Tasks Done</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Cards */}
      {filtered.length === 0 ? (
        <>
          <PaymentBlockMessage feature="Progress Tracker" />
          <div className="text-center py-12 text-slate-500">No progress data available.</div>
        </>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border">
              <div className="flex items-start justify-between">
                <div>
                  {!isStudent && <p className="font-semibold text-white">{p.student.name}</p>}
                  <p className="text-sm text-slate-400">{p.program.title} &mdash; {p.batchName}</p>
                  {p.joiningDate && <p className="text-xs text-slate-500">Joined: {new Date(p.joiningDate).toLocaleDateString()}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${p.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-[#60a5fa]"}`}>
                    {p.status}
                  </span>
                  {p.streak > 0 && <p className="text-xs text-orange-600 mt-1">{p.streak} day streak</p>}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Day {p.currentWorkDay} of {p.totalDays}</span>
                  <span>{p.completionPercent}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${p.completionPercent >= 100 ? "bg-emerald-500" : p.completionPercent >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(100, p.completionPercent)}%` }}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
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
