"use client";

import { useState, useEffect, useCallback } from "react";
import { calculateWorkingDay } from "@/lib/utils";

interface UserSession { id: string; name: string; role: string; }
interface Enrollment {
  id: string;
  studentId: string;
  status: string;
  currentWorkDay: number;
  joiningDate: string | null;
  student: { name: string; email: string };
  batch: { name: string; program: { title: string; duration: number } };
}
interface AnalyticsOverview {
  totalStudents: number; activeStudents: number; completedStudents: number; dropoutCount: number;
  totalPrograms: number; totalBatches: number; totalRevenue: number;
  enrollmentsByStatus: Record<string, number>; monthlyTrend: Record<string, number>;
}
interface BatchStat { batchName: string; programName: string; studentCount: number; totalAttendance: number; avgAttendancePerStudent: number; totalSubmissions: number; avgScore: number; }

export default function ReportsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<{ html: string; title: string; studentName: string; studentEmail: string } | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [batchStats, setBatchStats] = useState<BatchStat[]>([]);

  const fetchData = useCallback(async () => {
    const [meRes, enrollRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/enrollments"),
    ]);
    if (meRes.ok) {
      const d = await meRes.json();
      setUser(d.user);
      if (d.user?.role === "admin" || d.user?.role === "organization") {
        const [overviewRes, batchRes] = await Promise.all([
          fetch("/api/reports/analytics?type=overview"),
          fetch("/api/reports/analytics?type=batch-comparison"),
        ]);
        if (overviewRes.ok) setAnalytics(await overviewRes.json());
        if (batchRes.ok) { const bd = await batchRes.json(); setBatchStats(bd.batchStats || []); }
      }
    }
    if (enrollRes.ok) setEnrollments(await enrollRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isTL = user?.role === "teamleader";

  const selectedEnrollments = enrollments.filter(e => e.status === "selected" || e.status === "completed");

  const viewDailyReport = async (enrollment: Enrollment) => {
    setGenerating(enrollment.id);
    try {
      const res = await fetch(`/api/reports/daily-tasks?studentId=${enrollment.studentId}`);
      if (res.ok) {
        const data = await res.json();
        setViewingReport({ html: data.html, title: `Daily Task Report — ${data.studentName}`, studentName: data.studentName, studentEmail: enrollment.student.email });
      } else {
        alert("Failed to generate report");
      }
    } catch { alert("Error generating report"); }
    setGenerating(null);
  };

  const viewCertificate = async (enrollment: Enrollment) => {
    setGenerating(`cert-${enrollment.id}`);
    try {
      const res = await fetch(`/api/certificates/internship?enrollmentId=${enrollment.id}`);
      if (res.ok) {
        const data = await res.json();
        setViewingReport({ html: data.html, title: `Internship Certificate — ${data.studentName}`, studentName: data.studentName, studentEmail: "" });
      } else {
        alert("Failed to generate certificate");
      }
    } catch { alert("Error generating certificate"); }
    setGenerating(null);
  };

  const handlePrint = () => {
    if (!viewingReport) return;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><title>${viewingReport.title}</title><style>@media print{@page{size:A4;margin:0;}body{margin:0;padding:0;}}</style></head><body>${viewingReport.html}</body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  };

  const handleEmailReport = async () => {
    if (!viewingReport) return;
    setEmailing(true);
    try {
      const res = await fetch("/api/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: viewingReport.studentEmail,
          studentName: viewingReport.studentName,
          reportHtml: viewingReport.html,
        }),
      });
      if (res.ok) {
        alert(`Report emailed to ${viewingReport.studentEmail} successfully!`);
      } else {
        alert("Failed to send email");
      }
    } catch { alert("Error sending email"); }
    setEmailing(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-slate-400">View daily task reports. Reports cover joining date to current/completion date.</p>
      </div>

      {/* Admin Analytics Section */}
      {isAdmin && analytics && (
        <div className="mb-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Students", value: analytics.totalStudents, icon: "👥", color: "#60a5fa" },
              { label: "Active Interns", value: analytics.activeStudents, icon: "🎓", color: "#34d399" },
              { label: "Completed", value: analytics.completedStudents, icon: "🏆", color: "#a78bfa" },
              { label: "Dropout / Rejected", value: analytics.dropoutCount, icon: "📉", color: "#f87171" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Enrollment Status Breakdown */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold text-white mb-3">Enrollment Status Breakdown</h3>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(analytics.enrollmentsByStatus).map(([status, count]) => (
                <div key={status} className="rounded-lg px-4 py-2 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-lg font-bold text-white">{count}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{status.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Batch Comparison */}
          {batchStats.length > 0 && (
            <div className="rounded-xl p-5 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white mb-3">Batch Comparison</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-white/[0.06]">
                    <th className="pb-2 pr-4">Batch</th>
                    <th className="pb-2 pr-4">Program</th>
                    <th className="pb-2 pr-4 text-center">Students</th>
                    <th className="pb-2 pr-4 text-center">Avg Attendance</th>
                    <th className="pb-2 pr-4 text-center">Submissions</th>
                    <th className="pb-2 text-center">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {batchStats.map(b => (
                    <tr key={b.batchName} className="border-b border-white/[0.03]">
                      <td className="py-2 pr-4 text-white font-medium">{b.batchName}</td>
                      <td className="py-2 pr-4 text-slate-400">{b.programName}</td>
                      <td className="py-2 pr-4 text-center text-white">{b.studentCount}</td>
                      <td className="py-2 pr-4 text-center text-white">{b.avgAttendancePerStudent} days</td>
                      <td className="py-2 pr-4 text-center text-white">{b.totalSubmissions}</td>
                      <td className="py-2 text-center font-semibold" style={{ color: b.avgScore >= 70 ? '#34d399' : b.avgScore >= 50 ? '#f59e0b' : '#f87171' }}>{b.avgScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Monthly Enrollment Trend */}
          {Object.keys(analytics.monthlyTrend).length > 0 && (
            <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white mb-3">Monthly Enrollment Trend</h3>
              <div className="flex gap-2 items-end h-32 overflow-x-auto">
                {Object.entries(analytics.monthlyTrend).slice(-12).map(([month, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.monthlyTrend));
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={month} className="flex flex-col items-center gap-1 min-w-[40px]">
                      <span className="text-[10px] text-slate-400">{count}</span>
                      <div className="w-6 rounded-t" style={{ height: `${Math.max(4, height)}%`, background: 'linear-gradient(180deg, #0EA5B8, #a78bfa)' }} />
                      <span className="text-[9px] text-slate-500">{month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedEnrollments.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center border">
          <p className="text-slate-500">No active enrollments found. Reports are generated for selected/completed students.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedEnrollments.map((enr) => (
            <div key={enr.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border">
              <div className="flex items-center justify-between">
                <div>
                  {!isStudent && <p className="font-semibold text-white">{enr.student.name}</p>}
                  <p className="text-sm text-slate-400">{enr.batch.program.title} — {enr.batch.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Day {Math.max(enr.joiningDate ? calculateWorkingDay(enr.joiningDate) : enr.currentWorkDay, 1)} / {enr.batch.program.duration} | Status: {enr.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => viewDailyReport(enr)} disabled={generating === enr.id}
                    className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm hover:bg-[#0891b2] disabled:opacity-50">
                    {generating === enr.id ? "Generating..." : "Daily Task Report"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Viewer Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-auto">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] shadow-2xl my-8 max-w-[900px] w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-white">{viewingReport.title}</h3>
              <div className="flex gap-2">
                <button onClick={handleEmailReport} disabled={emailing}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50">
                  {emailing ? "Sending..." : "Email Report"}
                </button>
                <button onClick={handlePrint}
                  className="px-4 py-1.5 bg-[#0EA5B8] text-white rounded text-sm hover:bg-[#0891b2]">
                  Print / PDF
                </button>
                <button onClick={() => setViewingReport(null)}
                  className="px-4 py-1.5 bg-gray-200 text-slate-300 rounded text-sm hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] overflow-auto max-h-[80vh]">
              <div dangerouslySetInnerHTML={{ __html: viewingReport.html }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
