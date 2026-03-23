import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";
const token = () => localStorage.getItem("center_token") || localStorage.getItem("token") || "";
const api = axios.create({ baseURL: API });
api.interceptors.request.use((c) => { c.headers.Authorization = `Bearer ${token()}`; return c; });

interface Payment {
  id: number; from_level: string; from_id: number; to_level: string; to_id: number | null;
  amount: number; payment_mode: string; utr_number: string; notes: string; status: string;
  invoice_number: string; from_name: string; to_name: string; created_at: string;
}
interface Invoice {
  id: number; invoice_number: string; from_name: string; to_name: string;
  from_level: string; to_level: string; amount: number; status: string;
  payment_status: string; created_at: string;
}
interface Summary {
  level: string; center_id: number; center_name: string;
  received_from_sub_centers: number; pending_from_sub_centers: number;
  paid_to_parent: number; pending_to_parent: number; total_invoices: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800", paid: "bg-blue-100 text-blue-800",
};
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) => { if (!d) return "—"; try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; } };

export default function CenterFeesChain() {
  const [tab, setTab] = useState<"overview" | "pay" | "incoming" | "invoices">("overview");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, iRes, sRes] = await Promise.all([
        api.get("/api/fees-chain/payments"), api.get("/api/fees-chain/invoices"),
        api.get("/api/fees-chain/summary"),
      ]);
      setPayments(pRes.data.payments || []);
      setInvoices(iRes.data.invoices || []);
      setSummary(sRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approvePayment = async (id: number) => {
    if (!confirm("Approve this payment?")) return;
    try { await api.put(`/api/fees-chain/payments/${id}/approve`); load(); } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
  };
  const rejectPayment = async (id: number) => {
    const reason = prompt("Rejection reason:");
    if (reason === null) return;
    try { await api.put(`/api/fees-chain/payments/${id}/reject`, { reason }); load(); } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
  };

  const isCenter = summary?.level === "center";
  const parentLabel = isCenter ? "Admin" : "Center";

  const incomingPayments = payments.filter((p) => {
    if (!summary) return false;
    return (p.to_level === summary.level && p.to_id === summary.center_id);
  });
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fees Chain</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isCenter && (
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <p className="text-sm opacity-80">Received from Sub-centers</p>
              <p className="text-2xl font-bold">{fmt(summary.received_from_sub_centers)}</p>
            </div>
          )}
          {isCenter && (
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
              <p className="text-sm opacity-80">Pending from Sub-centers</p>
              <p className="text-2xl font-bold">{fmt(summary.pending_from_sub_centers)}</p>
            </div>
          )}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Paid to {parentLabel}</p>
            <p className="text-2xl font-bold">{fmt(summary.paid_to_parent)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Pending to {parentLabel}</p>
            <p className="text-2xl font-bold">{fmt(summary.pending_to_parent)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        <button onClick={() => setTab("overview")} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${tab === "overview" ? "bg-white text-blue-700 shadow" : "text-gray-600"}`}>Overview</button>
        <button onClick={() => setTab("pay")} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${tab === "pay" ? "bg-white text-blue-700 shadow" : "text-gray-600"}`}>Pay {parentLabel}</button>
        {isCenter && <button onClick={() => setTab("incoming")} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${tab === "incoming" ? "bg-white text-blue-700 shadow" : "text-gray-600"}`}>Incoming from Sub-centers</button>}
        <button onClick={() => setTab("invoices")} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${tab === "invoices" ? "bg-white text-blue-700 shadow" : "text-gray-600"}`}>Invoices</button>
      </div>

      {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}

      {/* ── OVERVIEW ── */}
      {!loading && tab === "overview" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">All Payments</h3>
          <PaymentTable payments={payments} onApprove={approvePayment} onReject={rejectPayment} showActions={isCenter} />
        </div>
      )}

      {/* ── PAY PARENT ── */}
      {!loading && tab === "pay" && summary && (
        <PayParentForm level={summary.level} centerId={summary.center_id} parentLabel={parentLabel} api={api} onDone={load} />
      )}

      {/* ── INCOMING FROM SUB-CENTERS ── */}
      {!loading && tab === "incoming" && isCenter && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Payments from Sub-centers</h3>
          <PaymentTable payments={incomingPayments} onApprove={approvePayment} onReject={rejectPayment} showActions={true} />
        </div>
      )}

      {/* ── INVOICES ── */}
      {!loading && tab === "invoices" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Invoice #</th>
                <th className="px-4 py-3 text-left">From</th>
                <th className="px-4 py-3 text-left">To</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No invoices</td></tr>}
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.from_name}</td>
                  <td className="px-4 py-3">{inv.to_name}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(inv.amount)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || "bg-gray-100"}`}>{inv.status}</span></td>
                  <td className="px-4 py-3 text-xs">{fmtDate(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentTable({ payments, onApprove, onReject, showActions }: { payments: Payment[]; onApprove: (id: number) => void; onReject: (id: number) => void; showActions: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Invoice</th>
            <th className="px-4 py-3 text-left">From</th>
            <th className="px-4 py-3 text-left">To</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-left">Mode</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Date</th>
            {showActions && <th className="px-4 py-3 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {payments.length === 0 && <tr><td colSpan={showActions ? 8 : 7} className="text-center py-8 text-gray-400">No payments</td></tr>}
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-blue-600">{p.invoice_number}</td>
              <td className="px-4 py-3">{p.from_name} <span className="text-xs text-gray-400">({p.from_level})</span></td>
              <td className="px-4 py-3">{p.to_name} <span className="text-xs text-gray-400">({p.to_level})</span></td>
              <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(p.amount)}</td>
              <td className="px-4 py-3 capitalize">{p.payment_mode}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || "bg-gray-100"}`}>{p.status}</span></td>
              <td className="px-4 py-3 text-xs">{fmtDate(p.created_at)}</td>
              {showActions && (
                <td className="px-4 py-3">
                  {p.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => onApprove(p.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Approve</button>
                      <button onClick={() => onReject(p.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Reject</button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayParentForm({ level, centerId, parentLabel, api, onDone }: { level: string; centerId: number; parentLabel: string; api: any; onDone: () => void }) {
  const [studentPhone, setStudentPhone] = useState("");
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("bank_transfer");
  const [utr, setUtr] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Student phone lookup with debounce
  useEffect(() => {
    if (studentPhone.length < 3) { setSearchResults([]); return; }
    if (studentInfo) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/api/fees-chain/student-lookup?phone=${studentPhone}`);
        setSearchResults(res.data.students || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [studentPhone, studentInfo]);

  const selectStudent = (s: any) => { setStudentInfo(s); setStudentPhone(s.phone); setSearchResults([]); };
  const clearStudent = () => { setStudentInfo(null); setStudentPhone(""); setSearchResults([]); };

  const submit = async () => {
    if (!amount || parseFloat(amount) <= 0) { alert("Enter valid amount"); return; }
    if (!studentPhone) { alert("Please enter student mobile number"); return; }
    if (!proofFile) { alert("Please upload payment proof (screenshot/PDF)"); return; }
    setSaving(true);
    const toLevel = level === "center" ? "admin" : "center";
    try {
      const res = await api.post("/api/fees-chain/payments", {
        from_level: level, from_id: centerId,
        to_level: toLevel, to_id: level === "sub_center" ? null : null,
        amount: parseFloat(amount), payment_mode: mode, utr_number: utr, notes,
        student_phone: studentPhone,
        student_name: studentInfo?.name || "",
        student_university: studentInfo?.university_name || "",
        student_course: studentInfo?.course_name || "",
      });
      // Upload proof
      if (proofFile && res.data.id) {
        const fd = new FormData();
        fd.append("files", proofFile);
        await api.post(`/api/fees-chain/receipts/${res.data.id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      alert(`Payment submitted! Invoice: ${res.data.invoice_number}\nWaiting for ${parentLabel} approval.`);
      setAmount(""); setUtr(""); setNotes(""); setProofFile(null); clearStudent();
      onDone();
    } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
      <h3 className="text-lg font-bold mb-4">Submit Fees to {parentLabel}</h3>
      <p className="text-sm text-gray-500 mb-4">Submit your collected fees to {parentLabel} with proof. {parentLabel} will approve after verification.</p>
      <div className="space-y-4">
        {/* Student Mobile Number Lookup */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Student Mobile Number *</label>
          <div className="flex gap-2">
            <input type="text" value={studentPhone}
              onChange={(e) => { setStudentPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (studentInfo) setStudentInfo(null); }}
              className="flex-1 border rounded-lg p-2" placeholder="Enter student mobile number..." maxLength={10} />
            {studentInfo && <button onClick={clearStudent} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200">Clear</button>}
          </div>
          {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
          {searchResults.length > 0 && !studentInfo && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((s: any) => (
                <button key={s.id} onClick={() => selectStudent(s)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.phone} | {s.university_name || 'No University'} | {s.course_name || 'No Course'}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Student Info Card */}
        {studentInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-600 text-lg">&#10003;</span>
              <span className="font-bold text-green-800">{studentInfo.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
              <div>Mobile: <span className="font-medium">{studentInfo.phone}</span></div>
              <div>University: <span className="font-medium text-blue-600">{studentInfo.university_name || '—'}</span></div>
              <div>Course: <span className="font-medium text-blue-600">{studentInfo.course_name || '—'}</span></div>
              {studentInfo.total_fees > 0 && <div>Total Fees: <span className="font-medium text-green-700">{fmt(studentInfo.total_fees)}</span></div>}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded-lg p-2" placeholder="Enter amount" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border rounded-lg p-2">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">UTR / Reference</label>
          <input type="text" value={utr} onChange={(e) => setUtr(e.target.value)} className="w-full border rounded-lg p-2" placeholder="UTR or transaction ID" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Proof (Screenshot/PDF) *</label>
          <input type="file" accept=".png,.jpg,.jpeg,.pdf,.webp" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="w-full border rounded-lg p-2" />
          {proofFile && <p className="text-xs text-green-600 mt-1">Selected: {proofFile.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-lg p-2" rows={2} placeholder="Any notes..." />
        </div>
        <button onClick={submit} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Submitting..." : `Submit Payment to ${parentLabel} (Pending Approval)`}
        </button>
      </div>
    </div>
  );
}
