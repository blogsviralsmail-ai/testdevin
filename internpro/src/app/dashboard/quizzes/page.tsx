"use client";
import { useState, useEffect } from "react";

interface Quiz { id: string; title: string; description?: string; timeLimit?: number; passingScore: number; isPublished: boolean; questionCount: number; attemptCount: number; myAttempt?: { score: number; passed: boolean; completedAt: string } | null; createdAt: string; }
interface Question { id?: string; question: string; options: string[]; correctAnswer: number; points: number; }

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizDetail, setQuizDetail] = useState<{ id: string; title: string; timeLimit?: number; passingScore: number; questions: Question[] } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [form, setForm] = useState({ title: "", description: "", timeLimit: "", passingScore: "60", questions: [{ question: "", options: ["", "", "", ""], correctAnswer: 0, points: 10 }] as Question[] });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d));
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

  const isAdmin = user?.role === "admin" || user?.role === "organization" || user?.role === "teamleader";

  // Quiz taking view
  if (activeQuiz && quizDetail) {
    if (result) {
      return (
        <div className="max-w-2xl mx-auto">
          <div className={`rounded-xl p-8 text-center ${result.passed ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"}`}>
            <span className="text-6xl">{result.passed ? "🎉" : "😔"}</span>
            <h2 className="text-2xl font-bold mt-4">{result.passed ? "Congratulations! You Passed!" : "Better Luck Next Time"}</h2>
            <p className="text-4xl font-bold mt-4 text-indigo-600">{Math.round(result.score)}%</p>
            <p className="text-sm text-gray-500 mt-2">Passing Score: {quizDetail.passingScore}%</p>
            <button onClick={() => { setActiveQuiz(null); setQuizDetail(null); }} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg">Back to Quizzes</button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{quizDetail.title}</h1>
          <button onClick={() => { setActiveQuiz(null); setQuizDetail(null); }} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        </div>
        {quizDetail.questions.map((q, qi) => (
          <div key={qi} className="bg-white rounded-xl p-5 border">
            <p className="font-medium mb-3">Q{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${answers[qi] === oi ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"}`}>
                  <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi} onChange={() => { const a = [...answers]; a[qi] = oi; setAnswers(a); }} className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <button onClick={submitQuiz} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Submit Quiz</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quizzes & Assessments</h1>
          <p className="text-sm text-gray-500">Test your knowledge and earn points</p>
        </div>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Create Quiz</button>}
      </div>

      {/* Quiz List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{quiz.title}</h3>
                {quiz.description && <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>}
              </div>
              {!quiz.isPublished && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Draft</span>}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>📝 {quiz.questionCount} questions</span>
              {quiz.timeLimit && <span>⏱ {quiz.timeLimit} min</span>}
              <span>🎯 Pass: {quiz.passingScore}%</span>
            </div>
            <div className="flex items-center justify-between mt-4">
              {quiz.myAttempt ? (
                <span className={`text-sm font-medium ${quiz.myAttempt.passed ? "text-green-600" : "text-red-600"}`}>
                  {quiz.myAttempt.passed ? "✓ Passed" : "✗ Failed"} ({Math.round(quiz.myAttempt.score)}%)
                </span>
              ) : (
                <button onClick={() => startQuiz(quiz.id)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Start Quiz</button>
              )}
              {isAdmin && (
                <button onClick={() => togglePublish(quiz.id, quiz.isPublished)} className="text-sm text-indigo-600 hover:underline">
                  {quiz.isPublished ? "Unpublish" : "Publish"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {quizzes.length === 0 && <div className="text-center py-12 text-gray-400">No quizzes available yet.</div>}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <button onClick={() => setForm({ ...form, questions: [...form.questions, { question: "", options: ["", "", "", ""], correctAnswer: 0, points: 10 }] })} className="text-sm text-indigo-600">+ Add Question</button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={createQuiz} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
