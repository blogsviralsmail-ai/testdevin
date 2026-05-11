"use client";
import { useState, useEffect } from "react";

import DataToolbar from "@/components/DataToolbar";
import { serverExportCSV, serverExportPDF } from "@/lib/export-utils";
interface Enrollment { id: string; status: string; preferredMode?: string; feeType?: string; feeAmount?: number; stipendAmount?: number; batch?: { name: string; program?: { title: string } } }
interface ReferralStudent { id?: string; name: string; email: string; phone?: string; collegeName?: string; degree?: string; state?: string; enrollments?: Enrollment[] }
interface Referral { id: string; status: string; commission: number; amount: number; createdAt: string; student?: ReferralStudent }
interface Agent { id: string; userId: string; referralCode: string; commissionRate: number; totalEarnings: number; walletBalance: number; bankName?: string; accountNumber?: string; ifscCode?: string; upiId?: string; isActive: boolean; user: { id: string; name: string; email: string; phone?: string; avatar?: string }; referrals: Referral[]; payouts: { id: string; amount: number; status: string; method: string; createdAt: string }[]; }

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPayout, setShowPayout] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", commissionRate: "30", bankName: "", accountNumber: "", ifscCode: "", upiId: "" });
  const [payoutAmount, setPayoutAmount] = useState("");
  const [refData, setRefData] = useState<{ referralCode: string | null; walletBalance: number; totalEarnings: number; commissionRate: number; referrals: Referral[] } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user || d));
    fetchAgents();
  }, []);

  const fetchAgents = async () => { const r = await fetch("/api/agents"); if (r.ok) { const data = await r.json(); setAgents(Array.isArray(data) ? data : [data]); } };

  const createAgent = async () => {
    const r = await fetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, commissionRate: parseFloat(form.commissionRate) }) });
    if (r.ok) { setShowCreate(false); setForm({ name: "", email: "", phone: "", password: "", commissionRate: "30", bankName: "", accountNumber: "", ifscCode: "", upiId: "" }); fetchAgents(); }
    else { const err = await r.json(); alert(err.error); }
  };

  const processPayout = async () => {
    if (!showPayout || !payoutAmount) return;
    const r = await fetch("/api/agents/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: showPayout, amount: parseFloat(payoutAmount), method: "manual" }) });
    if (r.ok) { setShowPayout(null); setPayoutAmount(""); fetchAgents(); }
    else { const err = await r.json(); alert(err.error); }
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isAgent = user?.role === "agent";
  const isStudent = user?.role === "student";

  const handleExportCSV = () => serverExportCSV("agents");

  const handleExportPDF = () => serverExportPDF("agents", "Agents");

  // Fetch student referral data
  useEffect(() => {
    if (user?.role === "student") {
      fetch("/api/referral").then(r => r.json()).then(d => setRefData(d)).catch(() => {});
    }
  }, [user]);

  // Student Refer & Earn View
  if (isStudent) {
    const generateCode = async () => {
      setGenerating(true);
      const r = await fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (r.ok) {
        const d = await r.json();
        setRefData(prev => prev ? { ...prev, referralCode: d.referralCode } : { referralCode: d.referralCode, walletBalance: 0, totalEarnings: 0, commissionRate: 30, referrals: [] });
      }
      setGenerating(false);
    };

    const refLink = refData?.referralCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${refData.referralCode}` : "";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🎁 Refer & Earn</h1>
          <p className="text-slate-400 text-sm mt-1">Share your referral link and earn {refData?.commissionRate || 30}% commission on every successful referral!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 text-white" style={{background: 'linear-gradient(135deg, #0EA5B8, #06b6d4)'}}>
            <p className="text-sm opacity-80">Wallet Balance</p>
            <p className="text-2xl font-bold">₹{(refData?.walletBalance || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-5 text-white" style={{background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)'}}>
            <p className="text-sm opacity-80">Total Earnings</p>
            <p className="text-2xl font-bold">₹{(refData?.totalEarnings || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-5 text-white" style={{background: 'linear-gradient(135deg, #f59e0b, #fbbf24)'}}>
            <p className="text-sm opacity-80">Total Referrals</p>
            <p className="text-2xl font-bold">{refData?.referrals?.length || 0}</p>
          </div>
        </div>

        {!refData?.referralCode ? (
          <div className="rounded-xl p-8 text-center" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-5xl mb-4">🔗</div>
            <h2 className="text-lg font-bold text-white mb-2">Generate Your Referral Code</h2>
            <p className="text-slate-400 text-sm mb-4">Get your unique referral link to share with friends and earn {refData?.commissionRate || 30}% commission!</p>
            <button onClick={generateCode} disabled={generating} className="px-6 py-3 bg-[#0EA5B8] text-white rounded-xl font-medium hover:bg-[#0891b2] disabled:opacity-50">
              {generating ? "Generating..." : "Generate Referral Code"}
            </button>
          </div>
        ) : (
          <div className="rounded-xl p-5" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
            <h2 className="font-semibold mb-3 text-white">📎 Your Referral Link</h2>
            <div className="flex gap-2">
              <input readOnly value={refLink} className="flex-1 px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white" />
              <button onClick={() => { navigator.clipboard.writeText(refLink); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${refCopied ? 'bg-emerald-500 text-white' : 'bg-[#0EA5B8] text-white hover:bg-[#0891b2]'}`}>
                {refCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-2">Share this link — when someone registers and pays, you earn {refData?.commissionRate || 30}% commission!</p>
          </div>
        )}

        {(refData?.referrals?.length || 0) > 0 && (
          <div className="rounded-xl overflow-hidden" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="font-semibold text-white">My Referrals ({refData?.referrals?.length || 0})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs text-slate-400">#</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-400">Program</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-400">Commission</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-400">Date</th>
                </tr></thead>
                <tbody>
                  {(refData?.referrals || []).map((r, idx) => (
                    <tr key={r.id} className="border-b border-white/[0.04]">
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-white">{r.student?.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{r.student?.email || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{r.student?.enrollments?.[0]?.batch?.program?.title || "—"}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "converted" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{r.status}</span></td>
                      <td className="px-4 py-3 text-emerald-400">₹{r.commission.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="rounded-xl p-5" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
          <h3 className="font-semibold text-white mb-3">💡 How it works</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p>1. Generate your unique referral link above</p>
            <p>2. Share it with friends who want to join an internship</p>
            <p>3. When they register using your link and their payment is confirmed</p>
            <p>4. You earn <span className="text-emerald-400 font-medium">{refData?.commissionRate || 30}%</span> commission automatically</p>
            <p>5. Withdraw your earnings anytime from the <a href="/dashboard/withdrawals" className="text-[#0EA5B8] hover:underline">Withdrawals</a> page</p>
          </div>
        </div>
      </div>
    );
  }

  // Agent Panel View
  if (isAgent && agents.length === 1) {
    const agent = agents[0];
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Agent Dashboard</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search agents..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">Total Earnings</p>
            <p className="text-2xl font-bold">₹{agent.totalEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">Wallet Balance</p>
            <p className="text-2xl font-bold">₹{agent.walletBalance.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">Total Referrals</p>
            <p className="text-2xl font-bold">{agent.referrals?.length || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">Commission Rate</p>
            <p className="text-2xl font-bold">{agent.commissionRate}%</p>
          </div>
        </div>

        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border">
          <h2 className="font-semibold mb-2">Your Referral Link</h2>
          <div className="flex gap-2">
            <input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${agent.referralCode}`} className="flex-1 px-3 py-2 bg-transparent border rounded-lg text-sm" />
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=${agent.referralCode}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${copied ? 'bg-emerald-500 text-white scale-105 shadow-none' : 'bg-[#0EA5B8] text-white hover:bg-[#0891b2]'}`}>
              {copied ? (<span className="flex items-center gap-1"><svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</span>) : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">My Referred Students ({(agent.referrals || []).length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-transparent">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">College</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Fee Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Current Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Referral Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(agent.referrals || []).length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-500">No referrals yet. Share your referral link to get started!</td></tr>
                ) : (agent.referrals || []).map((r, idx) => {
                  const enrollment = r.student?.enrollments?.[0];
                  const statusColor = r.status === "converted" ? "bg-emerald-500/10 text-green-800" : r.status === "selected" ? "bg-blue-500/10 text-blue-800" : r.status === "rejected" ? "bg-red-500/10 text-red-800" : "bg-amber-500/10 text-yellow-800";
                  const enrollStatus = enrollment?.status || "applied";
                  const enrollStatusColor = enrollStatus === "selected" || enrollStatus === "active" ? "bg-emerald-500/10 text-green-800" : enrollStatus === "rejected" ? "bg-red-500/10 text-red-800" : enrollStatus === "interview_scheduled" ? "bg-purple-500/10 text-purple-800" : enrollStatus === "shortlisted" ? "bg-amber-500/10 text-yellow-800" : "bg-transparent text-slate-400";
                  return (
                    <tr key={r.id} className="hover:bg-transparent">
                      <td className="px-4 py-3 text-sm text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white">{r.student?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{r.student?.email || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{r.student?.phone || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{r.student?.collegeName || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{enrollment?.batch?.program?.title || "—"}</td>
                      <td className="px-4 py-3 text-sm"><span className="capitalize">{enrollment?.preferredMode || "—"}</span></td>
                      <td className="px-4 py-3 text-sm"><span className="capitalize">{enrollment?.feeType || "—"}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${enrollStatusColor}`}>
                          {enrollStatus === "interview_scheduled" ? "Interview" : enrollStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">{r.commission > 0 ? <span className="text-emerald-400">₹{r.commission.toLocaleString()}</span> : <span className="text-slate-500">₹0</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-semibold">Payout History</h2></div>
          <table className="w-full">
            <thead className="bg-transparent"><tr><th className="px-4 py-2 text-left text-xs">Date</th><th className="px-4 py-2 text-left text-xs">Method</th><th className="px-4 py-2 text-left text-xs">Status</th><th className="px-4 py-2 text-right text-xs">Amount</th></tr></thead>
            <tbody className="divide-y">
              {(agent.payouts || []).map(p => (
                <tr key={p.id}><td className="px-4 py-3 text-sm">{new Date(p.createdAt).toLocaleDateString()}</td><td className="px-4 py-3 text-sm">{p.method}</td><td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">{p.status}</span></td><td className="px-4 py-3 text-right text-sm font-medium">₹{p.amount}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Management</h1>
          <p className="text-sm text-slate-500">Manage referral agents and commissions</p>
        </div>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">+ Add Agent</button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border"><p className="text-sm text-slate-500">Total Agents</p><p className="text-2xl font-bold">{agents.length}</p></div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border"><p className="text-sm text-slate-500">Total Referrals</p><p className="text-2xl font-bold">{agents.reduce((s, a) => s + (a.referrals?.length || 0), 0)}</p></div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border"><p className="text-sm text-slate-500">Total Payouts</p><p className="text-2xl font-bold">₹{agents.reduce((s, a) => s + a.totalEarnings, 0).toLocaleString()}</p></div>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 border"><p className="text-sm text-slate-500">Pending Payouts</p><p className="text-2xl font-bold">₹{agents.reduce((s, a) => s + a.walletBalance, 0).toLocaleString()}</p></div>
      </div>

      {/* Agent List */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border overflow-hidden">
        <table className="w-full">
          <thead className="bg-transparent">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Code</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Referrals</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Earnings</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Balance</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {agents.map(agent => (
              <tr key={agent.id}>
                <td className="px-4 py-3"><div><p className="text-sm font-medium">{agent.user.name}</p><p className="text-xs text-slate-500">{agent.user.email}</p></div></td>
                <td className="px-4 py-3 text-sm font-mono text-[#22d3ee]">{agent.referralCode}</td>
                <td className="px-4 py-3 text-center text-sm">{agent.referrals?.length || 0}</td>
                <td className="px-4 py-3 text-right text-sm font-medium">₹{agent.totalEarnings.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm font-medium text-emerald-400">₹{agent.walletBalance.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setSelectedAgent(agent)} className="text-xs text-[#22d3ee] hover:underline">View</button>
                    <button onClick={() => { setShowPayout(agent.id); setPayoutAmount(""); }} className="text-xs text-emerald-400 hover:underline">Payout</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Agent Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-lg" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h2 className="text-lg font-bold mb-4">Add Agent</h2>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Commission Rate (%)" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" type="number" />
              <input placeholder="Bank Name" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Account Number" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="IFSC Code" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="UPI ID" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400">Cancel</button>
              <button onClick={createAgent} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg">Create Agent</button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-sm" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h2 className="text-lg font-bold mb-4">Process Payout</h2>
            <input placeholder="Amount (₹)" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg" type="number" />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPayout(null)} className="px-4 py-2 text-slate-400">Cancel</button>
              <button onClick={processPayout} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Pay</button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{selectedAgent.user.name} — Agent Details</h2>
              <button onClick={() => setSelectedAgent(null)} className="text-slate-500 hover:text-slate-400 text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <p><strong>Email:</strong> {selectedAgent.user.email}</p>
              <p><strong>Phone:</strong> {selectedAgent.user.phone || "—"}</p>
              <p><strong>Code:</strong> {selectedAgent.referralCode}</p>
              <p><strong>Commission:</strong> {selectedAgent.commissionRate}%</p>
              <p><strong>Bank:</strong> {selectedAgent.bankName || "—"}</p>
              <p><strong>UPI:</strong> {selectedAgent.upiId || "—"}</p>
            </div>
            <h3 className="font-semibold mb-2">Referrals ({selectedAgent.referrals?.length || 0})</h3>
            <div className="space-y-2">
              {(selectedAgent.referrals || []).map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] text-sm">
                  <span>{r.student?.name} ({r.student?.email})</span>
                  <span className="font-medium">₹{r.commission}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
