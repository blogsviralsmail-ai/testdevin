import { useState, useEffect } from "react";
import api, { getUser } from "../../lib/api";
import { BarChart3, Wallet, TrendingUp } from "lucide-react";

export default function CenterCommission() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const centerId = user?.center?.id;

  useEffect(() => {
    if (!centerId) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/centers/${centerId}/commissions`).catch(() => ({ data: { commissions: [] } })),
      api.get("/api/centers/stats").catch(() => ({ data: {} })),
    ]).then(([commRes, statsRes]) => {
      setCommissions(commRes.data.commissions || commRes.data || []);
      setSummary(statsRes.data || {});
    }).finally(() => setLoading(false));
  }, [centerId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Commission Report</h1>
        <p className="text-sm text-gray-500">Track your commission earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-3 rounded-xl"><Wallet className="h-6 w-6 text-emerald-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Commission</p>
              <p className="text-2xl font-bold text-gray-800">₹{(summary.total_commission || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{(summary.paid_commission || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-xl"><BarChart3 className="h-6 w-6 text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-red-600">₹{(summary.pending_commission || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Commission Details</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">University</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Course</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No commission records yet</td></tr>
            ) : commissions.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.student_name || "-"}</td>
                <td className="px-4 py-3 text-xs">{c.university_name || "-"}</td>
                <td className="px-4 py-3 text-xs">{c.category_name || "-"}</td>
                <td className="px-4 py-3 font-medium text-emerald-600">₹{(c.amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {c.status || "pending"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
