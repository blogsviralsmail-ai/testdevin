import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { Search, Edit2, X, TrendingUp, Users, IndianRupee, Wallet, ArrowUpDown, Download, RefreshCw, AlertTriangle, Calendar } from "lucide-react";

export default function CenterDealFees() {
  const [deals, setDeals] = useState<any[]>([]);
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editDeal, setEditDeal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ sub_center_fee: "", center_deal: "", notes: "", admission_date: "", counselor_name: "" });
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterNotUpdated, setFilterNotUpdated] = useState(false);
  const [filterAdmDateFrom, setFilterAdmDateFrom] = useState("");
  const [filterAdmDateTo, setFilterAdmDateTo] = useState("");
  const [filterCounselor, setFilterCounselor] = useState("");

  const fetchDeals = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    api.get("/api/centers/deals", { params })
      .then(r => {
        const raw = r.data.deals || [];
        setAllDeals(raw);
        let data = [...raw];
        if (filterNotUpdated) data = data.filter((d: any) => !d.center_deal || d.center_deal === 0);
        if (filterAdmDateFrom) data = data.filter((d: any) => d.admission_date && d.admission_date >= filterAdmDateFrom);
        if (filterAdmDateTo) data = data.filter((d: any) => d.admission_date && d.admission_date <= filterAdmDateTo);
        if (filterCounselor) data = data.filter((d: any) => (d.counselor_name || "").toLowerCase().includes(filterCounselor.toLowerCase()));
        data.sort((a: any, b: any) => {
          let va = a[sortBy], vb = b[sortBy];
          if (va == null) va = ""; if (vb == null) vb = "";
          if (typeof va === "number" && typeof vb === "number") return sortOrder === "asc" ? va - vb : vb - va;
          return sortOrder === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
        setDeals(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filterNotUpdated, filterAdmDateFrom, filterAdmDateTo, filterCounselor, sortBy, sortOrder]);

  const fetchSummary = useCallback(() => {
    api.get("/api/centers/deals/summary").then(r => setSummary(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const openEdit = (deal: any) => {
    setEditDeal(deal);
    setEditForm({
      sub_center_fee: String(deal.sub_center_fee || 0),
      center_deal: String(deal.center_deal || 0),
      notes: deal.notes || "",
      admission_date: deal.admission_date || "",
      counselor_name: deal.counselor_name || "",
    });
  };

  const handleSave = async () => {
    if (!editDeal) return;
    setSaving(true);
    try {
      await api.put(`/api/centers/deals/${editDeal.id}/center-update`, {
        sub_center_fee: parseFloat(editForm.sub_center_fee) || 0,
        center_deal: parseFloat(editForm.center_deal) || 0,
        notes: editForm.notes,
        admission_date: editForm.admission_date,
        counselor_name: editForm.counselor_name,
      });
      setEditDeal(null);
      fetchDeals();
      fetchSummary();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error updating deal");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => "\u20B9" + ((n || 0).toLocaleString("en-IN"));
  const formatDate = (d: string) => {
    if (!d) return "\u2014";
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
  };
  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("desc"); }
  };
  const handleCSV = () => {
    const headers = ["Student","Mobile","Center","Sub Center","Counselor","Adm. Date","University","Course","Student Fee","Center Deal","Profit","Notes"];
    const rows = deals.map(d => [
      d.student_name, d.student_phone || "", d.parent_center_name || d.center_name || "Direct",
      d.center_name || "Direct", d.counselor_name || "", d.admission_date || "",
      d.university_name || "", d.course_name || "",
      d.sub_center_fee || 0, d.center_deal || 0,
      (d.sub_center_fee || 0) - (d.center_deal || 0), d.notes || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "center_deal_fees.csv"; a.click();
  };

  const isSubCenter = summary?.level === "sub_center";
  const notUpdatedCount = allDeals.filter(d => !d.center_deal || d.center_deal === 0).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deal Fees</h1>
          <p className="text-sm text-gray-500">
            {isSubCenter
              ? "View fee deals for your students"
              : "View and manage fee deals for your students and sub-center students"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm font-medium">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl"><Users className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-800">{summary.total_students || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-emerald-100 p-3 rounded-xl"><IndianRupee className="h-6 w-6 text-emerald-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Student Fees</p>
                <p className="text-2xl font-bold text-emerald-600">{fmt(summary.total_sub_center_fee)}</p>
              </div>
            </div>
          </div>
          {!isSubCenter && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-xl"><Wallet className="h-6 w-6 text-purple-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Total Center Deal</p>
                    <p className="text-2xl font-bold text-purple-600">{fmt(summary.total_center_deal)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-yellow-100 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-yellow-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Pending from Sub-centers</p>
                    <p className="text-2xl font-bold text-yellow-600">{fmt((summary.total_center_deal || 0) - (summary.center_received || 0))}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search student name, mobile..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full" />
          </div>
          <input type="text" placeholder="Counselor filter..." value={filterCounselor} onChange={e => setFilterCounselor(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-36" />
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input type="date" value={filterAdmDateFrom} onChange={e => setFilterAdmDateFrom(e.target.value)} className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" title="Adm. date from" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={filterAdmDateTo} onChange={e => setFilterAdmDateTo(e.target.value)} className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" title="Adm. date to" />
          </div>
          {!isSubCenter && (
            <button onClick={() => setFilterNotUpdated(!filterNotUpdated)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${filterNotUpdated ? "bg-amber-100 border-amber-300 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              <AlertTriangle className="h-3.5 w-3.5" /> Not Updated ({notUpdatedCount})
            </button>
          )}
          <button onClick={() => { setSearch(""); setFilterCounselor(""); setFilterAdmDateFrom(""); setFilterAdmDateTo(""); setFilterNotUpdated(false); }} className="p-2 text-gray-400 hover:text-gray-600" title="Clear filters">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("student_name")}>Student {sortBy === "student_name" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mobile</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Center</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Sub Center</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("counselor_name")}>Counselor {sortBy === "counselor_name" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("admission_date")}>Adm. Date {sortBy === "admission_date" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Univ / Course</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("sub_center_fee")}>Student Fee {sortBy === "sub_center_fee" && <ArrowUpDown className="inline h-3 w-3" />}</th>
              {!isSubCenter && (
                <>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort("center_deal")}>Center Deal {sortBy === "center_deal" && <ArrowUpDown className="inline h-3 w-3" />}</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Profit</th>
                </>
              )}
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Notes</th>
              {!isSubCenter && (
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isSubCenter ? 9 : 12} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : deals.length === 0 ? (
              <tr><td colSpan={isSubCenter ? 9 : 12} className="text-center py-8 text-gray-400">No deal records found.</td></tr>
            ) : deals.map(d => {
              const profit = (d.sub_center_fee || 0) - (d.center_deal || 0);
              const notUpdated = !isSubCenter && (!d.center_deal || d.center_deal === 0);
              return (
                <tr key={d.id} className={`border-b border-gray-50 hover:bg-gray-50 ${notUpdated ? "bg-amber-50 border-l-4 border-l-amber-400" : ""}`}>
                  <td className="px-4 py-3 font-medium">{d.student_name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.student_phone || "\u2014"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{d.parent_center_name || d.center_name || "Direct"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{d.center_name || "Direct"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.counselor_name || "\u2014"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDate(d.admission_date)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.university_name || "-"}<br />{d.course_name || ""}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmt(d.sub_center_fee)}</td>
                  {!isSubCenter && (
                    <>
                      <td className={`px-4 py-3 text-right font-medium ${notUpdated ? "text-amber-600" : "text-blue-600"}`}>
                        {notUpdated ? <span className="flex items-center justify-end gap-1"><AlertTriangle className="h-3 w-3" /> Not set</span> : fmt(d.center_deal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(profit)}</span>
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate" title={d.notes}>{d.notes || "-"}</td>
                  {!isSubCenter && (
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(d)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Edit deal">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Edit Deal Fees</h2>
              <button onClick={() => setEditDeal(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{editDeal.student_name}</p>
                <p className="text-xs text-gray-500">{editDeal.student_phone} | {editDeal.center_name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Fee ({"\u20B9"})</label>
                  <input
                    type="number"
                    value={editForm.sub_center_fee}
                    onChange={e => setEditForm({ ...editForm, sub_center_fee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="50000"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">What student pays</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center Deal ({"\u20B9"})</label>
                  <input
                    type="number"
                    value={editForm.center_deal}
                    onChange={e => setEditForm({ ...editForm, center_deal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="40000"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Amount you owe upward</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                  <input type="date" value={editForm.admission_date} onChange={e => setEditForm({ ...editForm, admission_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Counselor Name</label>
                  <input type="text" value={editForm.counselor_name} onChange={e => setEditForm({ ...editForm, counselor_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Counselor name" />
                </div>
              </div>

              {(editForm.sub_center_fee || editForm.center_deal) && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-700 mb-1">Your Profit</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt((parseFloat(editForm.sub_center_fee) || 0) - (parseFloat(editForm.center_deal) || 0))}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Optional notes..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditDeal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Update Deal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
