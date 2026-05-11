"use client";

import { useState, useEffect } from "react";

interface PayslipInfo {
  id: string;
  month: string;
  year: number;
  basicPay: number;
  allowances: number;
  deductions: number;
  bonus: number;
  netPay: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  paymentMethod: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  status: string;
  user?: { name: string; email: string; employeeId: string | null };
  enrollment?: { batch: { name: string; program: { title: string } } };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<PayslipInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPayslip, setViewPayslip] = useState<PayslipInfo | null>(null);

  useEffect(() => {
    fetch("/api/payslips").then(r => r.json()).then(data => { setPayslips(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const viewDetail = async (id: string) => {
    const res = await fetch(`/api/payslips?id=${id}`);
    if (res.ok) setViewPayslip(await res.json());
  };

  const printPayslip = () => {
    const w = window.open("", "_blank");
    if (!w || !viewPayslip) return;
    const p = viewPayslip;
    w.document.write(`<!DOCTYPE html><html><head><title>Payslip - ${MONTHS[parseInt(p.month)-1]} ${p.year}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a}
    .header{text-align:center;border-bottom:3px solid #0EA5B8;padding-bottom:15px;margin-bottom:25px}
    .header h1{margin:0;color:#0EA5B8;font-size:24px}
    .header p{margin:5px 0;color:#666;font-size:13px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:25px}
    .info-box{background:#f8f9fa;padding:12px;border-radius:8px}
    .info-box label{font-size:11px;color:#888;text-transform:uppercase;display:block}
    .info-box span{font-size:14px;font-weight:600}
    table{width:100%;border-collapse:collapse;margin:15px 0}
    th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}
    th{background:#f0f0f0;font-size:12px;text-transform:uppercase;color:#666}
    .total-row{background:#0EA5B8;color:#fff;font-size:16px;font-weight:bold}
    .total-row td{border:none;padding:14px}
    .footer{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #ddd;color:#999;font-size:11px}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1>KKHS Media Private Limited</h1><p>Payslip for ${MONTHS[parseInt(p.month)-1]} ${p.year}</p></div>
    <div class="info-grid">
      <div class="info-box"><label>Employee Name</label><span>${p.user?.name || "—"}</span></div>
      <div class="info-box"><label>Employee ID</label><span>${p.user?.employeeId || "—"}</span></div>
      <div class="info-box"><label>Program</label><span>${p.enrollment?.batch?.program?.title || "—"}</span></div>
      <div class="info-box"><label>Payment Status</label><span>${p.status === "paid" ? "Paid" : "Pending"}</span></div>
    </div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>
    <tr><td>Basic Pay (${p.presentDays}/${p.workingDays} days)</td><td style="text-align:right">₹${p.basicPay.toLocaleString()}</td></tr>
    <tr><td>Allowances</td><td style="text-align:right">₹${p.allowances.toLocaleString()}</td></tr>
    <tr><td>Bonus</td><td style="text-align:right">₹${p.bonus.toLocaleString()}</td></tr>
    <tr><td>Deductions</td><td style="text-align:right;color:red">- ₹${p.deductions.toLocaleString()}</td></tr>
    <tr class="total-row"><td>Net Pay</td><td style="text-align:right">₹${p.netPay.toLocaleString()}</td></tr>
    </tbody></table>
    <div class="info-grid">
      <div class="info-box"><label>Working Days</label><span>${p.workingDays}</span></div>
      <div class="info-box"><label>Present Days</label><span>${p.presentDays}</span></div>
      <div class="info-box"><label>Leave Days</label><span>${p.leaveDays}</span></div>
      <div class="info-box"><label>Payment Method</label><span>${p.paymentMethod || "—"}</span></div>
    </div>
    <div class="footer"><p>This is a system-generated payslip. No signature required.</p><p>KKHS Media Private Limited | internship.kkhsmedia.com</p></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">My Payslips</h1>

      {loading ? <div className="text-center text-slate-500 py-8">Loading...</div> :
      payslips.length === 0 ? (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-8 text-center">
          <p className="text-4xl mb-3">💰</p>
          <h3 className="text-lg font-semibold text-white mb-1">No Payslips Yet</h3>
          <p className="text-sm text-slate-400">Your payslips will appear here once generated by admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map(p => (
            <div key={p.id} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{MONTHS[parseInt(p.month)-1]} {p.year}</p>
                  <p className="text-xs text-slate-500">Payslip</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  p.status === "paid" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                  "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>{p.status === "paid" ? "Paid" : "Pending"}</span>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 mb-3">
                <p className="text-xs text-slate-500">Net Pay</p>
                <p className="text-2xl font-bold text-green-400">₹{p.netPay.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
                <div className="bg-white/[0.03] rounded-lg p-2">
                  <p className="text-slate-500">Working</p>
                  <p className="font-semibold text-white">{p.workingDays}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-2">
                  <p className="text-slate-500">Present</p>
                  <p className="font-semibold text-white">{p.presentDays}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-2">
                  <p className="text-slate-500">Leave</p>
                  <p className="font-semibold text-white">{p.leaveDays}</p>
                </div>
              </div>
              <button onClick={() => viewDetail(p.id)}
                className="w-full px-4 py-2 bg-[#0EA5B8]/20 text-[#0EA5B8] rounded-lg text-sm font-medium hover:bg-[#0EA5B8]/30 border border-[#0EA5B8]/30 transition-all">
                View Payslip
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payslip Detail Modal */}
      {viewPayslip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1420] rounded-2xl border border-white/[0.08] max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Payslip — {MONTHS[parseInt(viewPayslip.month)-1]} {viewPayslip.year}</h3>
                <button onClick={() => setViewPayslip(null)} className="text-slate-400 hover:text-red-400 text-xl">&times;</button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-xs text-slate-500">Employee</p>
                    <p className="font-semibold text-white text-sm">{viewPayslip.user?.name || "—"}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-xs text-slate-500">Employee ID</p>
                    <p className="font-semibold text-white text-sm">{viewPayslip.user?.employeeId || "—"}</p>
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-white/[0.04]">
                        <td className="p-3 text-slate-400">Basic Pay ({viewPayslip.presentDays}/{viewPayslip.workingDays} days)</td>
                        <td className="p-3 text-right text-white font-medium">₹{viewPayslip.basicPay.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="p-3 text-slate-400">Allowances</td>
                        <td className="p-3 text-right text-white font-medium">₹{viewPayslip.allowances.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="p-3 text-slate-400">Bonus</td>
                        <td className="p-3 text-right text-green-400 font-medium">+ ₹{viewPayslip.bonus.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="p-3 text-slate-400">Deductions</td>
                        <td className="p-3 text-right text-red-400 font-medium">- ₹{viewPayslip.deductions.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-[#0EA5B8]/10">
                        <td className="p-3 font-bold text-white">Net Pay</td>
                        <td className="p-3 text-right font-bold text-[#0EA5B8] text-lg">₹{viewPayslip.netPay.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-xs text-slate-500">Payment Method</p>
                    <p className="text-sm text-white capitalize">{viewPayslip.paymentMethod || "—"}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-xs text-slate-500">Status</p>
                    <p className={`text-sm font-medium ${viewPayslip.status === "paid" ? "text-green-400" : "text-amber-400"}`}>
                      {viewPayslip.status === "paid" ? "Paid" : "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={printPayslip}
                className="w-full mt-4 px-4 py-3 bg-[#0EA5B8] text-white rounded-xl font-medium hover:bg-[#0d96a7] transition-all transform hover:scale-[1.02] shadow-lg">
                Print / Download Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
