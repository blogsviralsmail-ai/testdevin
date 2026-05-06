"use client";

import { useState, useEffect, useCallback } from "react";

interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  percentage: number | null;
  feedback: string | null;
  reviewedBy: string | null;
  status: string;
  createdAt: string;
  task: { title: string; maxPoints: number; dayNumber: number | null; batch: { name: string; program: { title: string } } };
  student: { name: string; email: string };
}

export default function ReviewsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<string>("submitted");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [reviewModal, setReviewModal] = useState<Submission | null>(null);
  const [viewWork, setViewWork] = useState<Submission | null>(null);
  const [reviewPercentage, setReviewPercentage] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");

  const fetchSubmissions = useCallback(async () => {
    const res = await fetch("/api/submissions");
    if (res.ok) setSubmissions(await res.json());
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleReview = async () => {
    if (!reviewModal) return;
    const res = await fetch(`/api/submissions/${reviewModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        percentage: parseFloat(reviewPercentage),
        feedback: reviewFeedback,
        status: "reviewed",
      }),
    });
    if (res.ok) {
      setReviewModal(null);
      setReviewPercentage("");
      setReviewFeedback("");
      fetchSubmissions();
    }
  };

  const filtered = submissions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (dateFilter) {
      const subDate = new Date(s.createdAt).toISOString().split("T")[0];
      if (subDate !== dateFilter) return false;
    }
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === "submitted").length;
  const reviewedCount = submissions.filter((s) => s.status === "reviewed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Submissions</h1>
          <p className="text-gray-600 text-sm">Review student work and assign percentage marks</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">{pendingCount} Pending</span>
          <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">{reviewedCount} Reviewed</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {[
          { key: "submitted", label: "Pending Review" },
          { key: "reviewed", label: "Reviewed" },
          { key: "all", label: "All" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === tab.key ? "bg-indigo-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-600">Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-gray-900"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="text-xs text-gray-500 hover:text-red-600">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-600">No submissions to review in this category.</p>
          </div>
        ) : (
          filtered.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {sub.task.dayNumber && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Day {sub.task.dayNumber}</span>
                    )}
                    <h3 className="text-base font-semibold text-gray-900">{sub.task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sub.status === "reviewed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {sub.status === "reviewed" ? "Reviewed" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <span className="font-medium text-gray-700">👤 {sub.student.name}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">{sub.student.email}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">Submitted: {new Date(sub.createdAt).toLocaleString("en-IN")}</span>
                  </div>

                  {/* Show submitted work preview */}
                  {sub.content && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-700">
                      <p className="font-medium text-xs text-gray-500 mb-1">Student&apos;s Work:</p>
                      <p className="whitespace-pre-wrap">{sub.content.length > 200 ? sub.content.slice(0, 200) + "..." : sub.content}</p>
                      {sub.content.length > 200 && (
                        <button onClick={() => setViewWork(sub)} className="text-xs text-indigo-600 hover:underline mt-1">
                          View Full Work →
                        </button>
                      )}
                    </div>
                  )}

                  {sub.fileUrl && (
                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                      📎 View Attached File
                    </a>
                  )}

                  {!sub.content && !sub.fileUrl && (
                    <p className="text-sm text-gray-400 italic">No work content submitted — only marked as done</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>📦 {sub.task.batch.program.title} - {sub.task.batch.name}</span>
                    <span>💯 Max: {sub.task.maxPoints} points</span>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  {sub.status === "reviewed" ? (
                    <div>
                      <div className="text-2xl font-bold text-green-600">{sub.percentage}%</div>
                      <p className="text-xs text-gray-500">Score Given</p>
                      {sub.feedback && <p className="text-xs text-gray-600 mt-1 max-w-[200px]">{sub.feedback}</p>}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setViewWork(sub)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
                      >
                        View Work
                      </button>
                      <button
                        onClick={() => { setReviewModal(sub); setReviewPercentage(""); setReviewFeedback(""); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
                      >
                        Review & Grade
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Work Modal */}
      {viewWork && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Submitted Work</h2>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{viewWork.student.name}</strong> — {viewWork.task.title} (Day {viewWork.task.dayNumber || "N/A"})
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Submitted: {new Date(viewWork.createdAt).toLocaleString("en-IN")}
            </p>

            {viewWork.content && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
                <p className="whitespace-pre-wrap text-gray-800">{viewWork.content}</p>
              </div>
            )}

            {viewWork.fileUrl && (
              <a href={viewWork.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline block mb-4">
                📎 View/Download Attached File
              </a>
            )}

            {!viewWork.content && !viewWork.fileUrl && (
              <p className="text-gray-400 italic mb-4">No work content submitted</p>
            )}

            {viewWork.status === "reviewed" && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-green-800">Score: {viewWork.percentage}%</p>
                {viewWork.feedback && <p className="text-sm text-green-700 mt-1">Feedback: {viewWork.feedback}</p>}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              {viewWork.status !== "reviewed" && (
                <button
                  onClick={() => { setReviewModal(viewWork); setViewWork(null); setReviewPercentage(""); setReviewFeedback(""); }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
                >
                  Review & Grade
                </button>
              )}
              <button onClick={() => setViewWork(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Review Submission</h2>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{reviewModal.student.name}</strong> — {reviewModal.task.title}
            </p>

            {reviewModal.content && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm max-h-48 overflow-y-auto">
                <p className="whitespace-pre-wrap text-gray-700">{reviewModal.content}</p>
              </div>
            )}

            {reviewModal.fileUrl && (
              <a href={reviewModal.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline block mb-4">
                📎 View Attached File
              </a>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage Score (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={reviewPercentage}
                  onChange={(e) => setReviewPercentage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                  placeholder="e.g. 75"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  50% sahi = 50 marks out of {reviewModal.task.maxPoints}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback / Remarks</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                  rows={3}
                  placeholder="What was good, what needs improvement..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setReviewModal(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewPercentage}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
