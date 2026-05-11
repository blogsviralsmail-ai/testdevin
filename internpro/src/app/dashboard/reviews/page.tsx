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

interface QuizAttemptInfo {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalPoints: number;
  passed: boolean;
  completedAt: string;
  user: { name: string; email: string; avatar: string | null };
  quiz: { title: string; dayNumber: number | null; passingScore: number; program?: { title: string } | null };
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<"tasks" | "quizzes">("tasks");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptInfo[]>([]);
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

  const fetchQuizAttempts = useCallback(async () => {
    const res = await fetch("/api/quiz-results");
    if (res.ok) setQuizAttempts(await res.json());
  }, []);

  useEffect(() => { fetchSubmissions(); fetchQuizAttempts(); }, [fetchSubmissions, fetchQuizAttempts]);

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

  const quizPassedCount = quizAttempts.filter(a => a.passed).length;
  const quizFailedCount = quizAttempts.filter(a => !a.passed).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Submissions</h1>
          <p className="text-slate-400 text-sm">Review student tasks and quiz results</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "tasks" ? (
            <>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400">{pendingCount} Pending</span>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400">{reviewedCount} Reviewed</span>
            </>
          ) : (
            <>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400">{quizPassedCount} Passed</span>
              <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400">{quizFailedCount} Failed</span>
            </>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex gap-1 mb-6 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-1 w-fit">
        <button onClick={() => setActiveTab("tasks")} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === "tasks" ? "bg-transparent text-[#22d3ee] shadow-none" : "text-slate-500 hover:text-slate-300"}`}>
          Task Reviews ({pendingCount + reviewedCount})
        </button>
        <button onClick={() => setActiveTab("quizzes")} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === "quizzes" ? "bg-transparent text-[#a78bfa] shadow-none" : "text-slate-500 hover:text-slate-300"}`}>
          Quiz Results ({quizAttempts.length})
        </button>
      </div>

      {activeTab === "quizzes" ? (
        /* Quiz Results Section */
        <div className="space-y-4">
          {quizAttempts.length === 0 ? (
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 border text-center">
              <p className="text-4xl mb-4">🧠</p>
              <p className="text-slate-400">No quiz attempts yet.</p>
            </div>
          ) : (
            quizAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border hover:shadow-none transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {attempt.quiz.dayNumber && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-[#a78bfa]">Day {attempt.quiz.dayNumber}</span>
                      )}
                      <h3 className="text-base font-semibold text-white">{attempt.quiz.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${attempt.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {attempt.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-slate-300">{attempt.user.name}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-500">{attempt.user.email}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-500">{attempt.quiz.program?.title || "General"}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-500">{new Date(attempt.completedAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-2xl font-bold ${attempt.passed ? "text-emerald-400" : "text-red-500"}`}>{Math.round(attempt.score)}%</div>
                    <p className="text-xs text-slate-500">Pass: {attempt.quiz.passingScore}%</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
      {/* Task Filters */}
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
              filter === tab.key ? "bg-[#0EA5B8] text-white" : "bg-transparent border text-slate-400 hover:bg-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-slate-400">Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-white"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="text-xs text-slate-500 hover:text-red-400">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 border text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-slate-400">No submissions to review in this category.</p>
          </div>
        ) : (
          filtered.map((sub) => (
            <div key={sub.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border hover:shadow-none transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {sub.task.dayNumber && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0EA5B8]/10 text-[#22d3ee]">Day {sub.task.dayNumber}</span>
                    )}
                    <h3 className="text-base font-semibold text-white">{sub.task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sub.status === "reviewed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {sub.status === "reviewed" ? "Reviewed" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <span className="font-medium text-slate-300">👤 {sub.student.name}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-500">{sub.student.email}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-500">Submitted: {new Date(sub.createdAt).toLocaleString("en-IN")}</span>
                  </div>

                  {/* Show submitted work preview */}
                  {sub.content && (
                    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3 mb-3 text-sm text-slate-300">
                      <p className="font-medium text-xs text-slate-500 mb-1">Student&apos;s Work:</p>
                      <p className="whitespace-pre-wrap">{sub.content.length > 200 ? sub.content.slice(0, 200) + "..." : sub.content}</p>
                      {sub.content.length > 200 && (
                        <button onClick={() => setViewWork(sub)} className="text-xs text-[#22d3ee] hover:underline mt-1">
                          View Full Work →
                        </button>
                      )}
                    </div>
                  )}

                  {sub.fileUrl && (
                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#22d3ee] hover:underline">
                      📎 View Attached File
                    </a>
                  )}

                  {!sub.content && !sub.fileUrl && (
                    <p className="text-sm text-slate-500 italic">No work content submitted — only marked as done</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>📦 {sub.task.batch.program.title} - {sub.task.batch.name}</span>
                    <span>💯 Max: {sub.task.maxPoints} points</span>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  {sub.status === "reviewed" ? (
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">{sub.percentage}%</div>
                      <p className="text-xs text-slate-500">Score Given</p>
                      {sub.feedback && <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{sub.feedback}</p>}
                      <button
                        onClick={() => { setReviewModal(sub); setReviewPercentage(sub.percentage?.toString() || ""); setReviewFeedback(sub.feedback || ""); }}
                        className="mt-2 text-xs px-3 py-1 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-200"
                      >
                        Edit Marks
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setViewWork(sub)}
                        className="bg-transparent text-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition"
                      >
                        View Work
                      </button>
                      <button
                        onClick={() => { setReviewModal(sub); setReviewPercentage(""); setReviewFeedback(""); }}
                        className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2] transition"
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
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-2">Submitted Work</h2>
            <p className="text-sm text-slate-400 mb-4">
              <strong>{viewWork.student.name}</strong> — {viewWork.task.title} (Day {viewWork.task.dayNumber || "N/A"})
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Submitted: {new Date(viewWork.createdAt).toLocaleString("en-IN")}
            </p>

            {viewWork.content && (
              <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 mb-4 text-sm">
                <p className="whitespace-pre-wrap text-white">{viewWork.content}</p>
              </div>
            )}

            {viewWork.fileUrl && (
              <a href={viewWork.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#22d3ee] hover:underline block mb-4">
                📎 View/Download Attached File
              </a>
            )}

            {!viewWork.content && !viewWork.fileUrl && (
              <p className="text-slate-500 italic mb-4">No work content submitted</p>
            )}

            {viewWork.status === "reviewed" && (
              <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border border-green-200">
                <p className="text-sm font-medium text-green-800">Score: {viewWork.percentage}%</p>
                {viewWork.feedback && <p className="text-sm text-emerald-400 mt-1">Feedback: {viewWork.feedback}</p>}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              {viewWork.status !== "reviewed" && (
                <button
                  onClick={() => { setReviewModal(viewWork); setViewWork(null); setReviewPercentage(""); setReviewFeedback(""); }}
                  className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2]"
                >
                  Review & Grade
                </button>
              )}
              <button onClick={() => setViewWork(null)} className="px-4 py-2 border rounded-lg text-sm text-slate-300 hover:bg-transparent">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      </>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-2">Review Submission</h2>
            <p className="text-sm text-slate-500 mb-4">
              <strong>{reviewModal.student.name}</strong> — {reviewModal.task.title}
            </p>

            {reviewModal.content && (
              <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3 mb-4 text-sm max-h-48 overflow-y-auto">
                <p className="whitespace-pre-wrap text-slate-300">{reviewModal.content}</p>
              </div>
            )}

            {reviewModal.fileUrl && (
              <a href={reviewModal.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#22d3ee] hover:underline block mb-4">
                📎 View Attached File
              </a>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Percentage Score (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={reviewPercentage}
                  onChange={(e) => setReviewPercentage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white"
                  placeholder="e.g. 75"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  50% sahi = 50 marks out of {reviewModal.task.maxPoints}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Feedback / Remarks</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white"
                  rows={3}
                  placeholder="What was good, what needs improvement..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setReviewModal(null)} className="px-4 py-2 border rounded-lg text-sm text-slate-300 hover:bg-transparent">
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewPercentage}
                className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2] disabled:opacity-50"
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
