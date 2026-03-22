import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";
const token = () => localStorage.getItem("admin_token") || localStorage.getItem("token") || "";
const api = axios.create({ baseURL: API });
api.interceptors.request.use((c) => { c.headers.Authorization = `Bearer ${token()}`; return c; });

interface Payment {
  id: number; from_level: string; from_id: number; to_level: string; to_id: number | null;
  amount: number; payment_mode: string; utr_number: string; notes: string; status: string;
  invoice_number: string; from_name: string; to_name: string; created_at: string;
  approved_at: string; receipt_files: string | null;
}
interface Invoice {
  id: number; invoice_number: string; from_level: string; from_name: string;
  to_level: string; to_name: string; amount: number; status: string; payment_status: string;
  payment_mode: string; created_at: string;
}
interface Receipt {
  id: number; payment_id: number; file_url: string; file_name: string; notes: string;
  uploader_name: string; amount: number; invoice_number: string; created_at: string;
}
interface Summary {
  received_from_centers: number; pending_from_centers: number;
  paid_to_university: number; pending_to_university: number;
  total_invoices: number; total_receipts: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800", paid: "bg-blue-100 text-blue-800",
  generated: "bg-gray-100 text-gray-800",
};
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) => { if (!d) return "—"; try { const dt = new Date(d); return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; } };

export default function AdminFeesChain() {
  const [tab, setTab] = useState<"payments" | "invoices" | "receipts" | "university">("payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState<number | null>(null);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, iRes, rRes, sRes] = await Promise.all([
        api.get("/api/fees-chain/payments"), api.get("/api/fees-chain/invoices"),
        api.get("/api/fees-chain/receipts"), api.get("/api/fees-chain/summary"),
      ]);
      setPayments(pRes.data.payments || []);
      setInvoices(iRes.data.invoices || []);
      setReceipts(rRes.data.receipts || []);
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
  const deletePayment = async (id: number) => {
    if (!confirm("Delete this payment and related invoice?")) return;
    try { await api.delete(`/api/fees-chain/payments/${id}`); load(); } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
  };

  const handleUploadReceipts = async () => {
    if (!showUpload || !uploadFiles?.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(uploadFiles).forEach((f) => fd.append("files", f));
    try {
      await api.post(`/api/fees-chain/receipts/${showUpload}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowUpload(null); setUploadFiles(null); load();
    } catch (e: any) { alert(e?.response?.data?.detail || "Upload failed"); }
    setUploading(false);
  };

  const tabs = [
    { key: "payments", label: "Payments", count: payments.length },
    { key: "invoices", label: "Invoices", count: invoices.length },
    { key: "receipts", label: "University Receipts", count: receipts.length },
    { key: "university", label: "Pay University", count: 0 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fees Chain Management</h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Received from Centers</p>
            <p className="text-2xl font-bold">{fmt(summary.received_from_centers)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Pending from Centers</p>
            <p className="text-2xl font-bold">{fmt(summary.pending_from_centers)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Paid to University</p>
            <p className="text-2xl font-bold">{fmt(summary.paid_to_university)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Pending to University</p>
            <p className="text-2xl font-bold">{fmt(summary.pending_to_university)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition ${tab === t.key ? "bg-white text-blue-700 shadow" : "text-gray-600 hover:text-gray-900"}`}>
            {t.label} {t.count > 0 && <span className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}

      {/* ── PAYMENTS TAB ── */}
      {!loading && tab === "payments" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">From</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">To</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Mode</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No payments yet</td></tr>}
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{p.invoice_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.from_name}</div>
                    <div className="text-xs text-gray-500">{p.from_level}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.to_name}</div>
                    <div className="text-xs text-gray-500">{p.to_level}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 capitalize">{p.payment_mode}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || "bg-gray-100"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status === "pending" && (
                        <>
                          <button onClick={() => approvePayment(p.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Approve</button>
                          <button onClick={() => rejectPayment(p.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Reject</button>
                        </>
                      )}
                      {p.to_level === "university" && (
                        <button onClick={() => setShowUpload(p.id)} className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">Upload Receipt</button>
                      )}
                      <button onClick={() => deletePayment(p.id)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── INVOICES TAB ── */}
      {!loading && tab === "invoices" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice #</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">From</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">To</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Payment Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No invoices yet</td></tr>}
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.from_name} <span className="text-xs text-gray-500">({inv.from_level})</span></td>
                  <td className="px-4 py-3">{inv.to_name} <span className="text-xs text-gray-500">({inv.to_level})</span></td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(inv.amount)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || "bg-gray-100"}`}>{inv.status}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.payment_status] || "bg-gray-100"}`}>{inv.payment_status || "—"}</span></td>
                  <td className="px-4 py-3 text-xs">{fmtDate(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── UNIVERSITY RECEIPTS TAB ── */}
      {!loading && tab === "receipts" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">File</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Uploaded By</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receipts.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No receipts uploaded yet</td></tr>}
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.invoice_number}</td>
                  <td className="px-4 py-3 text-blue-600">{r.file_name || "Receipt"}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(r.amount)}</td>
                  <td className="px-4 py-3">{r.uploader_name || "—"}</td>
                  <td className="px-4 py-3 text-xs">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3"><a href={`${API}${r.file_url}`} target="_blank" className="text-blue-600 hover:underline text-xs">View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PAY UNIVERSITY TAB ── */}
      {!loading && tab === "university" && <PayUniversityForm onDone={load} api={api} />}

      {/* ── Upload Receipt Modal ── */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowUpload(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Upload University Receipt(s)</h3>
            <p className="text-sm text-gray-500 mb-4">Upload screenshot(s) or PDF of university payment receipt. Multiple files allowed.</p>
            <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.webp" onChange={(e) => setUploadFiles(e.target.files)}
              className="block w-full border rounded-lg p-2 mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowUpload(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleUploadReceipts} disabled={uploading || !uploadFiles?.length}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pay University sub-component ── */
function PayUniversityForm({ onDone, api }: { onDone: () => void; api: any }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("bank_transfer");
  const [utr, setUtr] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!amount || parseFloat(amount) <= 0) { alert("Enter valid amount"); return; }
    setSaving(true);
    try {
      const res = await api.post("/api/fees-chain/payments", {
        from_level: "admin", from_id: 0, to_level: "university", to_id: null,
        amount: parseFloat(amount), payment_mode: mode, utr_number: utr, notes,
      });
      // Upload receipts if any
      if (files?.length && res.data.id) {
        const fd = new FormData();
        Array.from(files).forEach((f: File) => fd.append("files", f));
        await api.post(`/api/fees-chain/receipts/${res.data.id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      alert(`Payment recorded! Invoice: ${res.data.invoice_number}`);
      setAmount(""); setUtr(""); setNotes(""); setFiles(null);
      onDone();
    } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-lg">
      <h3 className="text-lg font-bold mb-4">Record University Payment</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded-lg p-2" placeholder="Enter amount" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Mode *</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border rounded-lg p-2">
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
            <option value="dd">Demand Draft</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">UTR / Reference Number</label>
          <input type="text" value={utr} onChange={(e) => setUtr(e.target.value)} className="w-full border rounded-lg p-2" placeholder="UTR number" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-lg p-2" rows={2} placeholder="Any notes..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">University Receipt (Screenshot/PDF) - Multiple allowed</label>
          <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.webp" onChange={(e) => setFiles(e.target.files)} className="w-full border rounded-lg p-2" />
        </div>
        <button onClick={submit} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Recording..." : "Record Payment & Upload Receipt"}
        </button>
      </div>
    </div>
  );
}
