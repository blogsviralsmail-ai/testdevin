import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { Search, Edit2, X, TrendingUp, Users, IndianRupee, Wallet } from "lucide-react";

export default function CenterDealFees() {
  const [deals, setDeals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editDeal, setEditDeal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ sub_center_fee: "", center_deal: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchDeals = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    api.get("/api/centers/deals", { params })
      .then(r => setDeals(r.data.deals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

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

  const isSubCenter = summary?.level === "sub_center";

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
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl"><Users className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-800">{summary.total_students || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-xl"><Wallet className="h-6 w-6 text-purple-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Total Center Deal</p>
                    <p className="text-2xl font-bold text-purple-600">{fmt(summary.total_center_deal)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3">
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

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mobile</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Center</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Sub Center</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">University / Course</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Student Fee</th>
              {!isSubCenter && (
                <>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Center Deal</th>
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
              <tr><td colSpan={isSubCenter ? 7 : 10} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : deals.length === 0 ? (
              <tr><td colSpan={isSubCenter ? 7 : 10} className="text-center py-8 text-gray-400">No deal records. Deals are auto-created when students are admitted.</td></tr>
            ) : deals.map(d => {
              const profit = (d.sub_center_fee || 0) - (d.center_deal || 0);
              return (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{d.student_name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.student_phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{d.parent_center_name || d.center_name || "Direct"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{d.center_name || "Direct"}</span>
                  </td>
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
                  <td className="px-4 py-3 text-xs text-gray-500">{d.notes || "-"}</td>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Edit Deal Fees</h2>
              <button onClick={() => setEditDeal(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{editDeal.student_name}</p>
                <p className="text-xs text-gray-500">{editDeal.enrollment_no} | {editDeal.center_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              {(editForm.sub_center_fee || editForm.center_deal) && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-700 mb-1">Your Profit</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt((parseFloat(editForm.sub_center_fee) || 0) - (parseFloat(editForm.center_deal) || 0))}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Optional notes..."
                />
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
