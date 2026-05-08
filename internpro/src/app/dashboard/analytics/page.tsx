"use client";
import { useState, useEffect } from "react";

interface AnalyticsData {
  overview: { totalStudents: number; activeStudents: number; totalTasks: number; totalRevenue: number; avgAttendance: number };
  programCompletion: { name: string; total: number; completed: number; rate: number }[];
  attendanceTrend: { date: string; present: number; absent: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/analytics/dashboard").then(r => r.json()).then(setData);
    fetch("/api/analytics/weekly-report").then(r => r.json()).then(setWeeklyReport);
  }, []);

  if (!data) return <div className="text-center py-12">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500">Platform performance overview</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Total Students</p>
          <p className="text-2xl font-bold">{data.overview.totalStudents}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Active</p>
          <p className="text-2xl font-bold">{data.overview.activeStudents}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Total Tasks</p>
          <p className="text-2xl font-bold">{data.overview.totalTasks}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Avg Attendance</p>
          <p className="text-2xl font-bold">{data.overview.avgAttendance}%</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Revenue</p>
          <p className="text-2xl font-bold">₹{data.overview.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Program Completion */}
      <div className="bg-white rounded-xl p-6 border">
        <h2 className="text-lg font-semibold mb-4">Program Completion Rates</h2>
        <div className="space-y-3">
          {data.programCompletion.map(p => (
            <div key={p.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-500">{p.completed}/{p.total} ({p.rate}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{ width: `${p.rate}%` }} />
              </div>
            </div>
          ))}
          {data.programCompletion.length === 0 && <p className="text-gray-400 text-sm">No program data yet</p>}
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="bg-white rounded-xl p-6 border">
        <h2 className="text-lg font-semibold mb-4">Attendance Trend (Last 14 Days)</h2>
        <div className="flex items-end gap-1 h-40">
          {data.attendanceTrend.map(day => {
            const total = day.present + day.absent;
            const pct = total > 0 ? (day.present / total) * 100 : 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: "100%" }}>
                  <div className="absolute bottom-0 w-full bg-green-400 rounded-t" style={{ height: `${pct}%` }} />
                </div>
                <span className="text-[9px] text-gray-400 rotate-[-45deg]">{day.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
        {data.attendanceTrend.length === 0 && <p className="text-gray-400 text-sm text-center">No attendance data yet</p>}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl p-6 border">
        <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
        {data.monthlyRevenue.length > 0 ? (
          <div className="flex items-end gap-3 h-40">
            {data.monthlyRevenue.map(m => {
              const max = Math.max(...data.monthlyRevenue.map(r => r.amount));
              const pct = max > 0 ? (m.amount / max) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium">₹{(m.amount / 1000).toFixed(0)}k</span>
                  <div className="w-full bg-indigo-500 rounded-t" style={{ height: `${pct}%` }} />
                  <span className="text-[10px] text-gray-500">{m.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center">No revenue data yet</p>
        )}
      </div>

      {/* Weekly Report Summary */}
      {weeklyReport && (
        <div className="bg-white rounded-xl p-6 border">
          <h2 className="text-lg font-semibold mb-4">This Week&apos;s Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold text-indigo-600">{(weeklyReport as Record<string, number>).totalSubmissions || (weeklyReport as Record<string, number>).tasksCompleted || 0}</p><p className="text-xs text-gray-500">Tasks Submitted</p></div>
            <div><p className="text-2xl font-bold text-green-600">{(weeklyReport as Record<string, number>).avgAttendance || (weeklyReport as Record<string, number>).attendanceDays || 0}</p><p className="text-xs text-gray-500">Attendance Days</p></div>
            <div><p className="text-2xl font-bold text-purple-600">{(weeklyReport as Record<string, number>).newStudents || 0}</p><p className="text-xs text-gray-500">New Students</p></div>
            <div><p className="text-2xl font-bold text-amber-600">{(weeklyReport as Record<string, number>).completions || 0}</p><p className="text-xs text-gray-500">Completions</p></div>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="flex gap-3">
        <button onClick={() => { const csv = "Metric,Value\n" + Object.entries(data.overview).map(([k, v]) => `${k},${v}`).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "analytics-export.csv"; a.click(); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Export CSV</button>
      </div>
    </div>
  );
}
