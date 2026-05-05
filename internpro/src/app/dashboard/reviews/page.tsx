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
  const [reviewModal, setReviewModal] = useState<Submission | null>(null);
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
    if (filter === "all") return true;
    return s.status === filter;
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

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
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
                  </div>

                  {sub.content && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-700">
                      <p className="font-medium text-xs text-gray-500 mb-1">Student&apos;s Work:</p>
                      <p className="whitespace-pre-wrap">{sub.content.length > 300 ? sub.content.slice(0, 300) + "..." : sub.content}</p>
                    </div>
                  )}

                  {sub.fileUrl && (
                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                      📎 View Attached File
                    </a>
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
                    <button
                      onClick={() => { setReviewModal(sub); setReviewPercentage(""); setReviewFeedback(""); }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
                    >
                      Review & Grade
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-2">Review Submission</h2>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{reviewModal.student.name}</strong> — {reviewModal.task.title}
            </p>

            {reviewModal.content && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm max-h-48 overflow-y-auto">
                <p className="whitespace-pre-wrap">{reviewModal.content}</p>
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
                  className="w-full px-3 py-2 border rounded-lg text-sm"
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
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                  placeholder="What was good, what needs improvement..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setReviewModal(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
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
