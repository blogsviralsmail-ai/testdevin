"use client";

import { useState, useEffect } from "react";

import DataToolbar from "@/components/DataToolbar";
import { exportToCSV, exportToPDF, buildTableHTML } from "@/lib/export-utils";
interface LeaveInfo {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  adminRemarks: string | null;
  createdAt: string;
}

interface HolidayInfo {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string | null;
}

export default function MyLeavesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [leaves, setLeaves] = useState<LeaveInfo[]>([]);
  const [holidays, setHolidays] = useState<HolidayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [tab, setTab] = useState<"leaves" | "holidays">("leaves");
  const [form, setForm] = useState({ leaveType: "casual", startDate: "", endDate: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [lRes, hRes] = await Promise.all([fetch("/api/leave-requests"), fetch("/api/holidays")]);
    if (lRes.ok) setLeaves(await lRes.json());
    if (hRes.ok) setHolidays(await hRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) { alert("Please fill all fields"); return; }
    setSubmitting(true);
    const res = await fetch("/api/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { fetchData(); setShowApply(false); setForm({ leaveType: "casual", startDate: "", endDate: "", reason: "" }); }
    else alert("Failed to apply for leave");
    setSubmitting(false);
  };

  const pendingCount = leaves.filter(l => l.status === "pending").length;
  const approvedCount = leaves.filter(l => l.status === "approved").length;
  const totalLeaveDays = leaves.filter(l => l.status === "approved").reduce((a, b) => a + b.totalDays, 0);
  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date());

  const getFilteredForExport = () => {
    return (leaves || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "My Leaves", [{ key: "leaveType", label: "Type" }, { key: "startDate", label: "Start Date" }, { key: "endDate", label: "End Date" }, { key: "totalDays", label: "Days" }, { key: "reason", label: "Reason" }, { key: "status", label: "Status" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "leaveType", label: "Type" }, { key: "startDate", label: "Start Date" }, { key: "endDate", label: "End Date" }, { key: "totalDays", label: "Days" }, { key: "reason", label: "Reason" }, { key: "status", label: "Status" }];
    exportToPDF("My Leaves", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Leaves & Holidays</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search leaves..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
        <button onClick={() => setShowApply(true)}
          className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm font-medium hover:bg-[#0d96a7] transition-all transform hover:scale-[1.02] shadow-lg">
          Apply for Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: leaves.length, text: "text-blue-400", bg: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30" },
          { label: "Pending", value: pendingCount, text: "text-amber-400", bg: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30" },
          { label: "Approved", value: approvedCount, text: "text-green-400", bg: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30" },
          { label: "Total Leave Days", value: totalLeaveDays, text: "text-purple-400", bg: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} rounded-xl p-4 border ${s.border}`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.text} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("leaves")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "leaves" ? "bg-[#0EA5B8] text-white" : "bg-white/[0.05] text-slate-400 hover:text-white"}`}>
          My Leaves
        </button>
        <button onClick={() => setTab("holidays")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "holidays" ? "bg-[#0EA5B8] text-white" : "bg-white/[0.05] text-slate-400 hover:text-white"}`}>
          Holidays ({upcomingHolidays.length} upcoming)
        </button>
      </div>

      {loading ? <div className="text-center text-slate-500 py-8">Loading...</div> :
      tab === "leaves" ? (
        leaves.length === 0 ? (
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <h3 className="text-lg font-semibold text-white mb-1">No Leave Requests</h3>
            <p className="text-sm text-slate-400 mb-4">You have not applied for any leave yet.</p>
            <button onClick={() => setShowApply(true)} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">Apply Now</button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => (
              <div key={leave.id} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                        leave.leaveType === "sick" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        leave.leaveType === "casual" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                        "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      }`}>{leave.leaveType} Leave</span>
                      <span className="text-xs text-slate-500">{leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-sm text-white mb-1">
                      {new Date(leave.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {leave.totalDays > 1 && ` — ${new Date(leave.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                    <p className="text-xs text-slate-400">{leave.reason}</p>
                    {leave.adminRemarks && <p className="text-xs text-amber-400 mt-1">Admin: {leave.adminRemarks}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                    leave.status === "approved" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                    leave.status === "rejected" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>{leave.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        holidays.length === 0 ? (
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-4xl mb-3">🏖️</p>
            <h3 className="text-lg font-semibold text-white mb-1">No Holidays</h3>
            <p className="text-sm text-slate-400">Holiday calendar will be updated by admin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {holidays.map(h => {
              const d = new Date(h.date);
              const isPast = d < new Date();
              return (
                <div key={h.id} className={`bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 flex items-center gap-4 ${isPast ? "opacity-60" : ""}`}>
                  <div className="w-14 h-14 rounded-xl bg-[#0EA5B8]/20 flex flex-col items-center justify-center border border-[#0EA5B8]/30 shrink-0">
                    <span className="text-xs text-[#0EA5B8] font-medium">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                    <span className="text-lg font-bold text-white">{d.getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{h.title}</p>
                    <p className="text-xs text-slate-500">{d.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    {h.description && <p className="text-xs text-slate-400 mt-0.5">{h.description}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    h.type === "public" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                    h.type === "restricted" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  }`}>{h.type}</span>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Apply Leave Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1420] rounded-2xl border border-white/[0.08] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Apply for Leave</h3>
              <button onClick={() => setShowApply(false)} className="text-slate-400 hover:text-red-400 text-xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Leave Type</label>
                <select value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm">
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Reason</label>
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Explain why you need leave..."
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowApply(false)} className="flex-1 px-4 py-2 bg-white/[0.05] text-slate-300 rounded-lg text-sm hover:bg-white/[0.1]">Cancel</button>
              <button onClick={handleApply} disabled={submitting}
                className="flex-1 px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm font-medium hover:bg-[#0d96a7] disabled:opacity-50">
                {submitting ? "Submitting..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
