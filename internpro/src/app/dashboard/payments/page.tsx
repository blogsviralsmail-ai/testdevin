"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

import DataToolbar from "@/components/DataToolbar";
import { serverExportCSV, serverExportPDF } from "@/lib/export-utils";
interface Payment {
  id: string;
  amount: number;
  type: string;
  status: string;
  method: string | null;
  paymentId: string | null;
  description: string | null;
  createdAt: string;
  enrollment: {
    id: string;
    feeType: string | null;
    feeAmount: number | null;
    paymentStatus: string;
    student: { name: string; email: string; phone: string | null };
    batch: { program: { title: string } };
  };
}

interface Salary {
  id: string;
  month: string;
  amount: number;
  attendanceDays: number;
  totalDays: number;
  status: string;
  enrollment: {
    student: { name: string; email: string };
    batch: { program: { title: string; stipendAmount: number } };
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [activeTab, setActiveTab] = useState<"payments" | "pending" | "salaries">("payments");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const [payRes, salRes] = await Promise.all([
      fetch("/api/payments"),
      fetch("/api/salaries"),
    ]);
    if (payRes.ok) setPayments(await payRes.json());
    if (salRes.ok) setSalaries(await salRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pendingPayments = payments.filter(p => p.status === "pending_approval");
  const completedPayments = payments.filter(p => p.status === "completed");
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalStipend = salaries.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.amount, 0);

  const handleApproval = async (paymentId: string, action: "approve" | "reject") => {
    setActionLoading(paymentId);
    try {
      const res = await fetch("/api/student-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });
      if (res.ok) {
        fetchData();
        alert(action === "approve" ? "Payment approved! Offer letter generated." : "Payment rejected.");
      } else {
        const d = await res.json();
        alert(d.error || "Failed");
      }
    } catch {
      alert("Network error");
    }
    setActionLoading(null);
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch = !searchQuery || 
      p.enrollment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.enrollment.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.enrollment.batch.program.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExportCSV = () => serverExportCSV("payments");

  const handleExportPDF = () => serverExportPDF("payments", "Payments");

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === payments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(payments.map((item: { id: string }) => item.id)));
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} payments?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_payments", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments & Salary</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search payments..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
          <p className="text-slate-400 text-sm">Track fees, payments, and stipend management</p>
        </div>
        <button onClick={() => { window.open('/api/export?type=payments&format=csv', '_blank'); }} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-green-700">📥 Export CSV</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border border-white/[0.06]">
          <p className="text-sm text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border border-white/[0.06]">
          <p className="text-sm text-slate-400">Total Payments</p>
          <p className="text-2xl font-bold text-white">{completedPayments.length}</p>
        </div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-700">Pending Approvals</p>
          <p className="text-2xl font-bold text-amber-600">{pendingPayments.length}</p>
        </div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border border-white/[0.06]">
          <p className="text-sm text-slate-400">Stipends Paid</p>
          <p className="text-2xl font-bold text-[#22d3ee]">{formatCurrency(totalStipend)}</p>
        </div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border border-white/[0.06]">
          <p className="text-sm text-slate-400">Pending Salaries</p>
          <p className="text-2xl font-bold text-amber-400">{salaries.filter((s) => s.status === "pending").length}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("payments")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "payments" ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400"}`}>
            Fee Payments
          </button>
          <button onClick={() => setActiveTab("pending")} className={`px-4 py-2 rounded-lg text-sm font-medium transition relative ${activeTab === "pending" ? "bg-amber-500 text-white" : "bg-transparent text-slate-400"}`}>
            Pending Approvals
            {pendingPayments.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{pendingPayments.length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab("salaries")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "salaries" ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400"}`}>
            Stipend/Salary
          </button>
        </div>
        <div className="flex-1 min-w-[200px]">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, program..."
            className="w-full px-4 py-2 border rounded-lg text-sm text-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm text-white">
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {activeTab === "pending" ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          {pendingPayments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">✅</p>
              <p className="text-slate-400">No pending approvals. All payments are up to date!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {pendingPayments.map(p => (
                <div key={p.id} className="p-5 hover:bg-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💵</span>
                        <div>
                          <p className="font-semibold text-white">{p.enrollment.student.name}</p>
                          <p className="text-sm text-slate-500">{p.enrollment.student.email} {p.enrollment.student.phone && `• ${p.enrollment.student.phone}`}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-slate-400 ml-10">
                        <span>📚 {p.enrollment.batch.program.title}</span>
                        <span>💰 {formatCurrency(p.amount)}</span>
                        <span>📅 {formatDate(p.createdAt)}</span>
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs capitalize">{p.method} payment</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApproval(p.id, "approve")}
                        disabled={actionLoading === p.id}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {actionLoading === p.id ? "..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => handleApproval(p.id, "reject")}
                        disabled={actionLoading === p.id}
                        className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 transition disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "payments" ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          {selectedIds.size > 0 && (
            <div className="m-4 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
              <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">{bulkDeleting ? "Deleting..." : "Delete Selected"}</button>
              <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
            </div>
          )}
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">💰</p>
              <p className="text-slate-400">No payment records yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-transparent">
                <tr>
                  <th className="p-3 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredPayments.length} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" /></th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Program</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Method</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-transparent">
                    <td className="p-3 w-10"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" /></td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{p.enrollment.student.name}</p>
                      <p className="text-xs text-slate-500">{p.enrollment.student.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{p.enrollment.batch.program.title}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4"><span className="text-xs bg-transparent text-slate-300 px-2 py-1 rounded capitalize">{p.method || "—"}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(p.status)}`}>{p.status}</span></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          {salaries.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">💸</p>
              <p className="text-slate-400">No salary records yet. Salaries are auto-calculated based on attendance for stipend programs.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-transparent">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Month</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Attendance</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-transparent">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{s.enrollment.student.name}</p>
                      <p className="text-xs text-slate-500">{s.enrollment.student.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{s.month}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{s.attendanceDays}/{s.totalDays} days</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{formatCurrency(s.amount)}</td>
                    <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(s.status)}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
