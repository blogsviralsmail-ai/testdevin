"use client";
import { useState, useEffect } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

interface Quiz { id: string; title: string; description?: string; programId?: string | null; timeLimit?: number; passingScore: number; isPublished: boolean; questionCount: number; attemptCount: number; myAttempt?: { score: number; passed: boolean; completedAt: string } | null; createdAt: string; }
interface Program { id: string; title: string; }
interface Question { id?: string; question: string; options: string[]; correctAnswer: number; points: number; }

export default function QuizzesPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizDetail, setQuizDetail] = useState<{ id: string; title: string; timeLimit?: number; passingScore: number; questions: Question[] } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [form, setForm] = useState({ title: "", description: "", timeLimit: "", passingScore: "60", questions: [{ question: "", options: ["", "", "", ""], correctAnswer: 0, points: 10 }] as Question[] });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user || d));
    fetch("/api/programs").then(r => r.json()).then(d => setPrograms(Array.isArray(d) ? d : []));
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => { const r = await fetch("/api/quizzes"); if (r.ok) setQuizzes(await r.json()); };

  const startQuiz = async (id: string) => {
    const r = await fetch(`/api/quizzes/${id}`);
    if (r.ok) { const data = await r.json(); setQuizDetail(data); setActiveQuiz(id); setAnswers(new Array(data.questions.length).fill(-1)); setResult(null); }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    const r = await fetch(`/api/quizzes/${activeQuiz}/attempt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, timeTaken: 0 }) });
    if (r.ok) { const data = await r.json(); setResult(data); fetchQuizzes(); }
    else { const err = await r.json(); alert(err.error); }
  };

  const createQuiz = async () => {
    const r = await fetch("/api/quizzes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, timeLimit: form.timeLimit ? parseInt(form.timeLimit) : null, passingScore: parseInt(form.passingScore) }) });
    if (r.ok) { setShowCreate(false); setForm({ title: "", description: "", timeLimit: "", passingScore: "60", questions: [{ question: "", options: ["", "", "", ""], correctAnswer: 0, points: 10 }] }); fetchQuizzes(); }
  };

  const togglePublish = async (id: string, pub: boolean) => {
    await fetch(`/api/quizzes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublished: !pub }) });
    fetchQuizzes();
  };

  const deleteQuiz = async (id: string, title: string) => {
    if (!confirm(`Delete quiz "${title}"? This will also delete all attempts.`)) return;
    const r = await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
    if (r.ok) fetchQuizzes();
    else alert("Failed to delete quiz");
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization" || user?.role === "teamleader";

  // Quiz taking view
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === quizzes.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(quizzes.map((item: { id: string }) => item.id)));
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} quizzes?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_quizzes", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchQuizzes();
  };

  if (activeQuiz && quizDetail) {
    if (result) {
      return (
        <div className="max-w-2xl mx-auto">
          <div className={`rounded-xl p-8 text-center ${result.passed ? "bg-transparent border-2 border-green-200" : "bg-transparent border-2 border-red-200"}`}>
            <span className="text-6xl">{result.passed ? "🎉" : "😔"}</span>
            <h2 className="text-2xl font-bold mt-4">{result.passed ? "Congratulations! You Passed!" : "Better Luck Next Time"}</h2>
            <p className="text-4xl font-bold mt-4 text-[#22d3ee]">{Math.round(result.score)}%</p>
            <p className="text-sm text-slate-500 mt-2">Passing Score: {quizDetail.passingScore}%</p>
            <button onClick={() => { setActiveQuiz(null); setQuizDetail(null); }} className="mt-6 px-6 py-2 bg-[#0EA5B8] text-white rounded-lg">Back to Quizzes</button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{quizDetail.title}</h1>
          <button onClick={() => { setActiveQuiz(null); setQuizDetail(null); }} className="text-sm text-slate-500 hover:text-slate-300">← Back</button>
        </div>
        {quizDetail.questions.map((q, qi) => (
          <div key={qi} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border">
            <p className="font-medium mb-3">Q{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${answers[qi] === oi ? "border-indigo-500 bg-transparent" : "hover:bg-transparent"}`}>
                  <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi} onChange={() => { const a = [...answers]; a[qi] = oi; setAnswers(a); }} className="w-4 h-4 text-[#22d3ee]" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <button onClick={submitQuiz} className="w-full py-3 bg-[#0EA5B8] text-white rounded-lg font-medium hover:bg-[#0891b2]">Submit Quiz</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quizzes & Assessments</h1>
          <p className="text-sm text-slate-500">Test your knowledge and earn points</p>
        </div>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">+ Create Quiz</button>}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">{bulkDeleting ? "Deleting..." : "Delete Selected"}</button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
        </div>
      )}

      {/* Search + Program Filter */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search quizzes..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-white focus:ring-2 focus:ring-[#0EA5B8] focus:border-indigo-500" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400">✕</button>}
          </div>
          {programs.length > 1 && (
            <>
              <label className="text-sm font-medium text-slate-300">Course:</label>
              <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm text-white min-w-[250px]">
                <option value="all">All Courses ({quizzes.length} quizzes)</option>
                {programs.map((p) => {
                  const count = quizzes.filter(q => q.programId === p.id).length;
                  if (count === 0) return null;
                  return <option key={p.id} value={p.id}>{p.title} ({count})</option>;
                })}
              </select>
              {selectedProgramId !== "all" && <button onClick={() => setSelectedProgramId("all")} className="text-xs text-[#22d3ee] hover:text-[#0EA5B8] font-medium">Clear Filter</button>}
            </>
          )}
        </div>
        {searchQuery && <p className="text-xs text-slate-500 mt-2">Searching for &quot;{searchQuery}&quot;</p>}
      </div>

      {/* Quiz List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(selectedProgramId === "all" ? quizzes : quizzes.filter(q => q.programId === selectedProgramId)).filter(q => !searchQuery.trim() || q.title.toLowerCase().includes(searchQuery.toLowerCase()) || (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()))).map(quiz => (
          <div key={quiz.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border hover:shadow-none transition-shadow relative">
            <label className="absolute top-3 left-3 z-10 cursor-pointer"><input type="checkbox" checked={selectedIds.has(quiz.id)} onChange={() => toggleSelect(quiz.id)} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8] w-4 h-4" /></label>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{quiz.title}</h3>
                {quiz.description && <p className="text-sm text-slate-500 mt-1">{quiz.description}</p>}
              </div>
              {!quiz.isPublished && <span className="text-xs bg-transparent text-slate-400 px-2 py-1 rounded">Draft</span>}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span>📝 {quiz.questionCount} questions</span>
              {quiz.timeLimit && <span>⏱ {quiz.timeLimit} min</span>}
              <span>🎯 Pass: {quiz.passingScore}%</span>
            </div>
            <div className="flex items-center justify-between mt-4">
              {quiz.myAttempt ? (
                <span className={`text-sm font-medium ${quiz.myAttempt.passed ? "text-emerald-400" : "text-red-400"}`}>
                  {quiz.myAttempt.passed ? "✓ Passed" : "✗ Failed"} ({Math.round(quiz.myAttempt.score)}%)
                </span>
              ) : (
                <button onClick={() => startQuiz(quiz.id)} className="px-4 py-2 bg-[#0EA5B8] text-white text-sm rounded-lg hover:bg-[#0891b2]">Start Quiz</button>
              )}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePublish(quiz.id, quiz.isPublished)} className="text-xs px-2 py-1 bg-transparent text-[#22d3ee] rounded hover:bg-[#0EA5B8]/10">
                    {quiz.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => deleteQuiz(quiz.id, quiz.title)} className="text-xs px-2 py-1 bg-transparent text-red-400 rounded hover:bg-red-500/10">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {quizzes.length === 0 && (
        <>
          <PaymentBlockMessage feature="Quizzes" />
          <div className="text-center py-12 text-slate-500">No quizzes available yet.</div>
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Create Quiz</h2>
            <div className="space-y-4">
              <input placeholder="Quiz Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Time Limit (minutes)" value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: e.target.value })} className="px-3 py-2 border rounded-lg" type="number" />
                <input placeholder="Passing Score (%)" value={form.passingScore} onChange={e => setForm({ ...form, passingScore: e.target.value })} className="px-3 py-2 border rounded-lg" type="number" />
              </div>
              <h3 className="font-medium">Questions</h3>
              {form.questions.map((q, qi) => (
                <div key={qi} className="border rounded-lg p-4 space-y-2">
                  <input placeholder={`Question ${qi + 1}`} value={q.question} onChange={e => { const qs = [...form.questions]; qs[qi].question = e.target.value; setForm({ ...form, questions: qs }); }} className="w-full px-3 py-2 border rounded-lg" />
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi} onChange={() => { const qs = [...form.questions]; qs[qi].correctAnswer = oi; setForm({ ...form, questions: qs }); }} />
                      <input placeholder={`Option ${oi + 1}`} value={opt} onChange={e => { const qs = [...form.questions]; qs[qi].options[oi] = e.target.value; setForm({ ...form, questions: qs }); }} className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={() => setForm({ ...form, questions: [...form.questions, { question: "", options: ["", "", "", ""], correctAnswer: 0, points: 10 }] })} className="text-sm text-[#22d3ee]">+ Add Question</button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400">Cancel</button>
              <button onClick={createQuiz} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
