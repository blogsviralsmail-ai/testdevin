"use client";

import { useState, useEffect, useCallback } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  dayNumber: number | null;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dayNumber: number | null;
  scope: string;
  type: string;
  dueDate: string | null;
  batch: { name: string; program: { title: string } } | null;
}

interface Submission {
  id: string;
  taskId: string;
  status: string;
  grade: string | null;
}

interface EnrollmentInfo {
  programTitle: string;
  batchName: string;
  joiningDate: string | null;
  currentDay: number;
  totalDays: number;
}

interface QuizInfo {
  id: string;
  title: string;
  description: string | null;
  dayNumber: number | null;
  questionCount: number;
  timeLimit: number | null;
  passingScore: number;
  myAttempt: { id: string; score: number; totalPoints: number; passed: boolean } | null;
}

export default function MyWorkPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);
  const [quizzes, setQuizzes] = useState<QuizInfo[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitTask, setSubmitTask] = useState<{ taskId: string; content: string; fileUrl: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [takingQuiz, setTakingQuiz] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<{ id: string; question: string; options: string[] }[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; totalPoints: number; passed: boolean } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [resRes, tasksRes, subsRes, enrollRes, quizRes] = await Promise.all([
        fetch("/api/resources"),
        fetch("/api/tasks"),
        fetch("/api/submissions"),
        fetch("/api/my-enrollment"),
        fetch("/api/quizzes"),
      ]);
      if (resRes.ok) setResources(await resRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (subsRes.ok) setSubmissions(await subsRes.json());
      if (enrollRes.ok) {
        const eData = await enrollRes.json();
        setEnrollment(eData);
        setSelectedDay(eData.currentDay || 1);
      }
      if (quizRes.ok) setQuizzes(await quizRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmitTask = async () => {
    if (!submitTask || !submitTask.content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: submitTask.taskId, content: submitTask.content, fileUrl: submitTask.fileUrl || undefined }),
      });
      if (res.ok) {
        setSubmitTask(null);
        fetchData();
      } else {
        alert("Failed to submit task");
      }
    } catch { alert("Error submitting task"); }
    setSubmitting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !submitTask) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setSubmitTask({ ...submitTask, fileUrl: data.url });
      } else {
        alert("File upload failed");
      }
    } catch { alert("Error uploading file"); }
    setUploading(false);
  };

  const startQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        const qs = data.questions.map((q: { id: string; question: string; options: string }) => ({
          id: q.id,
          question: q.question,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        }));
        setQuizQuestions(qs);
        setQuizAnswers({});
        setQuizResult(null);
        setTakingQuiz(quizId);
      }
    } catch { alert("Error loading quiz"); }
  };

  const submitQuiz = async () => {
    if (!takingQuiz) return;
    setQuizSubmitting(true);
    try {
      const answers = quizQuestions.map(q => quizAnswers[q.id] ?? -1);
      const res = await fetch(`/api/quizzes/${takingQuiz}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuizResult({ score: data.score, totalPoints: data.totalPoints || 50, passed: data.passed });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to submit quiz");
      }
    } catch { alert("Error submitting quiz"); }
    setQuizSubmitting(false);
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Loading your workspace...</div>;

  if (!enrollment) {
    return (
      <div className="p-6">
        <PaymentBlockMessage feature="My Workspace" />
        <div className="bg-transparent border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Not Enrolled Yet</h2>
          <p className="text-amber-400">Your enrollment is not active yet. Please contact admin or check your application status.</p>
        </div>
      </div>
    );
  }

  const currentDay = enrollment.currentDay;
  const totalDays = enrollment.totalDays || 45;

  // Get all available days
  const allDays: number[] = [];
  for (let d = 1; d <= Math.min(currentDay, totalDays); d++) {
    allDays.push(d);
  }

  // Get resources, tasks, and quizzes for selected day
  const dayResources = resources.filter(r => r.dayNumber === selectedDay);
  const dayTasks = tasks.filter(t => t.dayNumber === selectedDay);
  const dayQuizzes = quizzes.filter(q => q.dayNumber === selectedDay);

  const getSubmissionStatus = (taskId: string) => {
    const sub = submissions.find(s => s.taskId === taskId);
    if (!sub) return { status: "not_started", label: "Not Started", color: "bg-transparent text-slate-400" };
    if (sub.status === "reviewed") return { status: "reviewed", label: sub.grade ? `Reviewed (${sub.grade})` : "Reviewed", color: "bg-emerald-500/10 text-emerald-400" };
    if (sub.status === "submitted") return { status: "submitted", label: "Submitted", color: "bg-blue-500/10 text-[#60a5fa]" };
    return { status: sub.status, label: sub.status, color: "bg-amber-500/10 text-amber-400" };
  };

  const completedDays = allDays.filter(d => {
    const dTasks = tasks.filter(t => t.dayNumber === d);
    if (dTasks.length === 0) return true;
    return dTasks.every(t => {
      const sub = submissions.find(s => s.taskId === t.id);
      return sub && (sub.status === "submitted" || sub.status === "reviewed");
    });
  }).length;

  const progressPercent = allDays.length > 0 ? Math.round((completedDays / allDays.length) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Workspace</h1>
        <p className="text-slate-400">{enrollment.programTitle} — {enrollment.batchName}</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4 text-center">
          <p className="text-3xl font-bold text-[#22d3ee]">{currentDay}</p>
          <p className="text-xs text-slate-500 mt-1">Current Day</p>
        </div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">{completedDays}</p>
          <p className="text-xs text-slate-500 mt-1">Days Completed</p>
        </div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4 text-center">
          <p className="text-3xl font-bold text-[#a78bfa]">{totalDays}</p>
          <p className="text-xs text-slate-500 mt-1">Total Days</p>
        </div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{progressPercent}%</p>
          <p className="text-xs text-slate-500 mt-1">Progress</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-300">Overall Progress</span>
          <span className="text-slate-500">{completedDays} / {allDays.length} days</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-[#0EA5B8] to-[#a78bfa] h-3 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Day Selector Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4 sticky top-4">
            <h3 className="font-semibold text-white mb-3">Select Day</h3>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {allDays.map(d => {
                const dTasks = tasks.filter(t => t.dayNumber === d);
                const dResources = resources.filter(r => r.dayNumber === d);
                const allDone = dTasks.length > 0 && dTasks.every(t => {
                  const sub = submissions.find(s => s.taskId === t.id);
                  return sub && (sub.status === "submitted" || sub.status === "reviewed");
                });
                const isToday = d === currentDay;

                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition ${
                      selectedDay === d
                        ? "bg-[#0EA5B8] text-white"
                        : isToday
                        ? "bg-transparent text-[#22d3ee] font-medium"
                        : "hover:bg-transparent text-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {allDone && dTasks.length > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-transparent0 text-white text-xs flex items-center justify-center">&#10003;</span>
                      ) : isToday ? (
                        <span className="w-5 h-5 rounded-full bg-transparent0 text-white text-xs flex items-center justify-center">&#9679;</span>
                      ) : (
                        <span className={`w-5 h-5 rounded-full border-2 text-xs flex items-center justify-center ${selectedDay === d ? "border-white" : "border-white/10"}`}>{d}</span>
                      )}
                      Day {d}
                    </span>
                    <span className={`text-xs ${selectedDay === d ? "text-indigo-200" : "text-slate-500"}`}>
                      {dResources.length}V {dTasks.length}T{quizzes.filter(q => q.dayNumber === d).length > 0 ? ` ${quizzes.filter(q => q.dayNumber === d).length}Q` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day Content */}
        <div className="flex-1 min-w-0">
          {/* Day Header */}
          <div className="bg-gradient-to-r from-[#0EA5B8] to-[#a78bfa] rounded-xl p-5 mb-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Day {selectedDay}</h2>
                <p className="text-indigo-200 text-sm mt-1">
                  {dayResources.length} Video{dayResources.length !== 1 ? "s" : ""} &bull; {dayTasks.length} Task{dayTasks.length !== 1 ? "s" : ""}{dayQuizzes.length > 0 ? ` \u2022 ${dayQuizzes.length} Quiz${dayQuizzes.length !== 1 ? "zes" : ""}` : ""}
                </p>
              </div>
              {selectedDay === currentDay && (
                <span className="px-3 py-1 bg-transparent/20 rounded-full text-sm font-medium">Today</span>
              )}
            </div>
          </div>

          {/* STEP 1: Watch Videos */}
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border mb-4 overflow-hidden">
            <div className="bg-transparent border-b px-5 py-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <h3 className="font-semibold text-white">Watch Video</h3>
                <p className="text-xs text-slate-500">Watch the video below carefully</p>
              </div>
            </div>
            <div className="p-5">
              {dayResources.length > 0 ? (
                <div className="space-y-4">
                  {dayResources.map(r => {
                    const ytId = r.type === "video" ? getYouTubeId(r.url) : null;
                    return (
                      <div key={r.id} className="rounded-lg border overflow-hidden">
                        {ytId ? (
                          <div className="aspect-video w-full bg-black">
                            <iframe
                              src={`https://www.youtube.com/embed/${ytId}`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={r.title}
                            />
                          </div>
                        ) : null}
                        <div className="p-3 bg-transparent flex items-center gap-3">
                          <span className="text-lg">{r.type === "video" ? "🎥" : r.type === "pdf" ? "📄" : "🔗"}</span>
                          <p className="flex-1 text-sm font-medium text-white truncate">{r.title}</p>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 font-medium shrink-0">
                            Watch on YouTube &#8599;
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No video available for today</p>
              )}
            </div>
          </div>

          {/* STEP 2: Read Task */}
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border mb-4 overflow-hidden">
            <div className="bg-transparent border-b px-5 py-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-transparent0 text-white flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <h3 className="font-semibold text-white">Today's Task</h3>
                <p className="text-xs text-slate-500">Complete this task after watching the video</p>
              </div>
            </div>
            <div className="p-5">
              {dayTasks.length > 0 ? (
                <div className="space-y-4">
                  {dayTasks.map(t => {
                    const sub = getSubmissionStatus(t.id);
                    return (
                      <div key={t.id} className="border rounded-lg p-4 bg-transparent/50">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-white">{t.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${sub.color}`}>{sub.label}</span>
                        </div>
                        {t.description && (
                          <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3 border border-orange-100">
                            <p className="text-sm text-slate-300 leading-relaxed">{t.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No task available for today</p>
              )}
            </div>
          </div>

          {/* STEP 3: Submit Work */}
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border mb-4 overflow-hidden">
            <div className="bg-transparent border-b px-5 py-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <h3 className="font-semibold text-white">Submit Your Work</h3>
                <p className="text-xs text-slate-500">Submit your completed work below</p>
              </div>
            </div>
            <div className="p-5">
              {dayTasks.length > 0 ? (
                <div className="space-y-4">
                  {dayTasks.map(t => {
                    const sub = getSubmissionStatus(t.id);
                    const isSubmitting = submitTask?.taskId === t.id;

                    if (sub.status === "submitted" || sub.status === "reviewed") {
                      return (
                        <div key={t.id} className="border rounded-lg p-4 bg-transparent">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 text-lg">&#10003;</span>
                            <p className="font-medium text-green-800">{t.title} — {sub.label}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={t.id} className="border rounded-lg p-4">
                        <p className="font-medium text-white mb-3">{t.title}</p>
                        {!isSubmitting ? (
                          <button onClick={() => setSubmitTask({ taskId: t.id, content: "", fileUrl: "" })} className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
                            Submit Your Work
                          </button>
                        ) : submitTask && (
                          <div className="space-y-3">
                            <textarea
                              value={submitTask.content}
                              onChange={e => setSubmitTask({ ...submitTask, content: e.target.value })}
                              placeholder="Write your answer / notes / work here..."
                              className="w-full border-2 border-green-200 rounded-lg p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <div className="border-2 border-dashed border-green-200 rounded-lg p-4 text-center">
                              <label className="cursor-pointer block">
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                                <span className="text-sm text-emerald-400 font-medium">{uploading ? "Uploading..." : "Click to upload a file (any format, any size)"}</span>
                                <p className="text-xs text-slate-500 mt-1">Or paste a URL below</p>
                              </label>
                            </div>
                            {submitTask.fileUrl && (
                              <div className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-2">
                                <span className="text-emerald-400 text-sm">&#10003;</span>
                                <a href={submitTask.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 underline truncate flex-1">{submitTask.fileUrl}</a>
                                <button onClick={() => setSubmitTask({ ...submitTask, fileUrl: "" })} className="text-xs text-red-500 hover:text-red-400">Remove</button>
                              </div>
                            )}
                            <input
                              type="text"
                              value={submitTask.fileUrl}
                              onChange={e => setSubmitTask({ ...submitTask, fileUrl: e.target.value })}
                              placeholder="Or paste a link URL here (optional)"
                              className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <div className="flex gap-2">
                              <button onClick={handleSubmitTask} disabled={submitting || !submitTask.content.trim()} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm">
                                {submitting ? "Submitting..." : "Submit &#10003;"}
                              </button>
                              <button onClick={() => setSubmitTask(null)} className="px-4 py-2.5 bg-transparent text-slate-400 rounded-lg hover:bg-gray-200 text-sm">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No submission required for today</p>
              )}
            </div>
          </div>

          {/* Step 4: Quiz */}
          {dayQuizzes.length > 0 && (
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border mb-4 overflow-hidden">
              <div className="bg-transparent border-b px-5 py-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <h3 className="font-semibold text-white">Take Quiz</h3>
                  <p className="text-xs text-slate-500">Test your knowledge of today&apos;s topic</p>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {dayQuizzes.map(quiz => (
                    <div key={quiz.id} className="border rounded-lg p-4 bg-transparent/50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{quiz.title}</h4>
                          {quiz.description && <p className="text-sm text-slate-400 mt-1">{quiz.description}</p>}
                          <p className="text-xs text-slate-500 mt-1">{quiz.questionCount} Questions &bull; {quiz.timeLimit ? `${quiz.timeLimit} min` : "No time limit"} &bull; Pass: {quiz.passingScore}%</p>
                        </div>
                        {quiz.myAttempt ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quiz.myAttempt.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                            {quiz.myAttempt.passed ? "Passed" : "Failed"} — {Math.round((quiz.myAttempt.score / quiz.myAttempt.totalPoints) * 100)}%
                          </span>
                        ) : (
                          <button onClick={() => startQuiz(quiz.id)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 font-medium whitespace-nowrap">
                            Start Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quiz Modal */}
          {takingQuiz && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {quizResult ? (
                    <div className="text-center py-8">
                      <p className="text-5xl mb-4">{quizResult.passed ? "🎉" : "😔"}</p>
                      <h2 className="text-2xl font-bold text-white mb-2">{quizResult.passed ? "Congratulations! You Passed!" : "Quiz Not Passed"}</h2>
                      <p className="text-lg text-slate-400 mb-4">Score: {quizResult.score} / {quizResult.totalPoints} ({Math.round((quizResult.score / quizResult.totalPoints) * 100)}%)</p>
                      <button onClick={() => { setTakingQuiz(null); setQuizResult(null); }} className="px-6 py-3 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2] font-medium">
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-white mb-6">{quizzes.find(q => q.id === takingQuiz)?.title || "Quiz"}</h2>
                      <div className="space-y-6">
                        {quizQuestions.map((q, qi) => (
                          <div key={q.id} className="border rounded-lg p-4">
                            <p className="font-medium text-white mb-3">Q{qi + 1}. {q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => (
                                <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${quizAnswers[q.id] === oi ? "border-purple-500 bg-transparent" : "border-white/[0.08] hover:bg-transparent"}`}>
                                  <input type="radio" name={q.id} checked={quizAnswers[q.id] === oi} onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: oi })} className="accent-purple-600" />
                                  <span className="text-sm text-slate-300">{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button onClick={submitQuiz} disabled={quizSubmitting || Object.keys(quizAnswers).length < quizQuestions.length} className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium">
                          {quizSubmitting ? "Submitting..." : "Submit Quiz"}
                        </button>
                        <button onClick={() => setTakingQuiz(null)} className="px-6 py-3 bg-transparent text-slate-400 rounded-lg hover:bg-gray-200">
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {dayResources.length === 0 && dayTasks.length === 0 && dayQuizzes.length === 0 && (
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-8 text-center mb-4">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-slate-500">No content scheduled for Day {selectedDay}</p>
            </div>
          )}

          {/* Quick Navigation */}
          <div className="flex gap-3">
            {selectedDay > 1 && (
              <button onClick={() => setSelectedDay(selectedDay - 1)} className="flex-1 px-4 py-3 bg-transparent border rounded-xl text-sm font-medium text-slate-300 hover:bg-transparent">
                &#8592; Day {selectedDay - 1}
              </button>
            )}
            {selectedDay < currentDay && selectedDay < totalDays && (
              <button onClick={() => setSelectedDay(selectedDay + 1)} className="flex-1 px-4 py-3 bg-transparent border rounded-xl text-sm font-medium text-slate-300 hover:bg-transparent">
                Day {selectedDay + 1} &#8594;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
