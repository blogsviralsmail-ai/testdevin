import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Wallet, IndianRupee, Clock, CheckCircle, XCircle, Upload, Send, Loader2, FileText, AlertCircle, CreditCard, Banknote, Trash2, Download, Receipt } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface FeePayment {
  id: number;
  amount: number;
  payment_mode: string;
  utr_number: string;
  proof_url: string;
  remarks: string;
  status: string;
  rejection_reason: string;
  created_at: string;
  approved_by_name: string;
  approved_at: string;
  source?: string; // 'online' for fee_payments, 'admin' for admin-added transactions
}

interface FeeSummary {
  total_fees: number;
  paid: number;
  pending: number;
  payments: FeePayment[];
}

interface ReceiptItem {
  id: number;
  receipt_no: string;
  amount: number;
  date: string;
  transaction_id: number;
  payment_mode: string;
  utr_number: string;
  description: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function StudentFees() {
  const [fees, setFees] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayForm, setShowPayForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [form, setForm] = useState({ amount: "", payment_mode: "upi", utr_number: "", proof_url: "", remarks: "" });
  const [razorpayAmount, setRazorpayAmount] = useState("");
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"choose" | "manual" | "razorpay">("choose");
  const [paySettings, setPaySettings] = useState<Record<string, string>>({});
  const [deletedPayments, setDeletedPayments] = useState<Record<string, unknown>[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "deleted" | "receipts">("history");
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [downloadingReceipt, setDownloadingReceipt] = useState<number | null>(null);
  // Center student detection
  const [isCenterStudent, setIsCenterStudent] = useState(false);
  const [centerPaySettings, setCenterPaySettings] = useState<Record<string, string>>({});
  const [centerName, setCenterName] = useState("");

  useEffect(() => {
    loadFees(); loadDeletedPayments(); loadReceipts();
    // Check if student belongs to a center
    api.get("/api/centers/student/my-center-info").then(r => {
      if (r.data && r.data.center_id) {
        setIsCenterStudent(true);
        setCenterName(r.data.center_name || "");
        // Load center's payment settings for center students
        api.get("/api/centers/student/payment-settings").then(ps => {
          setCenterPaySettings(ps.data || {});
        }).catch(() => {});
      } else {
        // Only load admin payment settings and Razorpay for non-center students
        loadPaymentSettings();
        loadRazorpayScript();
      }
    }).catch(() => {
      // Not a center student, load admin settings
      loadPaymentSettings();
      loadRazorpayScript();
    });
  }, []);

  async function loadReceipts() {
    try {
      const res = await api.get("/api/accounts/my-receipts");
      setReceipts(Array.isArray(res.data) ? res.data : []);
    } catch { /* empty */ }
  }

  async function downloadReceipt(receiptId: number) {
    setDownloadingReceipt(receiptId);
    try {
      const res = await api.get(`/api/accounts/receipt-data/${receiptId}`);
      const d = res.data;
      const b = d.branding || {};
      const s = d.student || {};
      const p = d.payment || {};
      const f = d.fee_summary || {};
      const fmtDate = d.date ? new Date(d.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '';
      const fmtAmt = (v: number) => new Intl.NumberFormat('en-IN').format(v);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${d.receipt_no}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#e2e8f0;padding:30px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:800px;margin:0 auto;background:#fff;border-radius:0;position:relative;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.15)}
/* Watermark */
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:110px;font-weight:900;color:rgba(30,64,175,0.03);letter-spacing:10px;white-space:nowrap;pointer-events:none;z-index:0;user-select:none}
/* Top accent bar */
.accent-bar{height:6px;background:linear-gradient(90deg,#1e40af 0%,#7c3aed 40%,#ec4899 70%,#f97316 100%)}
/* Header */
.header{padding:35px 40px 25px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e40af;position:relative;z-index:1}
.header-left h1{font-size:28px;font-weight:800;color:#1e293b;letter-spacing:-0.5px}
.header-left .tagline{font-size:12px;color:#64748b;margin-top:3px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase}
.header-left .contact{font-size:11px;color:#94a3b8;margin-top:8px}
.header-right{text-align:right}
.header-right .receipt-title{font-size:32px;font-weight:900;color:#1e40af;letter-spacing:-1px;line-height:1}
.header-right .receipt-no{font-size:13px;color:#475569;margin-top:8px;font-weight:600}
.header-right .receipt-date{font-size:12px;color:#64748b;margin-top:2px}
/* Status badge */
.status-bar{display:flex;justify-content:center;padding:16px;background:linear-gradient(135deg,#ecfdf5,#f0fdf4);border-bottom:1px solid #d1fae5}
.status-badge{display:inline-flex;align-items:center;gap:8px;background:#fff;border:2px solid #22c55e;border-radius:100px;padding:8px 28px;box-shadow:0 2px 8px rgba(34,197,94,0.15)}
.status-badge .dot{width:10px;height:10px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite}
.status-badge span{font-size:14px;font-weight:700;color:#16a34a;letter-spacing:0.3px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
/* Content */
.content{padding:30px 40px;position:relative;z-index:1}
/* Info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:28px;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden}
.info-section{padding:0}
.info-section .sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;padding:10px 18px;color:#fff}
.info-section:first-child .sec-title{background:#1e40af}
.info-section:last-child .sec-title{background:#475569}
.info-section .sec-body{padding:6px 18px 14px}
.info-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9}
.info-row:last-child{border-bottom:none}
.info-row .lbl{font-size:12px;color:#94a3b8;font-weight:500}
.info-row .val{font-size:12px;color:#1e293b;font-weight:600;text-align:right}
/* Amount highlight */
.amount-box{background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:14px;padding:28px 30px;display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;position:relative;overflow:hidden}
.amount-box::after{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08)}
.amount-box::before{content:'';position:absolute;bottom:-30px;left:-30px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.05)}
.amount-left .amount-label{font-size:13px;color:rgba(255,255,255,0.75);font-weight:500;margin-bottom:4px}
.amount-left .amount-value{font-size:36px;font-weight:900;color:#fff;letter-spacing:-1px}
.amount-left .amount-words{font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px;font-style:italic}
.amount-right{text-align:right}
.amount-right .mode{font-size:13px;color:rgba(255,255,255,0.8);font-weight:500}
.amount-right .mode-val{font-size:16px;color:#fff;font-weight:700;margin-top:2px}
.amount-right .utr{font-size:11px;color:rgba(255,255,255,0.6);margin-top:8px}
.amount-right .utr-val{font-size:12px;color:rgba(255,255,255,0.9);font-weight:600}
/* Fee summary cards */
.fee-cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px}
.fee-card{border-radius:12px;padding:18px 16px;text-align:center;position:relative;overflow:hidden}
.fee-card.total-card{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1.5px solid #93c5fd}
.fee-card.paid-card{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac}
.fee-card.pending-card{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fde68a}
.fee-card .fc-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.fee-card.total-card .fc-label{color:#3b82f6}
.fee-card.paid-card .fc-label{color:#22c55e}
.fee-card.pending-card .fc-label{color:#f59e0b}
.fee-card .fc-amt{font-size:22px;font-weight:800;letter-spacing:-0.5px}
.fee-card.total-card .fc-amt{color:#1e40af}
.fee-card.paid-card .fc-amt{color:#16a34a}
.fee-card.pending-card .fc-amt{color:#d97706}
/* Progress bar */
.progress-wrap{margin-bottom:28px}
.progress-header{display:flex;justify-content:space-between;margin-bottom:6px}
.progress-header span{font-size:11px;font-weight:600;color:#64748b}
.progress-bar{height:8px;background:#e2e8f0;border-radius:100px;overflow:hidden}
.progress-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,#22c55e,#16a34a);transition:width 0.5s}
/* GST info */
.gst-info{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 18px;font-size:12px;color:#64748b;margin-bottom:20px;display:flex;justify-content:space-between}
.gst-info strong{color:#1e293b}
/* Divider */
.divider{height:1px;background:linear-gradient(90deg,transparent,#cbd5e1,transparent);margin:10px 0 20px}
/* Footer */
.footer{background:#f8fafc;border-top:2px solid #e2e8f0;padding:25px 40px;text-align:center;position:relative;z-index:1}
.footer .disclaimer{font-size:11px;color:#94a3b8;font-weight:500;margin-bottom:8px}
.footer .company-info{font-size:11px;color:#b0b8c4}
.footer .powered{margin-top:12px;font-size:10px;color:#cbd5e1;letter-spacing:0.5px}
/* Print styles */
@media print{
  body{padding:0;background:#fff}
  .page{box-shadow:none;border-radius:0;max-width:100%}
  .accent-bar{-webkit-print-color-adjust:exact}
  @page{margin:0;size:A4}
}
</style></head><body>
<div class="page">
<div class="watermark">RECEIPT</div>
<div class="accent-bar"></div>
<div class="header">
  <div class="header-left">
    <h1>${b.company_name || 'ASFF Education Hub'}</h1>
    ${b.site_tagline ? '<div class="tagline">'+b.site_tagline+'</div>' : ''}
    <div class="contact">${b.company_phone ? b.company_phone : ''}${b.company_email ? ' &bull; '+b.company_email : ''}${b.company_address ? '<br>'+b.company_address : ''}</div>
    ${b.gst_number ? '<div class="gst" style="margin-top:4px;font-size:11px;color:#64748b">GST: <b style="color:#1e293b">'+b.gst_number+'</b></div>' : ''}
  </div>
  <div class="header-right">
    <div class="receipt-title">RECEIPT</div>
    <div class="receipt-no">#${d.receipt_no}</div>
    <div class="receipt-date">${fmtDate}</div>
  </div>
</div>
<div class="status-bar">
  <div class="status-badge"><div class="dot"></div><span>Payment Successful</span></div>
</div>
<div class="content">
  <div class="info-grid">
    <div class="info-section">
      <div class="sec-title">Student Information</div>
      <div class="sec-body">
        <div class="info-row"><span class="lbl">Name</span><span class="val">${s.name || ''}</span></div>
        ${s.father_name ? '<div class="info-row"><span class="lbl">Father\'s Name</span><span class="val">'+s.father_name+'</span></div>' : ''}
        ${s.address ? '<div class="info-row"><span class="lbl">Address</span><span class="val">'+s.address+'</span></div>' : ''}
        ${s.phone ? '<div class="info-row"><span class="lbl">Phone</span><span class="val">'+s.phone+'</span></div>' : ''}
        ${s.email ? '<div class="info-row"><span class="lbl">Email</span><span class="val">'+s.email+'</span></div>' : ''}
        ${s.center_name ? '<div class="info-row"><span class="lbl">Center</span><span class="val" style="color:#059669;font-weight:700">'+s.center_name+'</span></div>' : ''}
      </div>
    </div>
    <div class="info-section">
      <div class="sec-title">Academic Details</div>
      <div class="sec-body">
        ${s.university ? '<div class="info-row"><span class="lbl">University</span><span class="val">'+s.university+'</span></div>' : ''}
        ${s.course ? '<div class="info-row"><span class="lbl">Course</span><span class="val">'+s.course+'</span></div>' : ''}
        ${s.branch ? '<div class="info-row"><span class="lbl">Branch</span><span class="val">'+s.branch+'</span></div>' : ''}
        ${s.session ? '<div class="info-row"><span class="lbl">Session</span><span class="val">'+s.session+'</span></div>' : ''}
      </div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-left">
      <div class="amount-label">Amount Paid</div>
      <div class="amount-value">&#8377;${fmtAmt(Number(d.amount))}</div>
    </div>
    <div class="amount-right">
      <div class="mode">Payment Mode</div>
      <div class="mode-val">${(p.payment_mode || 'N/A').toUpperCase()}</div>
      ${p.utr_number ? '<div class="utr">UTR / Ref No.</div><div class="utr-val">'+p.utr_number+'</div>' : ''}
    </div>
  </div>

  <div class="fee-cards">
    <div class="fee-card total-card">
      <div class="fc-label">Total Fees</div>
      <div class="fc-amt">&#8377;${fmtAmt(Number(f.total_fees||0))}</div>
    </div>
    <div class="fee-card paid-card">
      <div class="fc-label">Total Paid</div>
      <div class="fc-amt">&#8377;${fmtAmt(Number(f.total_paid||0))}</div>
    </div>
    <div class="fee-card pending-card">
      <div class="fc-label">Balance Due</div>
      <div class="fc-amt">&#8377;${fmtAmt(Number(f.pending||0))}</div>
    </div>
  </div>

  <div class="progress-wrap">
    <div class="progress-header"><span>Payment Progress</span><span>${f.total_fees > 0 ? Math.round((Number(f.total_paid||0)/Number(f.total_fees))*100) : 0}%</span></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${f.total_fees > 0 ? Math.round((Number(f.total_paid||0)/Number(f.total_fees))*100) : 0}%"></div></div>
  </div>

  <div class="divider"></div>
</div>
<div class="footer">
  <div class="disclaimer">${b.receipt_footer || 'This is a computer generated receipt and does not require a signature.'}</div>
  <div class="company-info">${b.company_name || 'ASFF Education Hub'}${b.company_address ? ' &bull; '+b.company_address : ''}${b.company_phone ? ' &bull; '+b.company_phone : ''}</div>
  <div class="powered">Powered by Education Hub Management System</div>
</div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); }
    } catch { /* empty */ }
    setDownloadingReceipt(null);
  }

  async function loadDeletedPayments() {
    try {
      const res = await api.get("/api/accounts/my-deleted-payments");
      setDeletedPayments(Array.isArray(res.data) ? res.data : []);
    } catch { /* empty */ }
  }

  async function loadFees() {
    try {
      const res = await api.get("/api/accounts/my-fees");
      setFees(res.data);
    } catch { /* empty */ }
    setLoading(false);
  }

  async function loadPaymentSettings() {
    try {
      const res = await api.get("/api/accounts/payment-settings");
      setPaySettings(res.data);
    } catch { /* empty */ }
  }

  function loadRazorpayScript() {
    if (document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }

  const handleRazorpayPay = async () => {
    const amt = parseFloat(razorpayAmount);
    if (!amt || amt <= 0) { setMsg("Please enter a valid amount"); return; }
    if (amt > (fees?.pending || 0)) { setMsg("Amount cannot exceed pending fees"); return; }
    setRazorpayLoading(true);
    setMsg("");
    try {
      const res = await api.post("/api/accounts/razorpay/create-order", { amount: amt });
      const data = res.data;
      if (!window.Razorpay) { setMsg("Razorpay SDK not loaded. Please refresh and try again."); setRazorpayLoading(false); return; }
      const options = {
        key: data.key_id, amount: data.amount, currency: data.currency,
        name: "ASFF Education Hub", description: "Fee Payment", order_id: data.order_id,
        prefill: { name: data.student_name, email: data.student_email, contact: data.student_phone },
        theme: { color: "#2563eb" },
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            await api.post("/api/accounts/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amt,
            });
            setMsg("Payment successful! Your fees have been updated.");
            setRazorpayAmount(""); setShowPayForm(false); setPaymentMethod("choose"); loadFees();
          } catch { setMsg("Payment verification failed. Please contact admin with your payment ID: " + response.razorpay_payment_id); }
        },
        modal: { ondismiss: function () { setRazorpayLoading(false); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp: { error?: { description?: string } }) {
        setMsg("Payment failed: " + (resp.error?.description || "Unknown error"));
        setRazorpayLoading(false);
      });
      rzp.open();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      setMsg("Failed to initiate payment: " + (axErr?.response?.data?.detail || "Please try again"));
    }
    setRazorpayLoading(false);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/accounts/upload-proof", fd);
      setForm(f => ({ ...f, proof_url: res.data.url }));
    } catch { /* empty */ }
    setUploadingProof(false);
  };

  const handleSubmit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setMsg("Please enter a valid amount");
      return;
    }
    if (!form.utr_number.trim() && form.payment_mode !== "cash") {
      setMsg("Please enter UTR/Transaction number");
      return;
    }
    if (form.payment_mode === "cheque" && !form.proof_url) {
      setMsg("Please upload cheque image");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      // If center student, submit to center endpoint; otherwise submit to admin endpoint
      const endpoint = isCenterStudent ? "/api/centers/student/fee-payment" : "/api/accounts/fee-payments";
      await api.post(endpoint, {
        amount: parseFloat(form.amount),
        payment_mode: form.payment_mode,
        utr_number: form.utr_number,
        proof_url: form.proof_url,
        remarks: form.remarks,
      });
      const approver = isCenterStudent ? "center" : "accounts team";
      setMsg(`Payment submitted successfully! It will be verified by the ${approver}.`);
      setForm({ amount: "", payment_mode: "upi", utr_number: "", proof_url: "", remarks: "" });
      setShowPayForm(false);
      loadFees();
    } catch {
      setMsg("Failed to submit payment. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalFees = fees?.total_fees || 0;
  const paid = fees?.paid || 0;
  const pending = fees?.pending || 0;
  const paidPercent = totalFees > 0 ? Math.min(100, Math.round((paid / totalFees) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Fees</h1>
        {pending > 0 && (
          <button onClick={() => { setPaymentMethod("choose"); setShowPayForm(true); }} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-lg shadow-blue-200 w-full sm:w-auto">
            <IndianRupee className="h-4 w-4" /> Pay Fees Online
          </button>
        )}
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${msg.includes("success") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.includes("success") ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {msg}
        </div>
      )}

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="text-sm text-blue-100">Total Fees</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{totalFees > 0 ? `₹${totalFees.toLocaleString()}` : "Not Set"}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <p className="text-sm text-green-100">Paid Amount</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">₹{paid.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-sm text-orange-100">Pending Amount</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">₹{pending.toLocaleString()}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalFees > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Payment Progress</p>
            <p className="text-sm font-bold text-blue-600">{paidPercent}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${paidPercent}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">₹{paid.toLocaleString()} paid out of ₹{totalFees.toLocaleString()}</p>
        </div>
      )}

      {totalFees === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 text-center">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-2" />
          <p className="text-amber-800 font-medium">Fees Not Set Yet</p>
          <p className="text-sm text-amber-600 mt-1">Your total fees have not been set by the admin yet. Please contact the admin or raise a support ticket.</p>
        </div>
      )}

      {/* Payment Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-lg mb-4 -mx-1 px-1 no-scrollbar">
        <button onClick={() => setActiveTab("history")} className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "history" ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-900"}`}>
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> History
          {fees?.payments && fees.payments.length > 0 && <span className="text-xs text-gray-400">({fees.payments.length})</span>}
        </button>
        <button onClick={() => setActiveTab("deleted")} className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "deleted" ? "bg-white shadow-sm text-red-700" : "text-gray-600 hover:text-gray-900"}`}>
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Deleted
          {deletedPayments.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{deletedPayments.length}</span>}
        </button>
        <button onClick={() => setActiveTab("receipts")} className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "receipts" ? "bg-white shadow-sm text-purple-700" : "text-gray-600 hover:text-gray-900"}`}>
          <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Receipts
          {receipts.length > 0 && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">{receipts.length}</span>}
        </button>
      </div>

      {/* Payment History */}
      {activeTab === "history" && (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        {(!fees?.payments || fees.payments.length === 0) ? (
          <div className="p-8 text-center text-gray-500">
            <IndianRupee className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p>No payments made yet</p>
            {pending > 0 && <p className="text-sm mt-1">Click "Pay Fees Online" to make your first payment</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {fees.payments.map((p) => (
              <div key={p.id} className="px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50">
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      p.status === "approved" ? "bg-green-100" : p.status === "rejected" ? "bg-red-100" : "bg-amber-100"
                    }`}>
                      {p.status === "approved" ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" /> :
                       p.status === "rejected" ? <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" /> :
                       <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">₹{p.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.source === "admin" ? (
                          <span className="inline-flex items-center gap-1 text-purple-600 font-medium"><Banknote className="h-3 w-3" /> Admin {p.payment_mode ? `(${p.payment_mode.toUpperCase()})` : ""}</span>
                        ) : p.payment_mode === "razorpay" ? (
                          <span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3" /> Razorpay</span>
                        ) : p.payment_mode?.toUpperCase()}
                        {p.utr_number ? ` | ${p.utr_number}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium ${
                      p.source === "admin" ? "bg-purple-100 text-purple-700" :
                      p.status === "approved" ? "bg-green-100 text-green-700" :
                      p.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {p.source === "admin" ? "Admin" : p.status === "approved" ? "Approved" : p.status === "rejected" ? "Rejected" : "Pending"}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}
                    </p>
                  </div>
                </div>
                {p.status === "rejected" && p.rejection_reason && (
                  <div className="mt-2 bg-red-50 rounded-lg p-2 text-xs text-red-600">
                    <strong>Rejection Reason:</strong> {p.rejection_reason}
                  </div>
                )}
                {p.proof_url && (
                  <a href={API + p.proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                    <FileText className="h-3 w-3" /> View Payment Proof
                  </a>
                )}
                {p.remarks && <p className="text-xs text-gray-500 mt-1">Note: {p.remarks}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Deleted by Admin Tab */}
      {activeTab === "deleted" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2"><Trash2 className="h-5 w-5" /> Deleted by Admin</h2>
            <p className="text-xs text-red-600 mt-1">These payments were removed by the admin. They are not counted in your fee summary.</p>
          </div>
          {deletedPayments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Trash2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p>No deleted payments</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {deletedPayments.map((p: Record<string, unknown>, idx: number) => (
                <div key={`${p.source || "fp"}-${p.id}-${idx}`} className="px-5 py-4 bg-red-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-red-100">
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 line-through">₹{Number(p.amount || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {p.source === "transaction" ? (
                            <span>{String(p.description || "Admin Entry")}</span>
                          ) : p.payment_mode === "razorpay" ? (
                            <span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3" /> Razorpay</span>
                          ) : String(p.payment_mode || "").toUpperCase()}
                          {p.utr_number ? ` | ID: ${p.utr_number}` : ""}
                        </p>
                        {p.source === "transaction" && <p className="text-xs text-orange-500 mt-0.5">Admin Entry</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">Deleted</span>
                      <p className="text-xs text-gray-400 mt-1">
                        {p.deleted_at ? new Date(String(p.deleted_at)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : 
                         p.created_at ? new Date(String(p.created_at)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>
                  {p.remarks ? <p className="text-xs text-gray-500 mt-1">Note: {String(p.remarks)}</p> : null}
                  {p.proof_url ? (
                    <a href={API + String(p.proof_url)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                      <FileText className="h-3 w-3" /> View Payment Proof
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Receipts Tab */}
      {activeTab === "receipts" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-purple-50">
            <h2 className="text-lg font-semibold text-purple-800 flex items-center gap-2"><Receipt className="h-5 w-5" /> Fee Receipts</h2>
            <p className="text-xs text-purple-600 mt-1">Download your fee payment receipts</p>
          </div>
          {receipts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p>No receipts generated yet</p>
              <p className="text-sm mt-1">Receipts are generated when your payments are approved</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {receipts.map((r) => (
                <div key={r.id} className="px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center bg-purple-100 flex-shrink-0">
                        <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{r.receipt_no}</p>
                        <p className="text-xs text-gray-500 truncate">
                          Rs.{r.amount.toLocaleString()} | {(r.payment_mode || "").toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                      </span>
                      <button onClick={() => downloadReceipt(r.id)} disabled={downloadingReceipt === r.id}
                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium disabled:opacity-50 shadow-sm">
                        {downloadingReceipt === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pay Fees Modal - Method Selection */}
      {showPayForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Pay Fees Online</h2>
              <button onClick={() => { setShowPayForm(false); setPaymentMethod("choose"); }} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-blue-700">
              <p className="font-medium">Pending: ₹{pending.toLocaleString()}</p>
            </div>

            {paymentMethod === "choose" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">Choose payment method:</p>
                {!isCenterStudent && (
                  <button onClick={() => { setPaymentMethod("razorpay"); setRazorpayAmount(""); }}
                    className="w-full flex items-center gap-4 p-4 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                    <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Pay with Razorpay</p>
                      <p className="text-xs text-gray-500">UPI, Credit/Debit Card, Net Banking, Wallets</p>
                    </div>
                    <div className="ml-auto">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">R</span>
                      </div>
                    </div>
                  </button>
                )}
                <button onClick={() => setPaymentMethod("manual")}
                  className="w-full flex items-center gap-4 p-4 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group">
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Banknote className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Manual Payment</p>
                    <p className="text-xs text-gray-500">{isCenterStudent ? `Pay to ${centerName || 'your center'} via UPI or bank transfer` : 'Submit UTR/proof after bank transfer or UPI'}</p>
                  </div>
                </button>
              </div>
            )}

            {/* Razorpay Payment Form */}
            {paymentMethod === "razorpay" && (
              <div className="space-y-4">
                <button onClick={() => setPaymentMethod("choose")} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  &larr; Back to payment methods
                </button>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <p className="font-semibold text-blue-800">Razorpay Payment Gateway</p>
                  </div>
                  <p className="text-xs text-blue-600">Secure payment via UPI, Cards, Net Banking, Wallets</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" value={razorpayAmount} onChange={(e) => setRazorpayAmount(e.target.value)}
                    placeholder="Enter amount to pay" max={pending}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold" />
                  <p className="text-xs text-gray-500 mt-1">Maximum: ₹{pending.toLocaleString()}</p>
                </div>
                <button onClick={handleRazorpayPay} disabled={razorpayLoading || !razorpayAmount}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all">
                  {razorpayLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {razorpayLoading ? "Processing..." : "Pay with Razorpay"}
                </button>
              </div>
            )}

            {/* Manual Payment Form */}
            {paymentMethod === "manual" && (
              <div className="space-y-4">
                <button onClick={() => setPaymentMethod("choose")} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  &larr; Back to payment methods
                </button>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-800">Manual Payment Verification</p>
                  </div>
                  <p className="text-xs text-green-600">Make payment via UPI/Bank Transfer and submit details for admin verification</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="Enter amount" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                  <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {/* Center Payment Info for center students */}
                {isCenterStudent && (centerPaySettings.upi_id || centerPaySettings.account_number) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-green-800 mb-3">Payment Details - {centerName || 'Your Center'}</p>
                    <div className="space-y-2 text-sm">
                      {centerPaySettings.upi_id && (
                        <div className="flex justify-between"><span className="text-gray-500">UPI ID:</span><span className="font-semibold text-gray-900">{centerPaySettings.upi_id}</span></div>
                      )}
                      {centerPaySettings.upi_qr_url && (
                        <div className="text-center mt-2">
                          <img src={centerPaySettings.upi_qr_url.startsWith("/") ? API + centerPaySettings.upi_qr_url : centerPaySettings.upi_qr_url}
                            alt="UPI QR Code" className="h-48 w-48 mx-auto object-contain rounded-lg border" />
                          <p className="text-xs text-gray-500 mt-2">Scan with any UPI app</p>
                        </div>
                      )}
                      {centerPaySettings.account_holder_name && <div className="flex justify-between"><span className="text-gray-500">Account Name:</span><span className="font-semibold text-gray-900">{centerPaySettings.account_holder_name}</span></div>}
                      {centerPaySettings.bank_name && <div className="flex justify-between"><span className="text-gray-500">Bank:</span><span className="font-semibold text-gray-900">{centerPaySettings.bank_name}</span></div>}
                      {centerPaySettings.account_number && <div className="flex justify-between"><span className="text-gray-500">Account No:</span><span className="font-semibold text-gray-900">{centerPaySettings.account_number}</span></div>}
                      {centerPaySettings.ifsc_code && <div className="flex justify-between"><span className="text-gray-500">IFSC Code:</span><span className="font-semibold text-gray-900">{centerPaySettings.ifsc_code}</span></div>}
                    </div>
                  </div>
                )}

                {/* UPI QR Code - for non-center students */}
                {!isCenterStudent && form.payment_mode === "upi" && paySettings.upi_qr_image && (
                  <div className="bg-white border border-blue-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-blue-700 mb-3">Scan QR Code to Pay</p>
                    <img src={paySettings.upi_qr_image.startsWith("/") ? API + paySettings.upi_qr_image : paySettings.upi_qr_image}
                      alt="UPI QR Code" className="h-48 w-48 mx-auto object-contain rounded-lg border" />
                    <p className="text-xs text-gray-500 mt-2">Scan with any UPI app (Google Pay, PhonePe, Paytm, etc.)</p>
                  </div>
                )}

                {/* Bank Transfer Details - for non-center students */}
                {!isCenterStudent && form.payment_mode === "bank_transfer" && (paySettings.bank_account_name || paySettings.bank_account_number) && (
                  <div className="bg-white border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-700 mb-3">Bank Transfer Details</p>
                    <div className="space-y-2 text-sm">
                      {paySettings.bank_account_name && <div className="flex justify-between"><span className="text-gray-500">Account Name:</span><span className="font-semibold text-gray-900">{paySettings.bank_account_name}</span></div>}
                      {paySettings.bank_account_number && <div className="flex justify-between"><span className="text-gray-500">Account No:</span><span className="font-semibold text-gray-900">{paySettings.bank_account_number}</span></div>}
                      {paySettings.bank_ifsc_code && <div className="flex justify-between"><span className="text-gray-500">IFSC Code:</span><span className="font-semibold text-gray-900">{paySettings.bank_ifsc_code}</span></div>}
                      {paySettings.bank_name && <div className="flex justify-between"><span className="text-gray-500">Bank:</span><span className="font-semibold text-gray-900">{paySettings.bank_name}</span></div>}
                      {paySettings.bank_branch && <div className="flex justify-between"><span className="text-gray-500">Branch:</span><span className="font-semibold text-gray-900">{paySettings.bank_branch}</span></div>}
                    </div>
                  </div>
                )}

                {/* Cheque notice */}
                {form.payment_mode === "cheque" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                    <strong>Note:</strong> Cheque image upload is mandatory for cheque payments.
                  </div>
                )}

                {/* UTR / Transaction Number - not needed for cash */}
                {form.payment_mode !== "cash" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UTR / Transaction Number *</label>
                    <input type="text" value={form.utr_number} onChange={(e) => setForm({ ...form, utr_number: e.target.value })}
                      placeholder="Enter UTR or transaction ID" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.payment_mode === "cheque" ? "Cheque Image *" : "Payment Proof (Screenshot/PDF)"}
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 text-sm">
                      <Upload className="h-4 w-4" />
                      {uploadingProof ? "Uploading..." : form.payment_mode === "cheque" ? "Upload Cheque Image" : "Upload Proof"}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofUpload} disabled={uploadingProof} />
                    </label>
                    {form.proof_url && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Uploaded</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                  <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    placeholder="Any additional notes" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
                </div>
                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? "Submitting..." : "Submit Payment for Verification"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
