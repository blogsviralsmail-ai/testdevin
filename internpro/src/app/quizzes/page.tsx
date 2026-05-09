"use client";
import { useState, useEffect } from "react";

interface Quiz { id: string; title: string; description?: string; timeLimit?: number; passingScore: number; questionCount: number; }
interface Question { id?: string; question: string; options: string[]; correctAnswer?: number; points: number; }

export default function PublicQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizDetail, setQuizDetail] = useState<{ id: string; title: string; timeLimit?: number; passingScore: number; questions: Question[] } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => { fetchQuizzes(); }, []);

  const fetchQuizzes = async () => { const r = await fetch("/api/quizzes"); if (r.ok) setQuizzes(await r.json()); };

  const startQuiz = async (id: string) => {
    const r = await fetch(`/api/quizzes/${id}`);
    if (r.ok) { const data = await r.json(); setQuizDetail(data); setActiveQuiz(id); setAnswers(new Array(data.questions.length).fill(-1)); setResult(null); }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    const r = await fetch(`/api/quizzes/${activeQuiz}/attempt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, timeTaken: 0 }) });
    if (r.ok) { const data = await r.json(); setResult(data); }
    else { const err = await r.json(); alert(err.error || "Error submitting quiz"); }
  };

  if (activeQuiz && quizDetail) {
    if (result) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-xl p-8 text-center ${result.passed ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"}`}>
            <span className="text-6xl">{result.passed ? "🎉" : "😔"}</span>
            <h2 className="text-2xl font-bold mt-4">{result.passed ? "Congratulations! You Passed!" : "Better Luck Next Time"}</h2>
            <p className="text-4xl font-bold mt-4 text-indigo-600">{Math.round(result.score)}%</p>
            <p className="text-sm text-gray-500 mt-2">Passing Score: {quizDetail.passingScore}%</p>
            <button onClick={() => { setActiveQuiz(null); setQuizDetail(null); setResult(null); }} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg">Back to Quizzes</button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quizzes & Assessments</h1>
          <p className="text-gray-500 mt-2">Test your knowledge — no login required</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg">{quiz.title}</h3>
              {quiz.description && <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span>📝 {quiz.questionCount} questions</span>
                {quiz.timeLimit && <span>⏱ {quiz.timeLimit} min</span>}
                <span>🎯 Pass: {quiz.passingScore}%</span>
              </div>
              <button onClick={() => startQuiz(quiz.id)} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 w-full">Start Quiz</button>
            </div>
          ))}
        </div>
        {quizzes.length === 0 && <div className="text-center py-12 text-gray-400">No quizzes available yet.</div>}
      </div>
    </div>
  );
}
