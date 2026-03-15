import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { BarChart3, TrendingUp, Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function CenterCommission() {
  const [summary, setSummary] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [hierarchyReport, setHierarchyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "ledger" | "subcenters">("overview");

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/api/centers/commission/ledger/summary").catch(() => ({ data: {} })),
      api.get("/api/centers/commission/ledger").catch(() => ({ data: { ledger: [] } })),
      api.get("/api/centers/commission/hierarchy-report").catch(() => ({ data: {} })),
    ]).then(([sumRes, ledRes, hierRes]) => {
      setSummary(sumRes.data);
      setLedger(ledRes.data.ledger || []);
      setHierarchyReport(hierRes.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  const isSubCenter = summary?.level === "sub_center";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Commission Report</h1>
        <p className="text-sm text-gray-500">
          {isSubCenter ? "Track commissions you owe to Center and Admin" : "Track your commission earnings and payables"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Earnings from sub-centers (only for centers, not sub-centers) */}
        {!isSubCenter && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-emerald-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Earnings from Sub-centers</p>
                <p className="text-2xl font-bold text-emerald-600">{"\u20B9"}{(summary?.earnings_from_subcenters?.total || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Pending: {"\u20B9"}{(summary?.earnings_from_subcenters?.pending || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payable to Admin */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-xl"><ArrowUpRight className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Payable to Admin</p>
              <p className="text-2xl font-bold text-blue-600">{"\u20B9"}{(summary?.payable_to_admin?.total || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">Paid: {"\u20B9"}{(summary?.payable_to_admin?.paid || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Payable to Parent Center (sub-center only) */}
        {isSubCenter && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-xl"><ArrowDownRight className="h-6 w-6 text-orange-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Payable to Parent Center</p>
                <p className="text-2xl font-bold text-orange-600">{"\u20B9"}{(summary?.payable_to_parent_center?.total || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Paid: {"\u20B9"}{(summary?.payable_to_parent_center?.paid || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-xl"><BarChart3 className="h-6 w-6 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Pending Admin Commission</p>
              <p className="text-2xl font-bold text-yellow-600">{"\u20B9"}{(summary?.payable_to_admin?.pending || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-xl"><Building2 className="h-6 w-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Center Name</p>
              <p className="text-lg font-bold text-gray-800">{summary?.center_name || "-"}</p>
              <p className="text-xs text-gray-400">{isSubCenter ? "Sub-center" : "Center"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("overview")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "overview" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          Overview
        </button>
        <button onClick={() => setTab("ledger")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "ledger" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          Commission Ledger
        </button>
        {!isSubCenter && (
          <button onClick={() => setTab("subcenters")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "subcenters" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
            Sub-center Commission
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Commission Hierarchy Flow</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">{isSubCenter ? "Your Commission Flow" : "How Commission Works"}</h3>
              <div className="text-sm text-blue-700 space-y-2">
                {isSubCenter ? (
                  <>
                    <p>{"1."} When you add a student, commission is auto-calculated.</p>
                    <p>{"2."} You owe commission to your Parent Center (per their slab rate).</p>
                    <p>{"3."} You also owe commission to Admin (per admin slab rate).</p>
                    <p>{"4."} Both are tracked in the Commission Ledger below.</p>
                  </>
                ) : (
                  <>
                    <p>{"1."} When your sub-centers add students, they owe commission to you.</p>
                    <p>{"2."} When you or your sub-centers add students, commission is owed to Admin.</p>
                    <p>{"3."} All flows are tracked in the Commission Ledger.</p>
                    <p>{"4."} Check the Sub-center Commission tab to see what each sub-center owes you.</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Total Ledger Entries</p>
                <p className="text-xl font-bold text-gray-800">{ledger.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Own Students</p>
                <p className="text-xl font-bold text-gray-800">{hierarchyReport?.center?.student_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Tab */}
      {tab === "ledger" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">All Commission Entries</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">University</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">To</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No commission entries yet. Add students to auto-generate commission records.</td></tr>
              ) : ledger.map((entry: any) => (
                <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{entry.student_name || "-"}<br /><span className="text-xs text-gray-400">{entry.enrollment_no || ""}</span></td>
                  <td className="px-4 py-3 text-xs">{entry.university_name || "-"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${entry.from_entity_type === "sub_center" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                      {entry.from_center_name || entry.from_entity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${entry.to_entity_type === "admin" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>
                      {entry.to_entity_type === "admin" ? "Admin" : entry.to_center_name || "Center"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-600">{"\u20B9"}{(entry.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {entry.status || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{entry.created_at ? new Date(entry.created_at).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-center Commission Tab */}
      {tab === "subcenters" && !isSubCenter && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Sub-center Commission Details</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sub-center</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Students</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Commission to You</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Paid to You</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Commission to Admin</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Paid to Admin</th>
              </tr>
            </thead>
            <tbody>
              {(!hierarchyReport?.sub_centers || hierarchyReport.sub_centers.length === 0) ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No sub-centers found</td></tr>
              ) : hierarchyReport.sub_centers.map((sc: any) => (
                <tr key={sc.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{sc.name}</td>
                  <td className="px-4 py-3">{sc.student_count}</td>
                  <td className="px-4 py-3 font-medium text-emerald-600">{"\u20B9"}{(sc.commission_to_center || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">{"\u20B9"}{(sc.paid_to_center || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-600">{"\u20B9"}{(sc.commission_to_admin || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">{"\u20B9"}{(sc.paid_to_admin || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
