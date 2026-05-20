"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, Eye, EyeOff, Plus, Settings } from "lucide-react";

interface FunnelPage {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  order: number;
}

const defaultPages: FunnelPage[] = [
  { id: "1", name: "Landing + Age Gate", type: "age_gate", enabled: true, order: 1 },
  { id: "2", name: "Gender Selection", type: "gender", enabled: true, order: 2 },
  { id: "3", name: "Connection Type", type: "connection", enabled: true, order: 3 },
  { id: "4", name: "Quiz: What attracts you most?", type: "quiz", enabled: true, order: 4 },
  { id: "5", name: "Quiz: Preferred way to connect?", type: "quiz", enabled: true, order: 5 },
  { id: "6", name: "Quiz: What makes video call special?", type: "quiz", enabled: true, order: 6 },
  { id: "7", name: "Quiz: When to start chatting?", type: "quiz", enabled: true, order: 7 },
  { id: "8", name: "Quiz: Your preferred vibe?", type: "quiz", enabled: true, order: 8 },
  { id: "9", name: "Matches Page", type: "matches", enabled: true, order: 9 },
  { id: "10", name: "Final Profile + CTA", type: "profile", enabled: true, order: 10 },
];

export default function AdminPages() {
  const [pages, setPages] = useState<FunnelPage[]>(defaultPages);

  const togglePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Funnel Pages</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and reorder your quiz funnel pages
          </p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow text-sm">
          <Plus className="w-4 h-4" />
          Add Page
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
          <span></span>
          <span>Page Name</span>
          <span>Type</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {pages.map((page, i) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
          >
            <GripVertical className="w-5 h-5 text-gray-300 cursor-grab" />
            <div>
              <span className="font-medium text-gray-800 text-sm">{page.name}</span>
              <span className="ml-2 text-xs text-gray-400">Step {page.order}</span>
            </div>
            <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-medium capitalize">
              {page.type.replace("_", " ")}
            </span>
            <button
              onClick={() => togglePage(page.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                page.enabled
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {page.enabled ? (
                <>
                  <Eye className="w-3 h-3" /> Active
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" /> Hidden
                </>
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <Settings className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
