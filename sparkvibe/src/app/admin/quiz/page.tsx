"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, GripVertical, Save, X } from "lucide-react";
import { quizQuestions as defaultQuestions } from "@/data/quiz";
import { QuizQuestion, QuizOption } from "@/types";

export default function AdminQuiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>(defaultQuestions);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editOptions, setEditOptions] = useState<QuizOption[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");

  const startEdit = (q: QuizQuestion) => {
    setEditing(q.id);
    setEditTitle(q.title);
    setEditSubtitle(q.subtitle || "");
    setEditOptions([...q.options]);
  };

  const saveEdit = () => {
    if (!editing) return;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === editing
          ? { ...q, title: editTitle, subtitle: editSubtitle, options: editOptions }
          : q,
      ),
    );
    setEditing(null);
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addQuestion = () => {
    if (!newTitle.trim()) return;
    const newQ: QuizQuestion = {
      id: `q${Date.now()}`,
      title: newTitle,
      subtitle: newSubtitle,
      options: [
        { id: `${Date.now()}a`, label: "Option 1", emoji: "✨" },
        { id: `${Date.now()}b`, label: "Option 2", emoji: "💫" },
        { id: `${Date.now()}c`, label: "Option 3", emoji: "🌟" },
        { id: `${Date.now()}d`, label: "Option 4", emoji: "⭐" },
      ],
    };
    setQuestions((prev) => [...prev, newQ]);
    setNewTitle("");
    setNewSubtitle("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quiz Questions</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage the quiz funnel questions and options
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Add new question */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-bold text-gray-800 mb-4">New Question</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Question title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
            <input
              type="text"
              placeholder="Subtitle (optional)..."
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            {editing === q.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm font-medium"
                />
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
                  placeholder="Subtitle..."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {editOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.emoji}
                        onChange={(e) => {
                          const updated = [...editOptions];
                          updated[idx] = { ...updated[idx], emoji: e.target.value };
                          setEditOptions(updated);
                        }}
                        className="w-12 px-2 py-2 rounded-lg border border-gray-200 text-center outline-none text-sm"
                      />
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => {
                          const updated = [...editOptions];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setEditOptions(updated);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <GripVertical className="w-5 h-5 text-gray-300 mt-1 cursor-grab shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      Q{i + 1}
                    </span>
                    <h3 className="font-bold text-gray-800 text-sm">{q.title}</h3>
                  </div>
                  {q.subtitle && (
                    <p className="text-xs text-gray-400 mb-2">{q.subtitle}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <span
                        key={opt.id}
                        className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-xs text-gray-600"
                      >
                        {opt.emoji} {opt.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(q)}
                    className="p-2 rounded-lg hover:bg-pink-50 text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
