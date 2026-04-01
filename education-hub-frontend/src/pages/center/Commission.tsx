import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { TrendingUp, Wallet, ArrowUpDown, Search, Download, Users, IndianRupee } from "lucide-react";

export default function CenterCommission() {
  const [deals, setDeals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"summary" | "subcenters" | "all">("summary");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchDeals = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    api.get("/api/centers/deals", { params })
      .then(r => {
        let data = r.data.deals || [];
        data.sort((a: any, b: any) => {
          let va = a[sortBy], vb = b[sortBy];
          if (va == null) va = "";
          if (vb == null) vb = "";
          if (typeof va === "number" && typeof vb === "number") return sortOrder === "asc" ? va - vb : vb - va;
          return sortOrder === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
        setDeals(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, sortBy, sortOrder]);

  const fetchSummary = useCallback(() => {
    api.get("/api/centers/deals/summary").then(r => setSummary(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const fmt = (n: number) => "\u20B9" + ((n || 0).toLocaleString("en-IN"));
  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("desc"); }
  };

  const isSubCenter = summary?.level === "sub_center";

  // Separate own deals vs sub-center deals
  const ownDeals = deals.filter(d => d.center_level === "center" || !d.parent_center_name);
  const scDeals = deals.filter(d => d.center_level === "sub_center" && d.parent_center_name);

  // Group deals by sub-center for the breakdown tab (like admin groups by center)
  const subCenterBreakdown = (() => {
    const map: Record<string, { center_id: number; name: string; level: string; students: number; total_sc_fee: number; total_center_deal: number }> = {};
    deals.forEach((d: any) => {
      const key = d.center_name || "Direct";
      const cid = d.center_id || 0;
      if (!map[key]) map[key] = { center_id: cid, name: key, level: d.center_level || "center", students: 0, total_sc_fee: 0, total_center_deal: 0 };
      map[key].students += 1;
      map[key].total_sc_fee += (d.sub_center_fee || 0);
      map[key].total_center_deal += (d.center_deal || 0);
    });
    return Object.values(map);
  })();

  const totalStudentFees = deals.reduce((s, d) => s + (d.sub_center_fee || 0), 0);
  const totalCenterDeal = deals.reduce((s, d) => s + (d.center_deal || 0), 0);
  const totalProfit = totalStudentFees - totalCenterDeal;

  const ownTotalFees = ownDeals.reduce((s, d) => s + (d.sub_center_fee || 0), 0);
  const ownTotalDeal = ownDeals.reduce((s, d) => s + (d.center_deal || 0), 0);
  const ownProfit = ownTotalFees - ownTotalDeal;

  const scTotalFees = scDeals.reduce((s, d) => s + (d.sub_center_fee || 0), 0);
  const scTotalDeal = scDeals.reduce((s, d) => s + (d.center_deal || 0), 0);
  const scProfit = scTotalFees - scTotalDeal;

  const handleCSV = () => {
    const headers = ["Student", "Mobile", "Center", "Sub Center", "Counselor", "Adm. Date", "University", "Course", "Student Fee", "Center Deal", "Profit"];
    const rows = deals.map(d => [
      d.student_name, d.student_phone || "", d.parent_center_name || d.center_name || "Direct",
      d.center_name || "Direct", d.counselor_name || "", d.admission_date || "",
      d.university_name || "", d.course_name || "",
      d.sub_center_fee || 0, d.center_deal || 0,
      (d.sub_center_fee || 0) - (d.center_deal || 0),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "commission_report.csv"; a.click();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deal Fees & Commission</h1>
          <p className="text-sm text-gray-500">
            {isSubCenter ? "View your deal fees and profit" : "Track deal fees, profits, and sub-center performance"}
          </p>
        </div>
        <button onClick={handleCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm font-medium">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTab("summary")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "summary" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          Summary & Profits
        </button>
        {!isSubCenter && (
          <button onClick={() => setTab("subcenters")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "subcenters" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
            Sub-center Breakdown
          </button>
        )}
        <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          All Deals ({deals.length})
        </button>
      </div>

      {/* ========== Summary & Profits Tab ========== */}
      {tab === "summary" && (<>
        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl"><Users className="h-6 w-6 text-blue-600" /></div>
              <div><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold text-gray-800">{summary?.total_students || deals.length}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-emerald-100 p-3 rounded-xl"><IndianRupee className="h-6 w-6 text-emerald-600" /></div>
              <div><p className="text-sm text-gray-500">Total Student Fees</p><p className="text-2xl font-bold text-emerald-600">{fmt(totalStudentFees)}</p></div>
            </div>
          </div>
          {!isSubCenter && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-xl"><Wallet className="h-6 w-6 text-purple-600" /></div>
                <div><p className="text-sm text-gray-500">Total Center Deal</p><p className="text-2xl font-bold text-purple-600">{fmt(totalCenterDeal)}</p></div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-yellow-600" /></div>
              <div><p className="text-sm text-gray-500">{isSubCenter ? "Your Profit" : "Total Profit"}</p><p className="text-2xl font-bold text-yellow-600">{fmt(totalProfit)}</p></div>
            </div>
          </div>
        </div>

        {/* Profit breakdown cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-6">
            <p className="text-sm opacity-80">Own Student Profit</p>
            <p className="text-3xl font-bold mt-1">{fmt(ownProfit)}</p>
            <p className="text-xs opacity-60 mt-1">{ownDeals.length} students | Fees - Deals</p>
          </div>
          {!isSubCenter && (
            <>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                <p className="text-sm opacity-80">From Sub-centers (Center Deal)</p>
                <p className="text-3xl font-bold mt-1">{fmt(scTotalDeal)}</p>
                <p className="text-xs opacity-60 mt-1">{scDeals.length} students from sub-centers</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
                <p className="text-sm opacity-80">Sub-center Profit</p>
                <p className="text-3xl font-bold mt-1">{fmt(scProfit)}</p>
                <p className="text-xs opacity-60 mt-1">SC Fees - SC Center Deals</p>
              </div>
            </>
          )}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
            <p className="text-sm opacity-80">Center Pending</p>
            <p className="text-3xl font-bold mt-1">{fmt(summary?.center_pending || totalCenterDeal)}</p>
            <p className="text-xs opacity-60 mt-1">Received: {fmt(summary?.center_received || 0)}</p>
          </div>
        </div>

        {/* Sub-center breakdown table (like admin's center breakdown) */}
        {!isSubCenter && subCenterBreakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto mb-6">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Center-wise Breakdown</h2>
              <p className="text-xs text-gray-500 mt-0.5">Performance of each center/sub-center</p>
            </div>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Center / Sub-center</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Students</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Student Fee</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Center Deal</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Profit</th>
                </tr>
              </thead>
              <tbody>
                {subCenterBreakdown.map((sc, i) => {
                  const profit = sc.total_sc_fee - sc.total_center_deal;
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{sc.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.level === "sub_center" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                          {sc.level === "sub_center" ? "Sub-center" : "Own"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{sc.students}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{fmt(sc.total_sc_fee)}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-medium">{fmt(sc.total_center_deal)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(profit)}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-center">{deals.length}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{fmt(totalStudentFees)}</td>
                  <td className="px-4 py-3 text-right text-blue-700">{fmt(totalCenterDeal)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`${totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt(totalProfit)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h3 className="font-semibold text-blue-800 mb-3">How Deal Fee Tracking Works</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Student Fee (SC Fee):</strong> The amount charged to the student. Student sees this.</p>
            <p><strong>Center Deal:</strong> The amount you owe to admin/upward. Only you and admin see this.</p>
            <p><strong>Your Profit:</strong> Student Fee minus Center Deal.</p>
            {!isSubCenter && (
              <>
                <p className="pt-2 border-t border-blue-200"><strong>Sub-center students:</strong> Sub-centers set their own Student Fee. The Center Deal they set is what they owe you.</p>
                <p><strong>Example:</strong> Sub-center charges student {"\u20B9"}50,000, their center deal is {"\u20B9"}40,000 {"\u2192"} Sub-center profit {"\u20B9"}10,000, you receive {"\u20B9"}40,000.</p>
              </>
            )}
          </div>
        </div>
      </>)}

      {/* ========== Sub-center Breakdown Tab ========== */}
      {tab === "subcenters" && !isSubCenter && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Sub-center Wise Breakdown</h2>
            <p className="text-xs text-gray-500 mt-0.5">Performance of each sub-center under you</p>
          </div>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sub-center</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Students</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Student Fee</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Center Deal</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Profit</th>
              </tr>
            </thead>
            <tbody>
              {subCenterBreakdown.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No sub-center data yet</td></tr>
              ) : subCenterBreakdown.map((sc, i) => {
                const profit = sc.total_sc_fee - sc.total_center_deal;
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{sc.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.level === "sub_center" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {sc.level === "sub_center" ? "Sub-center" : "Own"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{sc.students}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{fmt(sc.total_sc_fee)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-medium">{fmt(sc.total_center_deal)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(profit)}</span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-center">{deals.length}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{fmt(totalStudentFees)}</td>
                <td className="px-4 py-3 text-right text-blue-700">{fmt(totalCenterDeal)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`${totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt(totalProfit)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ========== All Deals Tab ========== */}
      {tab === "all" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search student name, mobile..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full max-w-md" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("student_name")}>Student {sortBy === "student_name" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mobile</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Center</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Sub Center</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Counselor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("admission_date")}>Adm. Date {sortBy === "admission_date" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Univ / Course</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("sub_center_fee")}>Student Fee {sortBy === "sub_center_fee" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                  {!isSubCenter && (
                    <>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("center_deal")}>Center Deal {sortBy === "center_deal" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Profit</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isSubCenter ? 8 : 10} className="text-center py-8 text-gray-400">Loading...</td></tr>
                ) : deals.length === 0 ? (
                  <tr><td colSpan={isSubCenter ? 8 : 10} className="text-center py-8 text-gray-400">No deals yet.</td></tr>
                ) : deals.map(d => {
                  const profit = (d.sub_center_fee || 0) - (d.center_deal || 0);
                  const admDate = d.admission_date ? new Date(d.admission_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "\u2014";
                  return (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{d.student_name}</td>
                      <td className="px-4 py-3 text-gray-600">{d.student_phone || "\u2014"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{d.parent_center_name || d.center_name || "Direct"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{d.center_level === "sub_center" ? (d.center_name || "Sub-center") : (d.center_name || "Direct")}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{d.counselor_name || "\u2014"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{admDate}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{d.university_name || "-"}<br />{d.course_name || ""}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmt(d.sub_center_fee)}</td>
                      {!isSubCenter && (
                        <>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">{fmt(d.center_deal)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-medium ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(profit)}</span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {deals.length > 0 && (
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-4 py-3" colSpan={7}>Total ({deals.length} students)</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{fmt(totalStudentFees)}</td>
                    {!isSubCenter && (
                      <>
                        <td className="px-4 py-3 text-right text-blue-700">{fmt(totalCenterDeal)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`${totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt(totalProfit)}</span>
                        </td>
                      </>
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
