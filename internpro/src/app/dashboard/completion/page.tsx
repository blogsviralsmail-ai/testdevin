"use client";

import { useState, useEffect, useCallback } from "react";

interface Enrollment {
  id: string;
  status: string;
  teamLeaderCategory: string | null;
  teamLeaderRemarks: string | null;
  adminApproved: boolean;
  adminRemarks: string | null;
  currentWorkDay: number;
  student: { id: string; name: string; email: string; collegeName: string | null };
  batch: { name: string; program: { title: string; duration: number; totalDays: number } };
  experienceLetter: { id: string; letterNumber: string } | null;
}

interface UserSession {
  id: string;
  role: string;
}

const categories = [
  { value: "excellent", label: "Excellent", color: "bg-green-100 text-green-700" },
  { value: "good", label: "Good", color: "bg-blue-100 text-blue-700" },
  { value: "average", label: "Average", color: "bg-yellow-100 text-yellow-700" },
  { value: "below_average", label: "Below Average", color: "bg-orange-100 text-orange-700" },
  { value: "poor", label: "Poor", color: "bg-red-100 text-red-700" },
];

export default function CompletionPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [categorizeModal, setCategorizeModal] = useState<Enrollment | null>(null);
  const [approveModal, setApproveModal] = useState<Enrollment | null>(null);
  const [category, setCategory] = useState("");
  const [remarks, setRemarks] = useState("");

  const fetchData = useCallback(async () => {
    const [enrollRes, meRes] = await Promise.all([
      fetch("/api/enrollments"),
      fetch("/api/auth/me"),
    ]);
    if (enrollRes.ok) setEnrollments(await enrollRes.json());
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCategorize = async () => {
    if (!categorizeModal) return;
    const res = await fetch(`/api/enrollments/${categorizeModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamLeaderCategory: category,
        teamLeaderRemarks: remarks,
      }),
    });
    if (res.ok) {
      setCategorizeModal(null);
      setCategory("");
      setRemarks("");
      fetchData();
    }
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    const res = await fetch("/api/experience-letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId: approveModal.id,
        adminRemarks: remarks,
      }),
    });
    if (res.ok) {
      setApproveModal(null);
      setRemarks("");
      fetchData();
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isTeamLeader = user?.role === "teamleader";

  // Filter enrollments that are selected (in progress) or completed
  const eligible = enrollments.filter((e) => e.status === "selected" || e.status === "completed");
  const needsCategorization = eligible.filter((e) => !e.teamLeaderCategory && e.status === "selected");
  const categorized = eligible.filter((e) => e.teamLeaderCategory && !e.adminApproved && e.status !== "completed");
  const completed = eligible.filter((e) => e.status === "completed");

  const getCategoryInfo = (cat: string | null) => {
    return categories.find((c) => c.value === cat) || { label: cat || "None", color: "bg-gray-100 text-gray-600" };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Completion</h1>
          <p className="text-gray-600 text-sm">
            {isTeamLeader ? "Categorize students and submit for admin approval" : "Review categorizations and approve for experience letter"}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">{needsCategorization.length} Pending</span>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">{categorized.length} Awaiting Approval</span>
          <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">{completed.length} Completed</span>
        </div>
      </div>

      {/* Needs Categorization (Team Leader) */}
      {(isTeamLeader || isAdmin) && needsCategorization.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-yellow-700">Needs Categorization</h2>
          <div className="space-y-4">
            {needsCategorization.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-xl p-6 border border-yellow-200 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{enrollment.student.name}</h3>
                    <p className="text-sm text-gray-500">{enrollment.student.email}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span>📚 {enrollment.batch.program.title}</span>
                      <span>📦 {enrollment.batch.name}</span>
                      <span>📅 Day {enrollment.currentWorkDay} / {enrollment.batch.program.totalDays}</span>
                    </div>
                  </div>
                  {isTeamLeader && (
                    <button
                      onClick={() => { setCategorizeModal(enrollment); setCategory(""); setRemarks(""); }}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 transition"
                    >
                      Categorize
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Awaiting Admin Approval */}
      {categorized.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-blue-700">Awaiting Admin Approval</h2>
          <div className="space-y-4">
            {categorized.map((enrollment) => {
              const catInfo = getCategoryInfo(enrollment.teamLeaderCategory);
              return (
                <div key={enrollment.id} className="bg-white rounded-xl p-6 border border-blue-200 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{enrollment.student.name}</h3>
                      <p className="text-sm text-gray-500">{enrollment.student.email}</p>
                      <div className="flex gap-3 mt-2 text-xs flex-wrap">
                        <span className="text-gray-500">📚 {enrollment.batch.program.title}</span>
                        <span className={`px-2 py-0.5 rounded-full ${catInfo.color}`}>
                          Category: {catInfo.label}
                        </span>
                      </div>
                      {enrollment.teamLeaderRemarks && (
                        <p className="text-sm text-gray-600 mt-2 italic">&quot;{enrollment.teamLeaderRemarks}&quot;</p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => { setApproveModal(enrollment); setRemarks(""); }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
                      >
                        Approve & Generate Letter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-green-700">Completed</h2>
          <div className="space-y-4">
            {completed.map((enrollment) => {
              const catInfo = getCategoryInfo(enrollment.teamLeaderCategory);
              return (
                <div key={enrollment.id} className="bg-white rounded-xl p-6 border border-green-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{enrollment.student.name}</h3>
                      <p className="text-sm text-gray-500">{enrollment.student.email}</p>
                      <div className="flex gap-3 mt-2 text-xs flex-wrap">
                        <span className="text-gray-500">📚 {enrollment.batch.program.title}</span>
                        <span className={`px-2 py-0.5 rounded-full ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        {enrollment.experienceLetter && (
                          <span className="text-green-600 font-medium">Experience Letter: {enrollment.experienceLetter.letterNumber}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">Completed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {eligible.length === 0 && (
        <div className="bg-white rounded-xl p-12 border text-center">
          <p className="text-4xl mb-4">🎓</p>
          <p className="text-gray-600">No students ready for completion review yet.</p>
        </div>
      )}

      {/* Categorize Modal (Team Leader) */}
      {categorizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-2">Categorize Student</h2>
            <p className="text-sm text-gray-500 mb-4">{categorizeModal.student.name} — {categorizeModal.batch.program.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Performance Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-2 rounded-lg text-sm border transition ${
                        category === cat.value ? "ring-2 ring-indigo-500 " + cat.color : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                  placeholder="Your assessment of the student's performance..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCategorizeModal(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleCategorize} disabled={!category} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                Submit Categorization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal (Admin) */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-2">Approve & Generate Experience Letter</h2>
            <p className="text-sm text-gray-500 mb-4">{approveModal.student.name} — {approveModal.batch.program.title}</p>

            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
              <p><strong>Team Leader Category:</strong> {getCategoryInfo(approveModal.teamLeaderCategory).label}</p>
              {approveModal.teamLeaderRemarks && <p className="mt-1"><strong>Remarks:</strong> {approveModal.teamLeaderRemarks}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Remarks (optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <p className="text-sm text-green-700 mt-4 bg-green-50 p-3 rounded-lg">
              Approving will mark the enrollment as &quot;completed&quot; and auto-generate an Experience Letter for the student.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setApproveModal(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleApprove} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                Approve & Generate Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
