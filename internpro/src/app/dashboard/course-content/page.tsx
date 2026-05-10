"use client";

import { useState, useEffect, useCallback } from "react";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  fileUrl: string | null;
  dayNumber: number | null;
  order: number;
  batchId: string;
}

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

interface QuizItem {
  id: string;
  title: string;
  description: string | null;
  dayNumber: number | null;
  passingScore: number;
  isPublished: boolean;
  questionCount: number;
  attemptCount: number;
  programId: string | null;
}

interface Batch {
  id: string;
  name: string;
  programId: string;
  program: { id: string; title: string };
}

const typeIcons: Record<string, string> = {
  video: "🎥", pdf: "📄", link: "🔗", document: "📋", image: "🖼️", word: "📝", excel: "📊", ppt: "📑", file: "📎",
};

export default function CourseContentPage() {
  const [activeTab, setActiveTab] = useState<"material" | "tasks" | "quizzes">("material");
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Resource form
  const [showResForm, setShowResForm] = useState(false);
  const [resForm, setResForm] = useState({ batchId: "", title: "", type: "video", url: "", fileUrl: "", dayNumber: "", order: "0" });
  const [editRes, setEditRes] = useState<Resource | null>(null);
  const [editResForm, setEditResForm] = useState({ title: "", type: "video", url: "", fileUrl: "", dayNumber: "", order: "0", batchId: "" });
  const [fileUploading, setFileUploading] = useState(false);

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ batchId: "", title: "", description: "", type: "daily", dayNumber: "", maxPoints: "100", scope: "batch" });
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({ title: "", description: "", type: "daily", dayNumber: "", maxPoints: "100" });

  const fetchData = useCallback(async () => {
    const [resRes, tasksRes, batchesRes, quizRes] = await Promise.all([
      fetch("/api/resources"),
      fetch("/api/tasks"),
      fetch("/api/batches"),
      fetch("/api/quizzes"),
    ]);
    if (resRes.ok) setResources(await resRes.json());
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (batchesRes.ok) setBatches(await batchesRes.json());
    if (quizRes.ok) setQuizzes(await quizRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "resource" | "task") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        if (target === "resource") {
          if (editRes) setEditResForm(f => ({ ...f, fileUrl: data.url }));
          else setResForm(f => ({ ...f, fileUrl: data.url }));
        }
      }
    } catch { /* ignore */ }
    setFileUploading(false);
  };

  // Resource CRUD
  const addResource = async () => {
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...resForm, dayNumber: resForm.dayNumber ? parseInt(resForm.dayNumber) : null, order: parseInt(resForm.order) }),
    });
    if (res.ok) { setShowResForm(false); setResForm({ batchId: "", title: "", type: "video", url: "", fileUrl: "", dayNumber: "", order: "0" }); fetchData(); }
  };

  const updateResource = async () => {
    if (!editRes) return;
    const res = await fetch(`/api/resources/${editRes.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editResForm, dayNumber: editResForm.dayNumber ? parseInt(editResForm.dayNumber) : null, order: parseInt(editResForm.order) }),
    });
    if (res.ok) { setEditRes(null); fetchData(); }
  };

  const deleteResource = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    await fetch(`/api/resources/${id}`, { method: "DELETE" });
    fetchData();
  };

  // Task CRUD
  const addTask = async () => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskForm, dayNumber: taskForm.dayNumber ? parseInt(taskForm.dayNumber) : null, maxPoints: parseInt(taskForm.maxPoints) }),
    });
    if (res.ok) { setShowTaskForm(false); setTaskForm({ batchId: "", title: "", description: "", type: "daily", dayNumber: "", maxPoints: "100", scope: "batch" }); fetchData(); }
  };

  const updateTask = async () => {
    if (!editTask) return;
    const res = await fetch(`/api/tasks/${editTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editTaskForm, dayNumber: editTaskForm.dayNumber ? parseInt(editTaskForm.dayNumber) : null, maxPoints: parseInt(editTaskForm.maxPoints) }),
    });
    if (res.ok) { setEditTask(null); fetchData(); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchData();
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("Delete this quiz?")) return;
    await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
    fetchData();
  };

  // Filtering
  const filteredResources = resources.filter(r => {
    if (selectedBatchId !== "all" && r.batchId !== selectedBatchId) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));

  const filteredTasks = tasks.filter(t => {
    if (selectedBatchId !== "all") {
      const batch = batches.find(b => b.id === selectedBatchId);
      if (batch && t.batch.name !== batch.name) return false;
    }
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));

  const filteredQuizzes = quizzes.filter(q => {
    if (selectedBatchId !== "all") {
      const batch = batches.find(b => b.id === selectedBatchId);
      if (batch && q.programId !== batch.programId) return false;
    }
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));

  const getBatchName = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    return batch ? `${batch.program.title} — ${batch.name}` : batchId;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Content</h1>
          <p className="text-sm text-gray-500">Manage study material, tasks, and quizzes for all programs</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{resources.length} Resources</span>
          <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 font-medium">{tasks.length} Tasks</span>
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">{quizzes.length} Quizzes</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: "material" as const, label: "Study Material", count: resources.length, color: "text-blue-700" },
          { key: "tasks" as const, label: "Tasks", count: tasks.length, color: "text-orange-700" },
          { key: "quizzes" as const, label: "Quizzes", count: quizzes.length, color: "text-purple-700" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === tab.key ? `bg-white ${tab.color} shadow-sm` : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filters + Add Button */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm text-gray-700 bg-white">
          <option value="all">All Programs</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.program.title} — {b.name}</option>)}
        </select>
        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm text-gray-700 flex-1 min-w-[200px]" />
        {activeTab === "material" && (
          <button onClick={() => setShowResForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add Resource
          </button>
        )}
        {activeTab === "tasks" && (
          <button onClick={() => setShowTaskForm(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
            + Add Task
          </button>
        )}
      </div>

      {/* ===== STUDY MATERIAL TAB ===== */}
      {activeTab === "material" && (
        <div className="space-y-3">
          {filteredResources.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border text-center">
              <p className="text-4xl mb-3">🎥</p>
              <p className="text-gray-500">No resources found</p>
            </div>
          ) : filteredResources.map(res => (
            <div key={res.id} className="bg-white rounded-xl p-4 border hover:shadow-sm transition flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{typeIcons[res.type] || "📎"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {res.dayNumber && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Day {res.dayNumber}</span>}
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{res.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{getBatchName(res.batchId)} &bull; {res.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                {res.url && <a href={res.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Open</a>}
                <button onClick={() => { setEditRes(res); setEditResForm({ title: res.title, type: res.type, url: res.url, fileUrl: res.fileUrl || "", dayNumber: res.dayNumber?.toString() || "", order: res.order.toString(), batchId: res.batchId }); }}
                  className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Edit</button>
                <button onClick={() => deleteResource(res.id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== TASKS TAB ===== */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-500">No tasks found</p>
            </div>
          ) : filteredTasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl p-4 border hover:shadow-sm transition flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {task.dayNumber && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Day {task.dayNumber}</span>}
                  {task.isUrgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Urgent</span>}
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h3>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{task.batch.program.title} — {task.batch.name} &bull; {task.maxPoints} pts &bull; {task._count.submissions} submissions</p>
                {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button onClick={() => { setEditTask(task); setEditTaskForm({ title: task.title, description: task.description || "", type: task.type, dayNumber: task.dayNumber?.toString() || "", maxPoints: task.maxPoints.toString() }); }}
                  className="px-3 py-1.5 text-xs bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100">Edit</button>
                <button onClick={() => deleteTask(task.id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== QUIZZES TAB ===== */}
      {activeTab === "quizzes" && (
        <div className="space-y-3">
          {filteredQuizzes.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border text-center">
              <p className="text-4xl mb-3">🧠</p>
              <p className="text-gray-500">No quizzes found</p>
            </div>
          ) : filteredQuizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-xl p-4 border hover:shadow-sm transition flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {quiz.dayNumber && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Day {quiz.dayNumber}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${quiz.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{quiz.isPublished ? "Published" : "Draft"}</span>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{quiz.title}</h3>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{quiz.questionCount} questions &bull; Pass: {quiz.passingScore}% &bull; {quiz.attemptCount} attempts</p>
                {quiz.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{quiz.description}</p>}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button onClick={() => deleteQuiz(quiz.id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== ADD RESOURCE MODAL ===== */}
      {showResForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Resource</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program / Batch</label>
                <select value={resForm.batchId} onChange={e => setResForm(f => ({ ...f, batchId: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                  <option value="">Select batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.program.title} — {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={resForm.title} onChange={e => setResForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={resForm.type} onChange={e => setResForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                    {Object.keys(typeIcons).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day Number</label>
                  <input type="number" value={resForm.dayNumber} onChange={e => setResForm(f => ({ ...f, dayNumber: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input type="url" value={resForm.url} onChange={e => setResForm(f => ({ ...f, url: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload File</label>
                <input type="file" onChange={e => handleFileUpload(e, "resource")} className="w-full text-sm" />
                {fileUploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
                {resForm.fileUrl && <p className="text-xs text-green-600 mt-1">File uploaded</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowResForm(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={addResource} disabled={!resForm.batchId || !resForm.title} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Add Resource</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT RESOURCE MODAL ===== */}
      {editRes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Resource</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={editResForm.title} onChange={e => setEditResForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={editResForm.type} onChange={e => setEditResForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                    {Object.keys(typeIcons).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day Number</label>
                  <input type="number" value={editResForm.dayNumber} onChange={e => setEditResForm(f => ({ ...f, dayNumber: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input type="url" value={editResForm.url} onChange={e => setEditResForm(f => ({ ...f, url: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload New File</label>
                <input type="file" onChange={e => handleFileUpload(e, "resource")} className="w-full text-sm" />
                {fileUploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
                {editResForm.fileUrl && <p className="text-xs text-green-600 mt-1">File: {editResForm.fileUrl.split("/").pop()}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditRes(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={updateResource} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD TASK MODAL ===== */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Task</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program / Batch</label>
                <select value={taskForm.batchId} onChange={e => setTaskForm(f => ({ ...f, batchId: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                  <option value="">Select batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.program.title} — {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day Number</label>
                  <input type="number" value={taskForm.dayNumber} onChange={e => setTaskForm(f => ({ ...f, dayNumber: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
                  <input type="number" value={taskForm.maxPoints} onChange={e => setTaskForm(f => ({ ...f, maxPoints: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={addTask} disabled={!taskForm.batchId || !taskForm.title} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">Add Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT TASK MODAL ===== */}
      {editTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Task</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={editTaskForm.title} onChange={e => setEditTaskForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editTaskForm.description} onChange={e => setEditTaskForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day Number</label>
                  <input type="number" value={editTaskForm.dayNumber} onChange={e => setEditTaskForm(f => ({ ...f, dayNumber: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
                  <input type="number" value={editTaskForm.maxPoints} onChange={e => setEditTaskForm(f => ({ ...f, maxPoints: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditTask(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={updateTask} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
