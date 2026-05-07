"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  type: string;
  status: string;
  method: string | null;
  description: string | null;
  createdAt: string;
  enrollment: {
    student: { name: string; email: string };
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
  const [activeTab, setActiveTab] = useState<"payments" | "salaries">("payments");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(async () => {
    const [payRes, salRes] = await Promise.all([
      fetch("/api/payments"),
      fetch("/api/salaries"),
    ]);
    if (payRes.ok) setPayments(await payRes.json());
    if (salRes.ok) setSalaries(await salRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = payments.filter((p) => p.type === "fee" && p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const totalStipend = salaries.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Salary</h1>
          <p className="text-gray-600 text-sm">Track fees, payments, and stipend management</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-600">Stipends Paid</p>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalStipend)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-600">Pending Salaries</p>
          <p className="text-2xl font-bold text-yellow-600">{salaries.filter((s) => s.status === "pending").length}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("payments")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "payments" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
            Fee Payments
          </button>
          <button onClick={() => setActiveTab("salaries")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "salaries" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
            Stipend/Salary
          </button>
        </div>
        <div className="flex-1 min-w-[200px]">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, program..."
            className="w-full px-4 py-2 border rounded-lg text-sm text-gray-900" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm text-gray-900">
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {activeTab === "payments" ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">💰</p>
              <p className="text-gray-600">No payment records yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Program</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.enrollment.student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.enrollment.batch.program.title}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">{p.type}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(p.status)}`}>{p.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {salaries.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">💸</p>
              <p className="text-gray-600">No salary records yet. Salaries are auto-calculated based on attendance for stipend programs.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Month</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Attendance</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.enrollment.student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.month}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.attendanceDays}/{s.totalDays} days</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(s.amount)}</td>
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
