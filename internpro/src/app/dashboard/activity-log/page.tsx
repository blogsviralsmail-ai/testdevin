"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (search) params.set("search", search);
    if (entity) params.set("entity", entity);

    fetch(`/api/activity-log?${params}`)
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, search, entity]);

  const actionColor = (action: string) => {
    if (action.includes("create") || action.includes("generate")) return "bg-emerald-500/10 text-green-800";
    if (action.includes("delete") || action.includes("reject")) return "bg-red-500/10 text-red-800";
    if (action.includes("update") || action.includes("select")) return "bg-blue-500/10 text-blue-800";
    if (action.includes("bulk")) return "bg-purple-500/10 text-purple-800";
    return "bg-transparent text-white";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text" placeholder="Search..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm w-full sm:w-56"
          />
          <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Entities</option>
            {["enrollment", "payment", "certificate", "offer_letter", "experience_letter", "attendance", "user"].map(e => (
              <option key={e} value={e}>{e.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No activity logs yet</div>
      ) : (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-transparent">
                  <th className="text-left p-3 font-medium text-slate-400">Time</th>
                  <th className="text-left p-3 font-medium text-slate-400">User</th>
                  <th className="text-left p-3 font-medium text-slate-400">Action</th>
                  <th className="text-left p-3 font-medium text-slate-400">Entity</th>
                  <th className="text-left p-3 font-medium text-slate-400">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-transparent">
                    <td className="p-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="p-3 font-medium text-white">{log.userName || "System"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 capitalize">{log.entity.replace("_", " ")}</td>
                    <td className="p-3 text-slate-500 text-xs max-w-xs truncate">{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 border-t">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
