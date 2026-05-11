"use client";

import { useState, useEffect } from "react";

import DataToolbar from "@/components/DataToolbar";
import { exportToCSV, exportToPDF, buildTableHTML } from "@/lib/export-utils";
interface SalaryRecord {
  id: string;
  enrollmentId: string;
  month: string;
  amount: number;
  attendanceDays: number;
  totalDays: number;
  status: string;
  paidAt: string | null;
  enrollment: {
    student: { id: string; name: string; email: string; phone: string | null; employeeId: string | null };
    batch: { name: string; program: { title: string; stipendAmount: number } };
  };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function SalaryManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [generating, setGenerating] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<SalaryRecord | null>(null);
  const [payMethod, setPayMethod] = useState("manual");
  const [payRef, setPayRef] = useState("");

  const fetchSalaries = async () => {
    setLoading(true);
    const res = await fetch(`/api/salary-management?month=${selectedMonth}`);
    if (res.ok) setSalaries(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchSalaries(); }, [selectedMonth]);

  const handleGenerate = async () => {
    setGenerating(true);
    const res = await fetch(`/api/salary-management?action=generate&month=${selectedMonth}`);
    if (res.ok) { const data = await res.json(); alert(`Generated ${data.generated} salary records`); fetchSalaries(); }
    else alert("Failed to generate salaries");
    setGenerating(false);
  };

  const handlePay = async () => {
    if (!payModal) return;
    setPaying(payModal.id);
    const res = await fetch("/api/salary-management", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salaryId: payModal.id, paymentMethod: payMethod, paymentRef: payRef }),
    });
    if (res.ok) { fetchSalaries(); setPayModal(null); setPayRef(""); }
    else alert("Payment failed");
    setPaying(null);
  };

  const totalPending = salaries.filter(s => s.status === "pending").reduce((a, b) => a + b.amount, 0);
  const totalPaid = salaries.filter(s => s.status === "paid").reduce((a, b) => a + b.amount, 0);
  const [y, m] = selectedMonth.split("-");
  const monthLabel = `${MONTHS[parseInt(m) - 1]} ${y}`;

  const getFilteredForExport = () => {
    return (salaries || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "Salary Management", [{ key: "employeeName", label: "Employee" }, { key: "program", label: "Program" }, { key: "attendanceDays", label: "Days Present" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "employeeName", label: "Employee" }, { key: "program", label: "Program" }, { key: "attendanceDays", label: "Days Present" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }];
    exportToPDF("Salary Management", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Salary Management</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search employees..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
        <div className="flex items-center gap-3">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm" />
          <button onClick={handleGenerate} disabled={generating}
            className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm font-medium hover:bg-[#0d96a7] disabled:opacity-50 transition-all transform hover:scale-[1.02] shadow-lg">
            {generating ? "Generating..." : "Auto Generate Salaries"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: salaries.length, color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30", text: "text-blue-400" },
          { label: "Total Payable", value: `₹${(totalPending + totalPaid).toLocaleString()}`, color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30", text: "text-purple-400" },
          { label: "Paid", value: `₹${totalPaid.toLocaleString()}`, color: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30", text: "text-green-400" },
          { label: "Pending", value: `₹${totalPending.toLocaleString()}`, color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30", text: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 border ${s.border}`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.text} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Salary Table */}
      <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-semibold text-white">Salaries — {monthLabel}</h2>
        </div>
        {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
        salaries.length === 0 ? <div className="p-8 text-center text-slate-500">No salary records for {monthLabel}. Click &quot;Auto Generate Salaries&quot; to create them.</div> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr className="text-left text-slate-400">
                <th className="p-3">Employee</th>
                <th className="p-3">Program</th>
                <th className="p-3">Stipend</th>
                <th className="p-3">Days Present</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map(sal => (
                <tr key={sal.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div className="font-medium text-white">{sal.enrollment?.student?.name || "—"}</div>
                    <div className="text-xs text-slate-500">{sal.enrollment?.student?.employeeId || sal.enrollment?.student?.email}</div>
                  </td>
                  <td className="p-3 text-slate-300">{sal.enrollment?.batch?.program?.title || "—"}</td>
                  <td className="p-3 text-slate-300">₹{sal.enrollment?.batch?.program?.stipendAmount?.toLocaleString() || 0}/mo</td>
                  <td className="p-3 text-slate-300">{sal.attendanceDays}/{sal.totalDays}</td>
                  <td className="p-3 font-semibold text-white">₹{sal.amount.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sal.status === "paid" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                      "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>{sal.status === "paid" ? "Paid" : "Pending"}</span>
                  </td>
                  <td className="p-3">
                    {sal.status === "pending" && (
                      <button onClick={() => { setPayModal(sal); setPayMethod("manual"); setPayRef(""); }}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-all">
                        Pay Now
                      </button>
                    )}
                    {sal.status === "paid" && sal.paidAt && (
                      <span className="text-xs text-slate-500">Paid {new Date(sal.paidAt).toLocaleDateString()}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1420] rounded-2xl border border-white/[0.08] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Pay Salary</h3>
              <button onClick={() => setPayModal(null)} className="text-slate-400 hover:text-red-400 text-xl">&times;</button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                <p className="text-xs text-slate-500">Employee</p>
                <p className="font-semibold text-white">{payModal.enrollment?.student?.name}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                <p className="text-xs text-slate-500">Amount</p>
                <p className="text-2xl font-bold text-green-400">₹{payModal.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Payment Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm">
                  <option value="manual">Manual / Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="razorpay_payout">Razorpay Payout</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Reference / Transaction ID (optional)</label>
                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. UTR number, Transaction ID"
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPayModal(null)} className="flex-1 px-4 py-2 bg-white/[0.05] text-slate-300 rounded-lg text-sm hover:bg-white/[0.1]">Cancel</button>
              <button onClick={handlePay} disabled={paying === payModal.id}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50">
                {paying === payModal.id ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
