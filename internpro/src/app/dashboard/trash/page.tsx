"use client";

import { useState, useEffect, useCallback } from "react";

interface TrashedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  employeeId: string | null;
  collegeName: string | null;
  deletedAt: string;
  createdAt: string;
  _count: {
    enrollments: number;
    attendances: number;
    documents: number;
    submissions: number;
    employeeCards: number;
  };
}

export default function TrashPage() {
  const [trashedUsers, setTrashedUsers] = useState<TrashedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTrashed = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/trash");
    if (res.ok) setTrashedUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrashed(); }, [fetchTrashed]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(u => u.id)));
  };

  const handleRestore = async (ids: string[]) => {
    if (!confirm(`Restore ${ids.length} user(s)? They will be visible again in all pages.`)) return;
    setProcessing(true);
    await fetch("/api/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", ids }),
    });
    setSelectedIds(new Set());
    setProcessing(false);
    fetchTrashed();
  };

  const handlePermanentDelete = async (ids: string[]) => {
    if (!confirm(`PERMANENTLY delete ${ids.length} user(s) and ALL their data? This cannot be undone!`)) return;
    if (!confirm("Are you absolutely sure? All enrollments, attendance, documents, certificates, payments etc. will be permanently deleted.")) return;
    setProcessing(true);
    await fetch("/api/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "permanent_delete", ids }),
    });
    setSelectedIds(new Set());
    setProcessing(false);
    fetchTrashed();
  };

  const filtered = trashedUsers.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q)) || (u.employeeId && u.employeeId.toLowerCase().includes(q));
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🗑️ Trash</h1>
          <p className="text-slate-400 text-sm">Deleted students and users — restore or permanently delete</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search trash..."
              className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm text-white focus:ring-2 focus:ring-[#0EA5B8] focus:border-indigo-500 bg-transparent border-white/10"
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400">✕</button>}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <span className="text-sm text-amber-400 font-medium">{selectedIds.size} selected</span>
          <button
            onClick={() => handleRestore(Array.from(selectedIds))}
            disabled={processing}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {processing ? "Processing..." : "♻️ Restore Selected"}
          </button>
          <button
            onClick={() => handlePermanentDelete(Array.from(selectedIds))}
            disabled={processing}
            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? "Processing..." : "🗑️ Delete Permanently"}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center">
          <p className="text-4xl mb-4">🗑️</p>
          <p className="text-slate-400">Trash is empty. Deleted students will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr className="text-left text-slate-400">
                  <th className="p-3 w-10">
                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filtered.length} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" />
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">User</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Employee ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Related Data</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Deleted On</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 w-10">
                      <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-sm font-bold shrink-0 overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                          ) : (
                            user.name.split(" ").map(n => n[0]).join("").substring(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                          {user.phone && <div className="text-xs text-slate-500">{user.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 capitalize">{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#22d3ee] font-medium">{user.employeeId || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user._count.enrollments > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{user._count.enrollments} enrollment{user._count.enrollments > 1 ? "s" : ""}</span>}
                        {user._count.attendances > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{user._count.attendances} attendance</span>}
                        {user._count.documents > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{user._count.documents} doc{user._count.documents > 1 ? "s" : ""}</span>}
                        {user._count.submissions > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{user._count.submissions} submission{user._count.submissions > 1 ? "s" : ""}</span>}
                        {user._count.employeeCards > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400">{user._count.employeeCards} ID card{user._count.employeeCards > 1 ? "s" : ""}</span>}
                        {user._count.enrollments === 0 && user._count.attendances === 0 && user._count.documents === 0 && <span className="text-xs text-slate-500">No data</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-red-400">{formatDate(user.deletedAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRestore([user.id])}
                          disabled={processing}
                          className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 font-medium disabled:opacity-50"
                        >
                          ♻️ Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete([user.id])}
                          disabled={processing}
                          className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 font-medium disabled:opacity-50"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
