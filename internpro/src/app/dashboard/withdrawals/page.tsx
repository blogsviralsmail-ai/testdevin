"use client";
import { useState, useEffect } from "react";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: string;
  method: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  upiId: string | null;
  remarks: string | null;
  adminRemarks: string | null;
  processedAt: string | null;
  createdAt: string;
  user?: { name: string; email: string };
}

interface WalletData {
  balance: number;
  totalEarnings: number;
  transactions: { id: string; type: string; amount: number; balance: number; description: string; createdAt: string }[];
  withdrawals: WithdrawalRequest[];
}

export default function WithdrawalsPage() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [remarks, setRemarks] = useState("");
  const [processModal, setProcessModal] = useState<WithdrawalRequest | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user || d));
    fetchData();
  }, []);

  const fetchData = async () => {
    const [wRes, walletRes] = await Promise.all([
      fetch("/api/withdrawals").then(r => r.json()),
      fetch("/api/wallet").then(r => r.json()),
    ]);
    setWithdrawals(Array.isArray(wRes) ? wRes : []);
    setWallet(walletRes);
    setLoading(false);
  };

  const handleRequest = async () => {
    if (!amount || parseFloat(amount) <= 0) return alert("Enter valid amount");
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(amount), method, remarks }),
    });
    if (res.ok) {
      setShowRequest(false);
      setAmount("");
      setRemarks("");
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "Failed");
    }
  };

  const handleProcess = async (status: string) => {
    if (!processModal) return;
    const res = await fetch("/api/withdrawals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: processModal.id, status, adminRemarks }),
    });
    if (res.ok) {
      setProcessModal(null);
      setAdminRemarks("");
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "Failed");
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const filtered = filter === "all" ? withdrawals : withdrawals.filter(w => w.status === filter);

  if (loading) return <div className="p-6 text-slate-300">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
          <p className="text-slate-400 text-sm">{isAdmin ? "Manage withdrawal requests" : "Request withdrawal from your wallet"}</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowRequest(true)}
            className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2]">
            + Request Withdrawal
          </button>
        )}
      </div>

      {/* Wallet Summary for non-admin */}
      {!isAdmin && wallet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">Wallet Balance</p>
            <p className="text-2xl font-bold">₹{wallet.balance.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">Total Earnings</p>
            <p className="text-2xl font-bold">₹{wallet.totalEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">Total Withdrawn</p>
            <p className="text-2xl font-bold">₹{withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + w.amount, 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filter === f ? "bg-[#0EA5B8] text-white border-[#0EA5B8]" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"}`}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({f === "all" ? withdrawals.length : withdrawals.filter(w => w.status === f).length})
          </button>
        ))}
      </div>

      {/* Withdrawal Requests List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center">
          <div className="text-5xl mb-4">💸</div>
          <h3 className="text-lg font-semibold text-slate-300">No Withdrawal Requests</h3>
          <p className="text-slate-500 mt-2">{isAdmin ? "No withdrawal requests to process." : "Click 'Request Withdrawal' to withdraw from your wallet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => (
            <div key={w.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5">
              <div className="flex items-center justify-between">
                <div>
                  {isAdmin && w.user && <p className="text-white font-semibold">{w.user.name} <span className="text-xs text-slate-500">({w.user.email})</span></p>}
                  <p className="text-2xl font-bold text-white">₹{w.amount.toLocaleString()}</p>
                  <div className="flex gap-3 mt-1 text-xs text-slate-500">
                    <span>{w.method === "upi" ? "UPI" : "Bank Transfer"}</span>
                    {w.bankName && <span>{w.bankName}</span>}
                    {w.upiId && <span>UPI: {w.upiId}</span>}
                    <span>📅 {new Date(w.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  {w.remarks && <p className="text-xs text-slate-400 mt-1">Note: {w.remarks}</p>}
                  {w.adminRemarks && <p className="text-xs text-amber-400 mt-1">Admin: {w.adminRemarks}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    w.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                    w.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                  </span>
                  {isAdmin && w.status === "pending" && (
                    <button onClick={() => { setProcessModal(w); setAdminRemarks(""); }}
                      className="px-3 py-1.5 bg-[#0EA5B8] text-white rounded-lg text-xs hover:bg-[#0891b2]">
                      Process
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wallet Statement */}
      {!isAdmin && wallet && wallet.transactions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Wallet Statement</h2>
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-xs">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {wallet.transactions.map(t => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="p-3 text-slate-400 text-xs">{new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${t.type === "referral_commission" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {t.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 text-xs">{t.description || "—"}</td>
                    <td className={`p-3 text-right font-medium ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {t.amount >= 0 ? "+" : ""}₹{Math.abs(t.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-white font-medium">₹{t.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Withdrawal Modal */}
      {showRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRequest(false)}>
          <div className="rounded-xl p-6 w-full max-w-md" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Request Withdrawal</h2>
            <p className="text-xs text-slate-500 mb-4">Available Balance: <span className="text-emerald-400 font-bold">₹{wallet?.balance.toLocaleString()}</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="Enter amount" max={wallet?.balance} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Remarks (optional)</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRequest(false)} className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg text-sm">Cancel</button>
              <button onClick={handleRequest} className="flex-1 px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm font-medium">Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Process Modal (Admin) */}
      {processModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProcessModal(null)}>
          <div className="rounded-xl p-6 w-full max-w-md" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Process Withdrawal</h2>
            <div className="space-y-2 text-sm mb-4">
              {processModal.user && <p className="text-white"><span className="text-slate-500">Requester:</span> {processModal.user.name}</p>}
              <p className="text-white"><span className="text-slate-500">Amount:</span> ₹{processModal.amount.toLocaleString()}</p>
              <p className="text-white"><span className="text-slate-500">Method:</span> {processModal.method === "upi" ? "UPI" : "Bank Transfer"}</p>
              {processModal.bankName && <p className="text-white"><span className="text-slate-500">Bank:</span> {processModal.bankName}</p>}
              {processModal.accountNumber && <p className="text-white"><span className="text-slate-500">A/C:</span> {processModal.accountNumber}</p>}
              {processModal.ifscCode && <p className="text-white"><span className="text-slate-500">IFSC:</span> {processModal.ifscCode}</p>}
              {processModal.upiId && <p className="text-white"><span className="text-slate-500">UPI ID:</span> {processModal.upiId}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">Admin Remarks</label>
              <textarea value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-white" rows={2} placeholder="Optional remarks..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setProcessModal(null)} className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg text-sm">Cancel</button>
              <button onClick={() => handleProcess("rejected")} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Reject</button>
              <button onClick={() => handleProcess("approved")} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">Approve & Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
