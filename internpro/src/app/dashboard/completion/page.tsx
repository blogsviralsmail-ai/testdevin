"use client";

import { useState, useEffect, useCallback } from "react";
import { calculateWorkingDay } from "@/lib/utils";

function getWorkDay(enrollment: { joiningDate: string | null; currentWorkDay: number }): number {
  if (enrollment.joiningDate) return calculateWorkingDay(enrollment.joiningDate);
  return enrollment.currentWorkDay;
}

interface Enrollment {
  id: string;
  status: string;
  teamLeaderCategory: string | null;
  teamLeaderRemarks: string | null;
  adminApproved: boolean;
  adminRemarks: string | null;
  completedAt: string | null;
  currentWorkDay: number;
  joiningDate: string | null;
  student: { name: string; email: string; employeeId: string | null };
  batch: { name: string; program: { title: string; duration: number; domain: string } };
  _count: { attendances: number; submissions: number; certificates: number };
}

interface UserSession {
  id: string;
  role: string;
}

export default function CompletionPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [categorizeModal, setCategorizeModal] = useState<Enrollment | null>(null);
  const [approveModal, setApproveModal] = useState<Enrollment | null>(null);
  const [categoryForm, setCategoryForm] = useState({ category: "good", remarks: "" });
  const [approveRemarks, setApproveRemarks] = useState("");
  const [filter, setFilter] = useState("pending_tl");
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [expLetters, setExpLetters] = useState<Record<string, { letterNumber: string; htmlContent: string | null; category: string; issuedAt: string }>>({});
  const [viewingLetter, setViewingLetter] = useState<{ letterNumber: string; htmlContent: string | null; studentName: string } | null>(null);

  const fetchData = useCallback(async () => {
    const [enrollRes, meRes, expRes] = await Promise.all([
      fetch("/api/enrollments"),
      fetch("/api/auth/me"),
      fetch("/api/experience-letters"),
    ]);
    if (enrollRes.ok) setEnrollments(await enrollRes.json());
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }
    if (expRes.ok) {
      const letters = await expRes.json();
      const map: Record<string, { letterNumber: string; htmlContent: string | null; category: string; issuedAt: string }> = {};
      for (const l of letters) {
        map[l.enrollmentId] = { letterNumber: l.letterNumber, htmlContent: l.htmlContent, category: l.category, issuedAt: l.issuedAt || l.createdAt };
      }
      setExpLetters(map);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isTeamLeader = user?.role === "teamleader";

  const handleCategorize = async () => {
    if (!categorizeModal) return;
    await fetch(`/api/enrollments/${categorizeModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamLeaderCategory: categoryForm.category,
        teamLeaderRemarks: categoryForm.remarks,
      }),
    });
    setCategorizeModal(null);
    fetchData();
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    const enrollmentId = approveModal.id;

    // If TL hasn't categorized yet, auto-set as "good" before approving
    if (!approveModal.teamLeaderCategory) {
      const catRes = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamLeaderCategory: "good", teamLeaderRemarks: "Auto-categorized by admin" }),
      });
      if (!catRes.ok) {
        alert("Failed to auto-categorize. Please try again.");
        return;
      }
    }

    // Generate experience letter (this also updates enrollment to completed)
    const expRes = await fetch("/api/experience-letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, adminRemarks: approveRemarks }),
    });
    if (!expRes.ok) {
      const data = await expRes.json();
      alert("Experience letter error: " + (data.error || "Unknown error"));
    }

    // Auto-generate completion certificate
    const certRes = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, type: "completion" }),
    });
    if (!certRes.ok) {
      const data = await certRes.json();
      console.error("Certificate error:", data.error);
    }

    setApproveModal(null);
    setApproveRemarks("");
    fetchData();
  };

  const eligibleEnrollments = enrollments.filter((e) => {
    // Status filter
    let statusMatch = true;
    if (filter === "all") statusMatch = e.status === "active" || e.status === "selected" || e.status === "completed";
    else if (filter === "pending_tl") statusMatch = (e.status === "active" || e.status === "selected") && !e.teamLeaderCategory;
    else if (filter === "pending_admin") statusMatch = e.teamLeaderCategory !== null && !e.adminApproved && e.status !== "completed";
    else if (filter === "completed") statusMatch = e.status === "completed";
    if (!statusMatch) return false;

    // Program filter
    if (programFilter && e.batch.program.title !== programFilter) return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = e.student.name.toLowerCase().includes(q);
      const emailMatch = e.student.email.toLowerCase().includes(q);
      const empMatch = e.student.employeeId?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !empMatch) return false;
    }

    return true;
  });

  const getCategoryBadge = (cat: string | null) => {
    if (!cat) return null;
    const colors: Record<string, string> = {
      excellent: "bg-emerald-500/10 text-emerald-400",
      good: "bg-blue-500/10 text-[#60a5fa]",
      average: "bg-amber-500/10 text-amber-400",
      "below-average": "bg-orange-500/10 text-orange-400",
      poor: "bg-red-500/10 text-red-400",
    };
    return colors[cat] || "bg-transparent text-slate-300";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Completion Approval</h1>
          <p className="text-slate-400 text-sm">
            {isTeamLeader ? "Categorize students based on their performance" :
             isAdmin ? "Review TL categorization and approve internship completion" :
             "Your completion status"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "pending_tl", label: "Pending TL Review" },
          { key: "pending_admin", label: "Pending Admin Approval" },
          { key: "completed", label: "Completed" },
          { key: "all", label: "All" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === tab.key ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400 border hover:bg-transparent"}`}
          >
            {tab.label} ({enrollments.filter(e => {
              if (tab.key === "all") return e.status === "active" || e.status === "selected" || e.status === "completed";
              if (tab.key === "pending_tl") return (e.status === "active" || e.status === "selected") && !e.teamLeaderCategory;
              if (tab.key === "pending_admin") return e.teamLeaderCategory && !e.adminApproved && e.status !== "completed";
              if (tab.key === "completed") return e.status === "completed";
              return false;
            }).length})
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or employee ID..."
              className="w-full px-3 py-2 border rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm text-white">
              <option value="">All Programs</option>
              {[...new Set(enrollments.map(e => e.batch.program.title))].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {(searchQuery || programFilter) && (
            <button onClick={() => { setSearchQuery(""); setProgramFilter(""); }} className="text-xs text-red-400 hover:text-red-800">Clear</button>
          )}
        </div>
      </div>

      {/* Categorize Modal */}
      {categorizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h2 className="text-lg font-bold text-white mb-4">Categorize Student</h2>
            <p className="text-sm text-slate-400 mb-4">
              <strong className="text-white">{categorizeModal.student.name}</strong> — {categorizeModal.batch.program.title}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Work Days: {getWorkDay(categorizeModal)}/{categorizeModal.batch.program.duration} | 
              Attendance: {categorizeModal._count.attendances} days | 
              Submissions: {categorizeModal._count.submissions}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <select value={categoryForm.category} onChange={(e) => setCategoryForm({ ...categoryForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                  <option value="excellent">Excellent (90%+ performance)</option>
                  <option value="good">Good (70-89% performance)</option>
                  <option value="average">Average (50-69% performance)</option>
                  <option value="below-average">Below Average (30-49% performance)</option>
                  <option value="poor">Poor (Below 30% performance)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Remarks (optional)</label>
                <textarea value={categoryForm.remarks} onChange={(e) => setCategoryForm({ ...categoryForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white" rows={3}
                  placeholder="Student ke baare mein kuch likhna ho..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCategorize} className="flex-1 bg-[#0EA5B8] text-white px-4 py-2 rounded-lg hover:bg-[#0891b2]">
                Save Category
              </button>
              <button onClick={() => setCategorizeModal(null)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h2 className="text-lg font-bold text-white mb-4">Approve Completion</h2>
            <p className="text-sm text-slate-400 mb-2">
              <strong className="text-white">{approveModal.student.name}</strong> — {approveModal.batch.program.title}
            </p>
            <div className={`px-3 py-2 rounded-lg mb-4 text-sm ${getCategoryBadge(approveModal.teamLeaderCategory)}`}>
              TL Category: <strong>{approveModal.teamLeaderCategory}</strong>
              {approveModal.teamLeaderRemarks && <span className="ml-2">— {approveModal.teamLeaderRemarks}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Admin Remarks (optional)</label>
              <textarea value={approveRemarks} onChange={(e) => setApproveRemarks(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-white" rows={3}
                placeholder="Final remarks..." />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              On approval, an Experience Letter will be generated instantly.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={handleApprove} className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Approve & Generate Experience Letter
              </button>
              <button onClick={() => setApproveModal(null)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {eligibleEnrollments.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center border">
          <p className="text-4xl mb-4">🎓</p>
          <p className="text-slate-400">No students in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eligibleEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border hover:shadow-none transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">{enrollment.student.name}</h3>
                  <p className="text-sm text-slate-400">{enrollment.student.email}</p>
                  {enrollment.student.employeeId && <p className="text-xs text-[#22d3ee] font-medium">{enrollment.student.employeeId}</p>}
                  <p className="text-sm text-[#22d3ee] mt-1">{enrollment.batch.program.title} — {enrollment.batch.name}</p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    <span>Joining: {enrollment.joiningDate ? new Date(enrollment.joiningDate).toLocaleDateString("en-IN") : "—"}</span>
                    <span>Working Day: {getWorkDay(enrollment)}/{enrollment.batch.program.duration}</span>
                    <span>Attendance: {enrollment._count.attendances} days</span>
                    <span>Tasks: {enrollment._count.submissions} submitted</span>
                    {enrollment.completedAt && <span>Last Working Day: {new Date(enrollment.completedAt).toLocaleDateString("en-IN")}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {enrollment.teamLeaderCategory && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadge(enrollment.teamLeaderCategory)}`}>
                        TL: {enrollment.teamLeaderCategory}
                      </span>
                    )}
                    {enrollment.adminApproved && (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                        Admin Approved
                      </span>
                    )}
                    {enrollment.status === "completed" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(isTeamLeader || isAdmin) && !enrollment.teamLeaderCategory && enrollment.status !== "completed" && (
                    <button
                      onClick={() => { setCategorizeModal(enrollment); setCategoryForm({ category: "good", remarks: "" }); }}
                      className="px-3 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs hover:bg-yellow-200"
                    >
                      Categorize
                    </button>
                  )}
                  {isAdmin && enrollment.status !== "completed" && (
                    <button
                      onClick={() => { setApproveModal(enrollment); setApproveRemarks(""); }}
                      className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs hover:bg-green-200"
                    >
                      {enrollment.teamLeaderCategory ? "Approve & Complete" : "Direct Approve"}
                    </button>
                  )}
                  {enrollment.status === "completed" && (
                    <span className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium">
                      Internship Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Experience Letter View Modal */}
      {viewingLetter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-transparent">
              <h2 className="text-lg font-bold text-white">Experience Letter</h2>
              <div className="flex gap-2">
                <button onClick={() => {
                  const w = window.open("", "_blank");
                  if (w) {
                    w.document.write(`<!DOCTYPE html><html><head><title>${viewingLetter.letterNumber}</title><style>*{margin:0;padding:0;box-sizing:border-box;}@page{size:A4;margin:0;}body{font-family:'Calibri','Segoe UI',Arial,sans-serif;padding:20px;margin:0 auto;background:#e8e8e8;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}.letter-wrap{background:white;margin:0 auto;}.a4-page{width:210mm;min-height:297mm;margin:0 auto 20px;background:white;box-shadow:0 2px 12px rgba(0,0,0,0.15);display:flex;flex-direction:column;box-sizing:border-box;page-break-after:always;}.a4-page:last-child{page-break-after:auto;}.page-content{flex:1;padding:18px 36px 10px;}.page-footer{flex-shrink:0;}.btn-bar{text-align:center;margin-bottom:15px;display:flex;gap:10px;justify-content:center;}.btn-bar button{padding:10px 28px;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;}.btn-print{background:#0000AA;color:white;}.btn-pdf{background:#d32f2f;color:white;}table{border-collapse:collapse;}td,th{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}img{max-width:100%;display:inline-block;}@media print{.btn-bar{display:none!important;}body{padding:0;margin:0;background:white!important;}.letter-wrap{box-shadow:none;}.a4-page{box-shadow:none;margin-bottom:0;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}</style></head><body><div class="btn-bar"><button class="btn-print" onclick="window.print()">Print</button><button class="btn-pdf" onclick="window.print()">Download PDF</button></div><div class="letter-wrap">${viewingLetter.htmlContent}</div></body></html>`);
                    w.document.close();
                  }
                }} className="px-3 py-1.5 bg-[#0000AA] text-white rounded-lg text-xs hover:bg-blue-900">Print / PDF</button>
                <button onClick={() => setViewingLetter(null)} className="px-3 py-1.5 bg-transparent text-slate-300 rounded-lg text-xs hover:bg-white/10">Close</button>
              </div>
            </div>
            <div className="p-6">
              {viewingLetter.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: viewingLetter.htmlContent }} />
              ) : (
                <p className="text-slate-500 text-center py-8">Letter content not available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
