"use client";

import { useState, useEffect, useCallback } from "react";

interface UserSession { id: string; name: string; role: string; }
interface Enrollment {
  id: string;
  studentId: string;
  status: string;
  currentWorkDay: number;
  student: { name: string; email: string };
  batch: { name: string; program: { title: string; duration: number } };
}

export default function ReportsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<{ html: string; title: string } | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [meRes, enrollRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/enrollments"),
    ]);
    if (meRes.ok) { const d = await meRes.json(); setUser(d.user); }
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
        setViewingReport({ html: data.html, title: `Daily Task Report — ${data.studentName}` });
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
        setViewingReport({ html: data.html, title: `Internship Certificate — ${data.studentName}` });
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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Certificates</h1>
        <p className="text-gray-600">View daily task reports and internship certificates.</p>
      </div>

      {selectedEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-gray-500">No active enrollments found. Reports are generated for selected/completed students.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedEnrollments.map((enr) => (
            <div key={enr.id} className="bg-white rounded-xl p-5 border">
              <div className="flex items-center justify-between">
                <div>
                  {!isStudent && <p className="font-semibold text-gray-900">{enr.student.name}</p>}
                  <p className="text-sm text-gray-600">{enr.batch.program.title} — {enr.batch.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Day {enr.currentWorkDay} / {enr.batch.program.duration} | Status: {enr.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => viewDailyReport(enr)} disabled={generating === enr.id}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                    {generating === enr.id ? "Generating..." : "Daily Task Report"}
                  </button>
                  {(enr.status === "completed" || isAdmin) && (
                    <button onClick={() => viewCertificate(enr)} disabled={generating === `cert-${enr.id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                      {generating === `cert-${enr.id}` ? "Generating..." : "Internship Certificate"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Viewer Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl my-8 max-w-[900px] w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">{viewingReport.title}</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                  Print / PDF
                </button>
                <button onClick={() => setViewingReport(null)}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-100 overflow-auto max-h-[80vh]">
              <div dangerouslySetInnerHTML={{ __html: viewingReport.html }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
