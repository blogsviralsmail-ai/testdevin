"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, getStatusColor } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  dueDate: string | null;
  points: number;
  isPublished: boolean;
  batch: { name: string; program: { title: string } };
  _count: { submissions: number };
}

interface Batch {
  id: string;
  name: string;
  program: { title: string };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    batchId: "", title: "", description: "", type: "regular", dueDate: "", points: "10",
  });

  const fetchData = useCallback(async () => {
    const [tasksRes, batchesRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/batches"),
    ]);
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (batchesRes.ok) setBatches(await batchesRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ batchId: "", title: "", description: "", type: "regular", dueDate: "", points: "10" });
      fetchData();
    }
  };

  const typeColors: Record<string, string> = {
    regular: "bg-blue-100 text-blue-700",
    urgent: "bg-red-100 text-red-700",
    assessment: "bg-purple-100 text-purple-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks & Assignments</h1>
          <p className="text-gray-600 text-sm">Create and manage tasks for students</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
          {showForm ? "Cancel" : "+ New Task"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="regular">Regular Task</option>
                <option value="urgent">Urgent (Manual/Company)</option>
                <option value="assessment">Assessment/Quiz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">Create Task</button>
        </form>
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-gray-600">No tasks yet. Create your first task!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`bg-white rounded-xl p-6 border card-hover ${task.type === "urgent" ? "border-red-200 bg-red-50/30" : "border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type] || "bg-gray-100 text-gray-600"}`}>
                      {task.type}
                    </span>
                  </div>
                  {task.description && <p className="text-sm text-gray-600 mb-3">{task.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📦 {task.batch.program.title} - {task.batch.name}</span>
                    <span>⭐ {task.points} points</span>
                    {task.dueDate && <span>📅 Due: {formatDate(task.dueDate)}</span>}
                    <span>📄 {task._count.submissions} submissions</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
