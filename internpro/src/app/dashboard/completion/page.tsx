"use client";

import { useState, useEffect, useCallback } from "react";

interface Enrollment {
  id: string;
  status: string;
  teamLeaderCategory: string | null;
  teamLeaderRemarks: string | null;
  adminApproved: boolean;
  adminRemarks: string | null;
  completedAt: string | null;
  currentWorkDay: number;
  student: { name: string; email: string };
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
  const [filter, setFilter] = useState("all");
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

    setApproveModal(null);
    setApproveRemarks("");
    fetchData();
  };

  const eligibleEnrollments = enrollments.filter((e) => {
    if (filter === "all") return e.status === "active" || e.status === "selected" || e.status === "completed";
    if (filter === "pending_tl") return (e.status === "active" || e.status === "selected") && !e.teamLeaderCategory;
    if (filter === "pending_admin") return e.teamLeaderCategory && !e.adminApproved && e.status !== "completed";
    if (filter === "completed") return e.status === "completed";
    return true;
  });

  const getCategoryBadge = (cat: string | null) => {
    if (!cat) return null;
    const colors: Record<string, string> = {
      excellent: "bg-green-100 text-green-700",
      good: "bg-blue-100 text-blue-700",
      average: "bg-yellow-100 text-yellow-700",
      "below-average": "bg-orange-100 text-orange-700",
      poor: "bg-red-100 text-red-700",
    };
    return colors[cat] || "bg-gray-100 text-gray-700";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Completion</h1>
          <p className="text-gray-600 text-sm">
            {isTeamLeader ? "Categorize students based on their performance" :
             isAdmin ? "Review TL categorization and approve for experience letter" :
             "Your completion status and certificates"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "pending_tl", label: "Pending TL Review" },
          { key: "pending_admin", label: "Pending Admin Approval" },
          { key: "completed", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === tab.key ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Categorize Modal */}
      {categorizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Categorize Student</h2>
            <p className="text-sm text-gray-600 mb-4">
              <strong className="text-gray-900">{categorizeModal.student.name}</strong> — {categorizeModal.batch.program.title}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Work Days: {categorizeModal.currentWorkDay}/{categorizeModal.batch.program.duration} | 
              Attendance: {categorizeModal._count.attendances} days | 
              Submissions: {categorizeModal._count.submissions}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={categoryForm.category} onChange={(e) => setCategoryForm({ ...categoryForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                  <option value="excellent">Excellent (90%+ performance)</option>
                  <option value="good">Good (70-89% performance)</option>
                  <option value="average">Average (50-69% performance)</option>
                  <option value="below-average">Below Average (30-49% performance)</option>
                  <option value="poor">Poor (Below 30% performance)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                <textarea value={categoryForm.remarks} onChange={(e) => setCategoryForm({ ...categoryForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" rows={3}
                  placeholder="Student ke baare mein kuch likhna ho..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCategorize} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Save Category
              </button>
              <button onClick={() => setCategorizeModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Approve Completion</h2>
            <p className="text-sm text-gray-600 mb-2">
              <strong className="text-gray-900">{approveModal.student.name}</strong> — {approveModal.batch.program.title}
            </p>
            <div className={`px-3 py-2 rounded-lg mb-4 text-sm ${getCategoryBadge(approveModal.teamLeaderCategory)}`}>
              TL Category: <strong>{approveModal.teamLeaderCategory}</strong>
              {approveModal.teamLeaderRemarks && <span className="ml-2">— {approveModal.teamLeaderRemarks}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Remarks (optional)</label>
              <textarea value={approveRemarks} onChange={(e) => setApproveRemarks(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" rows={3}
                placeholder="Final remarks..." />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Approve karne pe instantly Experience Letter generate ho jayega.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={handleApprove} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Approve & Generate Experience Letter
              </button>
              <button onClick={() => setApproveModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {eligibleEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-4xl mb-4">🎓</p>
          <p className="text-gray-600">No students in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eligibleEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{enrollment.student.name}</h3>
                  <p className="text-sm text-gray-600">{enrollment.student.email}</p>
                  <p className="text-sm text-indigo-600 mt-1">{enrollment.batch.program.title} — {enrollment.batch.name}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                    <span>Working Day: {enrollment.currentWorkDay}/{enrollment.batch.program.duration}</span>
                    <span>Attendance: {enrollment._count.attendances} days</span>
                    <span>Tasks: {enrollment._count.submissions} submitted</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {enrollment.teamLeaderCategory && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadge(enrollment.teamLeaderCategory)}`}>
                        TL: {enrollment.teamLeaderCategory}
                      </span>
                    )}
                    {enrollment.adminApproved && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Admin Approved
                      </span>
                    )}
                    {enrollment.status === "completed" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(isTeamLeader || isAdmin) && !enrollment.teamLeaderCategory && enrollment.status !== "completed" && (
                    <button
                      onClick={() => { setCategorizeModal(enrollment); setCategoryForm({ category: "good", remarks: "" }); }}
                      className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-xs hover:bg-yellow-200"
                    >
                      Categorize
                    </button>
                  )}
                  {isAdmin && enrollment.status !== "completed" && (
                    <button
                      onClick={() => { setApproveModal(enrollment); setApproveRemarks(""); }}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200"
                    >
                      {enrollment.teamLeaderCategory ? "Approve & Complete" : "Direct Approve"}
                    </button>
                  )}
                  {enrollment.status === "completed" && expLetters[enrollment.id] && (
                    <button
                      onClick={() => setViewingLetter({ letterNumber: expLetters[enrollment.id].letterNumber, htmlContent: expLetters[enrollment.id].htmlContent, studentName: enrollment.student.name })}
                      className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs hover:bg-indigo-200"
                    >
                      View Experience Letter
                    </button>
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
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Experience Letter — {viewingLetter.studentName}</h2>
              <div className="flex gap-2">
                <button onClick={() => {
                  const w = window.open("", "_blank");
                  if (w) {
                    w.document.write(`<!DOCTYPE html><html><head><title>${viewingLetter.letterNumber}</title><style>body{font-family:'Calibri','Segoe UI',Arial,sans-serif;padding:20px;max-width:820px;margin:0 auto;background:#f5f5f5;}.letter-wrap{background:white;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);}.btn-bar{text-align:center;margin-bottom:15px;display:flex;gap:10px;justify-content:center;}.btn-bar button{padding:10px 28px;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;}.btn-print{background:#0000AA;color:white;}.btn-pdf{background:#d32f2f;color:white;}@media print{.btn-bar{display:none!important;}body{padding:0;background:white;}.letter-wrap{box-shadow:none;padding:0;}}</style></head><body><div class="btn-bar"><button class="btn-print" onclick="window.print()">Print</button><button class="btn-pdf" onclick="window.print()">Download PDF</button></div><div class="letter-wrap">${viewingLetter.htmlContent}</div></body></html>`);
                    w.document.close();
                  }
                }} className="px-3 py-1.5 bg-[#0000AA] text-white rounded-lg text-xs hover:bg-blue-900">Print / PDF</button>
                <button onClick={() => setViewingLetter(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200">Close</button>
              </div>
            </div>
            <div className="p-6">
              {viewingLetter.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: viewingLetter.htmlContent }} />
              ) : (
                <p className="text-gray-500 text-center py-8">Letter content not available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
