"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, FileText, Save, X } from "lucide-react";

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: "published" | "draft";
  updatedAt: string;
}

const defaultContent: ContentPage[] = [
  { id: "1", title: "About Us", slug: "/about", type: "page", status: "published", updatedAt: "2025-05-18" },
  { id: "2", title: "Privacy Policy", slug: "/privacy", type: "legal", status: "published", updatedAt: "2025-05-15" },
  { id: "3", title: "Terms of Service", slug: "/terms", type: "legal", status: "published", updatedAt: "2025-05-15" },
  { id: "4", title: "How SparkVibe Works", slug: "/blog/how-it-works", type: "blog", status: "published", updatedAt: "2025-05-19" },
  { id: "5", title: "Video Dating Tips", slug: "/blog/video-dating-tips", type: "blog", status: "draft", updatedAt: "2025-05-20" },
  { id: "6", title: "Safety Guidelines", slug: "/safety", type: "page", status: "published", updatedAt: "2025-05-10" },
];

export default function AdminContent() {
  const [pages, setPages] = useState<ContentPage[]>(defaultContent);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState("page");

  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const addPage = () => {
    if (!newTitle.trim()) return;
    const newP: ContentPage = {
      id: `${Date.now()}`,
      title: newTitle,
      slug: newSlug || `/${newTitle.toLowerCase().replace(/\s+/g, "-")}`,
      type: newType,
      status: "draft",
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setPages((prev) => [...prev, newP]);
    setNewTitle("");
    setNewSlug("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Content Pages</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage blog posts, legal pages, and static content
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-bold text-gray-800 mb-4">New Content Page</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Page Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 outline-none text-sm"
            />
            <input
              type="text"
              placeholder="/slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 outline-none text-sm font-mono"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 outline-none text-sm"
            >
              <option value="page">Page</option>
              <option value="blog">Blog Post</option>
              <option value="legal">Legal</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addPage}
              className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Create
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              <th className="px-5 py-3 font-medium text-gray-500">Title</th>
              <th className="px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Slug</th>
              <th className="px-5 py-3 font-medium text-gray-500">Type</th>
              <th className="px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Updated</th>
              <th className="px-5 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-800">{page.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                  {page.slug}
                </td>
                <td className="px-5 py-3">
                  <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                    {page.type}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      page.status === "published"
                        ? "bg-green-50 text-green-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {page.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                  {page.updatedAt}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-pink-50 text-gray-400 hover:text-pink-500">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePage(page.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
