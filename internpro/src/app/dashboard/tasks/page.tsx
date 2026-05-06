"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  dayNumber: number | null;
  dueDate: string | null;
  maxPoints: number;
  scope: string;
  assignedTo: string | null;
  isUrgent: boolean;
  batch: { name: string; program: { title: string } };
  _count: { submissions: number };
}

interface Submission {
  id: string;
  taskId: string;
  content: string | null;
  fileUrl: string | null;
  percentage: number | null;
  feedback: string | null;
  reviewedBy: string | null;
  status: string;
  task: { title: string; maxPoints: number; dayNumber: number | null };
}

interface Batch {
  id: string;
  name: string;
  program: { title: string };
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface UserSession {
  id: string;
  role: string;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitModal, setSubmitModal] = useState<string | null>(null);
  const [submitContent, setSubmitContent] = useState("");
  const [submitFile, setSubmitFile] = useState("");
  const [form, setForm] = useState({
    batchId: "", title: "", description: "", type: "regular",
    dayNumber: "", maxPoints: "100", scope: "all", assignedTo: "", isUrgent: false,
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");

  const fetchData = useCallback(async () => {
    const [tasksRes, batchesRes, meRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/batches"),
      fetch("/api/auth/me"),
    ]);
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (batchesRes.ok) setBatches(await batchesRes.json());
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }

    const subsRes = await fetch("/api/submissions");
    if (subsRes.ok) setSubmissions(await subsRes.json());
  }, []);

  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 1) { setStudentOptions([]); return; }
    const res = await fetch(`/api/users?role=student`);
    if (res.ok) {
      const all: StudentOption[] = await res.json();
      const q = query.toLowerCase();
      setStudentOptions(all.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
      ).slice(0, 10));
      setShowStudentDropdown(true);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dayNumber: form.dayNumber ? parseInt(form.dayNumber) : undefined,
        maxPoints: parseInt(form.maxPoints),
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ batchId: "", title: "", description: "", type: "regular", dayNumber: "", maxPoints: "100", scope: "all", assignedTo: "", isUrgent: false });
      fetchData();
    }
  };

  const handleSubmitTask = async (taskId: string) => {
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, content: submitContent, fileUrl: submitFile || undefined }),
    });
    if (res.ok) {
      setSubmitModal(null);
      setSubmitContent("");
      setSubmitFile("");
      fetchData();
    }
  };

  const getSubmissionForTask = (taskId: string) => {
    return submissions.find((s) => s.taskId === taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure? This will delete the task and all its submissions.")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeleteBatchTasks = async (batchId: string, batchLabel: string) => {
    const batchTasks = tasks.filter((t) => t.batch.name === batchLabel || (batches.find((b) => b.id === batchId)?.name === t.batch.name));
    if (!confirm(`Delete ALL ${batchTasks.length} tasks for this batch? This will also delete all submissions.`)) return;
    for (const task of tasks.filter((t) => {
      const b = batches.find((b) => b.id === batchId);
      return b && `${t.batch.program.title} - ${t.batch.name}` === `${b.program.title} - ${b.name}`;
    })) {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    }
    fetchData();
  };

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isTeamLeader = user?.role === "teamleader";

  const totalTasks = tasks.length;
  const submittedTasks = submissions.filter((s) => s.status !== "pending").length;
  const reviewedTasks = submissions.filter((s) => s.status === "reviewed").length;
  const avgPercentage = reviewedTasks > 0
    ? (submissions.filter((s) => s.percentage !== null).reduce((sum, s) => sum + (s.percentage || 0), 0) / reviewedTasks).toFixed(1)
    : "0";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStudent ? "My Tasks & Assignments" : "Tasks & Assignments"}
          </h1>
          <p className="text-gray-600 text-sm">
            {isStudent ? "Complete daily tasks and track your progress" : "Create and manage day-based tasks for students"}
          </p>
        </div>
        {!isStudent && (
          <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
            {showForm ? "Cancel" : "+ New Task"}
          </button>
        )}
      </div>

      {/* Student Stats */}
      {isStudent && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold text-indigo-600">{totalTasks}</p>
            <p className="text-xs text-gray-500">Total Tasks</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold text-green-600">{submittedTasks}</p>
            <p className="text-xs text-gray-500">Submitted</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold text-blue-600">{reviewedTasks}</p>
            <p className="text-xs text-gray-500">Reviewed</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold text-purple-600">{avgPercentage}%</p>
            <p className="text-xs text-gray-500">Avg Score</p>
          </div>
        </div>
      )}

      {/* Create Task Form (Admin/TeamLeader) */}
      {showForm && !isStudent && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 border mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.program.title} - {b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day Number</label>
              <input type="number" min="1" value={form.dayNumber} onChange={(e) => setForm({ ...form, dayNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 1, 2, 3..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
              <input type="number" value={form.maxPoints} onChange={(e) => setForm({ ...form, maxPoints: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
              <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Students</option>
                <option value="individual">Individual Student</option>
              </select>
            </div>
            {form.scope === "individual" && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Student</label>
                <input
                  value={selectedStudentName || studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudentName("");
                    setForm({ ...form, assignedTo: "" });
                    searchStudents(e.target.value);
                  }}
                  onFocus={() => { if (studentSearch.length >= 1) setShowStudentDropdown(true); }}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                  placeholder="Type name, email or phone..."
                />
                {showStudentDropdown && studentOptions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {studentOptions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, assignedTo: s.id });
                          setSelectedStudentName(`${s.name} (${s.email})`);
                          setStudentSearch("");
                          setShowStudentDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm border-b last:border-b-0"
                      >
                        <span className="font-medium text-gray-900">{s.name}</span>
                        <span className="text-gray-500 ml-2">{s.email}</span>
                        {s.phone && <span className="text-gray-400 ml-2">{s.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {form.assignedTo && (
                  <p className="text-xs text-green-600 mt-1">Selected: {selectedStudentName}</p>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <input type="checkbox" id="isUrgent" checked={form.isUrgent} onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="isUrgent" className="text-sm font-medium text-red-600">Mark as Urgent Task</label>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">Create Task</button>
        </form>
      )}

      {/* Batch-level Delete */}
      {(isAdmin || isTeamLeader) && batches.length > 0 && (
        <div className="bg-white rounded-xl p-4 border mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Batch-wise Task Management</h3>
          <div className="flex flex-wrap gap-2">
            {batches.map((b) => {
              const count = tasks.filter((t) => `${t.batch.program.title} - ${t.batch.name}` === `${b.program.title} - ${b.name}`).length;
              return (
                <div key={b.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                  <span className="text-gray-700">{b.program.title} - {b.name}</span>
                  <span className="text-gray-400">({count} tasks)</span>
                  {count > 0 && (
                    <button onClick={() => handleDeleteBatchTasks(b.id, b.name)}
                      className="text-red-600 hover:text-red-800 font-medium">Delete All</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border text-center">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-gray-600">{isStudent ? "No tasks available yet. Tasks will appear as your working days progress." : "No tasks yet. Create your first task!"}</p>
          </div>
        ) : (
          tasks.map((task) => {
            const submission = getSubmissionForTask(task.id);
            const isReviewed = submission?.status === "reviewed";
            const isSubmitted = !!submission;

            return (
              <div key={task.id} className={`bg-white rounded-xl p-6 border transition hover:shadow-md ${task.isUrgent ? "border-red-300 bg-red-50/30" : "border-gray-100"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {task.dayNumber && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          Day {task.dayNumber}
                        </span>
                      )}
                      <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                      {task.isUrgent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">URGENT</span>
                      )}
                      {task.scope === "individual" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Individual</span>
                      )}
                    </div>
                    {task.description && <p className="text-sm text-gray-600 mb-3">{task.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <span>📦 {task.batch.program.title} - {task.batch.name}</span>
                      <span>💯 Max: {task.maxPoints} points</span>
                      {task.dueDate && <span>📅 Due: {formatDate(task.dueDate)}</span>}
                      {!isStudent && <span>📄 {task._count.submissions} submissions</span>}
                    </div>
                  </div>

                  {/* Admin/TL: Delete button */}
                  {(isAdmin || isTeamLeader) && (
                    <div className="ml-4 flex-shrink-0">
                      <button onClick={() => handleDeleteTask(task.id)}
                        className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">
                        Delete
                      </button>
                    </div>
                  )}

                  {/* Student: Submit/Status */}
                  {isStudent && (
                    <div className="ml-4 text-right">
                      {isReviewed ? (
                        <div>
                          <div className="text-2xl font-bold text-green-600">{submission.percentage}%</div>
                          <p className="text-xs text-gray-500">Score</p>
                          {submission.feedback && (
                            <p className="text-xs text-gray-600 mt-1 max-w-[200px]">{submission.feedback}</p>
                          )}
                        </div>
                      ) : isSubmitted ? (
                        <div>
                          <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">Under Review</span>
                          <button
                            onClick={() => { setSubmitModal(task.id); setSubmitContent(submission.content || ""); setSubmitFile(submission.fileUrl || ""); }}
                            className="block mt-2 text-xs text-indigo-600 hover:underline"
                          >
                            Resubmit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSubmitModal(task.id)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
                        >
                          Submit Work
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Task Modal */}
      {submitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Submit Your Work</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Description / Report</label>
                <textarea
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={5}
                  placeholder="Describe what you did, your approach, and results..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File URL (optional)</label>
                <input
                  value={submitFile}
                  onChange={(e) => setSubmitFile(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Link to your work (Google Drive, GitHub, etc.)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setSubmitModal(null); setSubmitContent(""); setSubmitFile(""); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleSubmitTask(submitModal)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
