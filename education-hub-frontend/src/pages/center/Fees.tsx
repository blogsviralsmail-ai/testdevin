import { useState, useEffect, useCallback } from "react";
import api, { getUser } from "../../lib/api";
import { Search, Plus, X, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function CenterFees() {
  const [tab, setTab] = useState<"students" | "requests">("students");
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [payNote, setPayNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<any>(null);
  // Payment requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqFilter, setReqFilter] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const user = getUser();
  const centerId = user?.center?.id;

  const fetchStudents = useCallback(() => {
    if (!centerId) return;
    setLoading(true);
    api.get(`/api/centers/${centerId}/students`, { params: { search, limit: 100 } })
      .then(r => setStudents(r.data.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [centerId, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchRequests = useCallback(() => {
    setReqLoading(true);
    const params: any = {};
    if (reqFilter) params.status = reqFilter;
    api.get("/api/centers/my/fee-payments", { params })
      .then(r => setRequests(r.data.payments || []))
      .catch(() => setRequests([]))
      .finally(() => setReqLoading(false));
  }, [reqFilter]);

  useEffect(() => { if (tab === "requests") fetchRequests(); }, [tab, fetchRequests]);

  const fetchPayments = (studentId: number) => {
    api.get(`/api/centers/my/students/${studentId}/fees`)
      .then(r => setPayments(r.data.center_payments || []))
      .catch(() => setPayments([]));
  };

  const handlePay = async () => {
    if (!showPay || !payAmount) return;
    setSaving(true);
    try {
      await api.post(`/api/accounts/student/${showPay.id}/payment`, {
        amount: parseFloat(payAmount),
        payment_mode: payMode,
        notes: payNote,
      });
      setShowPay(null);
      setPayAmount("");
      setPayNote("");
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Payment failed");
    } finally {
      setSaving(false);
    }
  };

  const viewHistory = (s: any) => {
    setShowHistory(s);
    fetchPayments(s.id);
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Approve this payment?")) return;
    try {
      await api.put(`/api/centers/my/fee-payments/${id}/approve`);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Approval failed");
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await api.put(`/api/centers/my/fee-payments/${rejectId}/reject`, { reason: rejectReason });
      setRejectId(null);
      setRejectReason("");
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Rejection failed");
    }
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</span>;
    if (status === "rejected") return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</span>;
    return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fees Management</h1>
        <p className="text-sm text-gray-500">Manage student fee payments and approve payment requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 max-w-md">
        <button onClick={() => setTab("students")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "students" ? "bg-white shadow text-emerald-700" : "text-gray-600 hover:text-gray-800"}`}>
          Student Fees
        </button>
        <button onClick={() => setTab("requests")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "requests" ? "bg-white shadow text-emerald-700" : "text-gray-600 hover:text-gray-800"}`}>
          Payment Requests
        </button>
      </div>

      {tab === "students" && (
        <>
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Enrollment</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">University</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Total Fees</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Paid</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Balance</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students found</td></tr>
                ) : students.map(s => {
                  const total = s.total_fees || 0;
                  const paid = s.deposit || 0;
                  const balance = total - paid;
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{s.enrollment_no}</td>
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">{s.phone}</td>
                      <td className="px-4 py-3 text-xs">{s.university_name || "-"}</td>
                      <td className="px-4 py-3 font-medium">₹{total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">₹{paid.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${balance > 0 ? "text-red-600" : "text-green-600"}`}>₹{balance.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {balance > 0 && (
                            <button onClick={() => setShowPay(s)} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Pay
                            </button>
                          )}
                          <button onClick={() => viewHistory(s)} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "requests" && (
        <>
          {/* Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Filter:</span>
              {["", "pending", "approved", "rejected"].map(f => (
                <button key={f} onClick={() => setReqFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${reqFilter === f ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {f || "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Requests Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mode</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">UTR/Ref</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reqLoading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No payment requests found</td></tr>
                ) : requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.student_name}</td>
                    <td className="px-4 py-3 text-xs">{r.student_phone}</td>
                    <td className="px-4 py-3 font-medium text-green-600">₹{(r.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs uppercase">{r.payment_mode}</td>
                    <td className="px-4 py-3 text-xs font-mono">{r.utr_number || "-"}</td>
                    <td className="px-4 py-3 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {r.proof_url && (
                          <button onClick={() => setProofUrl(r.proof_url)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 flex items-center gap-1">
                            <Eye className="h-3 w-3" /> Proof
                          </button>
                        )}
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => handleApprove(r.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                              Approve
                            </button>
                            <button onClick={() => { setRejectId(r.id); setRejectReason(""); }} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === "rejected" && r.rejection_reason && (
                          <span className="text-xs text-red-500 italic">Reason: {r.rejection_reason}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pay Modal */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Record Payment</h2>
              <button onClick={() => setShowPay(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Student: <strong>{showPay.name}</strong> | Balance: <strong className="text-red-600">₹{((showPay.total_fees || 0) - (showPay.deposit || 0)).toLocaleString()}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount"
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select value={payMode} onChange={e => setPayMode(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Optional notes"
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPay(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handlePay} disabled={saving || !payAmount}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700">
                {saving ? "Processing..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Payment History - {showHistory.name}</h2>
              <button onClick={() => setShowHistory(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {payments.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No payments recorded</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-600">₹{(p.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{p.payment_mode} | {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</p>
                      {p.remarks && <p className="text-xs text-gray-400 mt-0.5">{p.remarks}</p>}
                    </div>
                    <div className="text-right">{statusBadge(p.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Reject Payment</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..." rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {proofUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setProofUrl(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Payment Proof</h2>
              <button onClick={() => setProofUrl(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <img src={proofUrl.startsWith("/") ? API_URL + proofUrl : proofUrl} alt="Payment Proof" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
