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

export default function MyWorkPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [resRes, tasksRes, subsRes, enrollRes] = await Promise.all([
        fetch("/api/resources"),
        fetch("/api/tasks"),
        fetch("/api/submissions"),
        fetch("/api/my-enrollment"),
      ]);
      if (resRes.ok) setResources(await resRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (subsRes.ok) setSubmissions(await subsRes.json());
      if (enrollRes.ok) {
        const eData = await enrollRes.json();
        setEnrollment(eData);
        setSelectedDay(eData.currentDay || 1);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="p-6 text-center text-gray-600">Loading your workspace...</div>;

  if (!enrollment) {
    return (
      <div className="p-6">
        <PaymentBlockMessage feature="My Workspace" />
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Not Enrolled Yet</h2>
          <p className="text-yellow-700">Aapka enrollment abhi active nahi hai. Admin ko contact karein ya apna application status check karein.</p>
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

  // Get resources and tasks for selected day
  const dayResources = resources.filter(r => r.dayNumber === selectedDay);
  const dayTasks = tasks.filter(t => t.dayNumber === selectedDay);

  const getSubmissionStatus = (taskId: string) => {
    const sub = submissions.find(s => s.taskId === taskId);
    if (!sub) return { status: "not_started", label: "Not Started", color: "bg-gray-100 text-gray-600" };
    if (sub.status === "reviewed") return { status: "reviewed", label: sub.grade ? `Reviewed (${sub.grade})` : "Reviewed", color: "bg-green-100 text-green-700" };
    if (sub.status === "submitted") return { status: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-700" };
    return { status: sub.status, label: sub.status, color: "bg-yellow-100 text-yellow-700" };
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
        <h1 className="text-2xl font-bold text-gray-900">My Workspace</h1>
        <p className="text-gray-600">{enrollment.programTitle} — {enrollment.batchName}</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{currentDay}</p>
          <p className="text-xs text-gray-500 mt-1">Current Day</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{completedDays}</p>
          <p className="text-xs text-gray-500 mt-1">Days Completed</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{totalDays}</p>
          <p className="text-xs text-gray-500 mt-1">Total Days</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{progressPercent}%</p>
          <p className="text-xs text-gray-500 mt-1">Progress</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="text-gray-500">{completedDays} / {allDays.length} days</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Day Selector Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border p-4 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-3">Select Day</h3>
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
                        ? "bg-indigo-600 text-white"
                        : isToday
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {allDone && dTasks.length > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">&#10003;</span>
                      ) : isToday ? (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">&#9679;</span>
                      ) : (
                        <span className={`w-5 h-5 rounded-full border-2 text-xs flex items-center justify-center ${selectedDay === d ? "border-white" : "border-gray-300"}`}>{d}</span>
                      )}
                      Day {d}
                    </span>
                    <span className={`text-xs ${selectedDay === d ? "text-indigo-200" : "text-gray-400"}`}>
                      {dResources.length}V {dTasks.length}T
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Day {selectedDay}
                {selectedDay === currentDay && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Today</span>}
              </h2>
              <div className="flex gap-2 text-sm text-gray-500">
                <span>{dayResources.length} video(s)</span>
                <span>|</span>
                <span>{dayTasks.length} task(s)</span>
              </div>
            </div>

            {/* Videos/Resources */}
            {dayResources.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs">&#9654;</span>
                  Study Material
                </h3>
                <div className="space-y-3">
                  {dayResources.map(r => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-gray-50 hover:bg-indigo-50 rounded-lg p-4 transition border hover:border-indigo-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-lg shrink-0">
                          {r.type === "video" ? "🎥" : r.type === "pdf" ? "📄" : "🔗"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-indigo-700 truncate">{r.title}</p>
                          <p className="text-xs text-gray-500">{r.type.charAt(0).toUpperCase() + r.type.slice(1)} — Click to open</p>
                        </div>
                        <span className="text-gray-400 group-hover:text-indigo-500">&#8599;</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {dayTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs">&#9998;</span>
                  Tasks
                </h3>
                <div className="space-y-3">
                  {dayTasks.map(t => {
                    const sub = getSubmissionStatus(t.id);
                    return (
                      <div key={t.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{t.title}</p>
                            {t.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.description}</p>}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${sub.color}`}>{sub.label}</span>
                        </div>
                        {sub.status === "not_started" && (
                          <a href="/dashboard/tasks" className="inline-block mt-3 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                            Submit Task
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dayResources.length === 0 && dayTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-500">No content scheduled for Day {selectedDay}</p>
              </div>
            )}
          </div>

          {/* Quick Navigation */}
          <div className="flex gap-3">
            {selectedDay > 1 && (
              <button onClick={() => setSelectedDay(selectedDay - 1)} className="flex-1 px-4 py-3 bg-white border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                &#8592; Day {selectedDay - 1}
              </button>
            )}
            {selectedDay < currentDay && selectedDay < totalDays && (
              <button onClick={() => setSelectedDay(selectedDay + 1)} className="flex-1 px-4 py-3 bg-white border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Day {selectedDay + 1} &#8594;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
