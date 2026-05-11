"use client";

import { useState, useEffect } from "react";

interface LeaveInfo {
  id: string;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  adminRemarks: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null } | null;
}

export default function LeavesManagementPage() {
  const [leaves, setLeaves] = useState<LeaveInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [showRemarks, setShowRemarks] = useState<string | null>(null);

  const fetchLeaves = async () => {
    const res = await fetch("/api/leave-requests");
    if (res.ok) setLeaves(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionId(id);
    const res = await fetch("/api/leave-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, adminRemarks: remarks }),
    });
    if (res.ok) { fetchLeaves(); setShowRemarks(null); setRemarks(""); }
    setActionId(null);
  };

  const filtered = filter === "all" ? leaves : leaves.filter(l => l.status === filter);
  const pendingCount = leaves.filter(l => l.status === "pending").length;
  const approvedCount = leaves.filter(l => l.status === "approved").length;
  const rejectedCount = leaves.filter(l => l.status === "rejected").length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Leave Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: leaves.length, color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30", text: "text-blue-400", f: "all" },
          { label: "Pending", value: pendingCount, color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30", text: "text-amber-400", f: "pending" },
          { label: "Approved", value: approvedCount, color: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30", text: "text-green-400", f: "approved" },
          { label: "Rejected", value: rejectedCount, color: "from-red-500/20 to-pink-500/20", border: "border-red-500/30", text: "text-red-400", f: "rejected" },
        ].map(s => (
          <button key={s.label} onClick={() => setFilter(s.f)}
            className={`bg-gradient-to-br ${s.color} rounded-xl p-4 border ${s.border} text-left transition-all ${filter === s.f ? "ring-2 ring-white/20" : ""}`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.text} mt-1`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Leave Requests */}
      <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="font-semibold text-white">Leave Requests</h2>
        </div>
        {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
        filtered.length === 0 ? <div className="p-8 text-center text-slate-500">No leave requests found.</div> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr className="text-left text-slate-400">
                <th className="p-3">Employee</th>
                <th className="p-3">Type</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Days</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(leave => (
                <tr key={leave.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div className="font-medium text-white">{leave.user?.name || "—"}</div>
                    <div className="text-xs text-slate-500">{leave.user?.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      leave.leaveType === "sick" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      leave.leaveType === "casual" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                      "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    }`}>{leave.leaveType}</span>
                  </td>
                  <td className="p-3 text-slate-300 text-xs">
                    {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-white font-medium">{leave.totalDays}</td>
                  <td className="p-3 text-slate-300 max-w-[200px] truncate">{leave.reason}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leave.status === "approved" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                      leave.status === "rejected" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>{leave.status}</span>
                  </td>
                  <td className="p-3">
                    {leave.status === "pending" ? (
                      showRemarks === leave.id ? (
                        <div className="space-y-2 min-w-[200px]">
                          <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks (optional)"
                            className="w-full px-2 py-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-white" />
                          <div className="flex gap-1">
                            <button onClick={() => handleAction(leave.id, "approve")} disabled={actionId === leave.id}
                              className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 border border-green-500/30">Approve</button>
                            <button onClick={() => handleAction(leave.id, "reject")} disabled={actionId === leave.id}
                              className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 border border-red-500/30">Reject</button>
                            <button onClick={() => { setShowRemarks(null); setRemarks(""); }}
                              className="px-2 py-1 bg-white/[0.05] text-slate-400 rounded text-xs">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => handleAction(leave.id, "approve")}
                            className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 border border-green-500/30">Approve</button>
                          <button onClick={() => setShowRemarks(leave.id)}
                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 border border-red-500/30">Reject</button>
                        </div>
                      )
                    ) : (
                      leave.adminRemarks && <span className="text-xs text-slate-500">{leave.adminRemarks}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>
    </div>
  );
}
