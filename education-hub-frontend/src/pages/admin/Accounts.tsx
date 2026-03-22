import { useState, useEffect } from "react";
import api, { getUser } from "../../lib/api";
import { Plus, X, Wallet, Upload, FileText, CheckCircle, XCircle, Clock, Eye, Search, Phone, AlertCircle, IndianRupee, Trash2, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = import.meta.env.VITE_API_URL || "";

interface Transaction {
  id: number; student_name: string; enrollment_no: string; student_phone: string; amount: number; transaction_type: string;
  payment_mode: string; utr_number: string; account_details: string; notes: string; created_at: string; proof_url: string; description: string;
}

interface FeePayment {
  id: number; student_name: string; enrollment_no: string; student_phone: string; amount: number;
  payment_mode: string; utr_number: string; proof_url: string; remarks: string; status: string;
  created_at: string; approved_at: string; approved_by_name: string; rejection_reason: string;
}

interface StudentStatement {
  student: { id: number; name: string; phone: string; email: string; enrollment_no: string; total_fees: number; university_name: string; course_name: string };
  payments: Array<{ id: number; amount: number; payment_mode: string; utr_number: string; status: string; created_at: string; approved_at: string; remarks: string; proof_url: string; source: string }>;
  summary: { total_fees: number; total_paid: number; pending: number };
  message: string;
}

// CSV download helper
function downloadCSV(data: string[][], filename: string) {
  const csv = data.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(n: number) {
  return `Rs.${(n || 0).toLocaleString("en-IN")}`;
}

export default function AdminAccounts() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [centerTransactions, setCenterTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState("transactions");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_phone: "", amount: "", transaction_type: "credit", payment_mode: "bank_transfer", utr_number: "", account_details: "", notes: "", proof_url: "" });
  const [lookupName, setLookupName] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [summary, setSummary] = useState<{ total_collected: number; total_pending: number } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [rejectModal, setRejectModal] = useState<{id: number; show: boolean}>({id: 0, show: false});
  const [rejectReason, setRejectReason] = useState("");
  const [stmtPhone, setStmtPhone] = useState("");
  const [statement, setStatement] = useState<StudentStatement | null>(null);
  const [stmtLoading, setStmtLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedTxns, setSelectedTxns] = useState<number[]>([]);
  const [selectedFees, setSelectedFees] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [receiptMap, setReceiptMap] = useState<Record<number, number>>({});
  const [downloadingReceipt, setDownloadingReceipt] = useState<number | null>(null);
  const user = getUser();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  const toggleTxnSelect = (id: number) => setSelectedTxns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleFeeSelect = (id: number) => setSelectedFees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllTxns = () => setSelectedTxns(prev => prev.length === transactions.length ? [] : transactions.map(t => t.id));
  const toggleAllFees = () => setSelectedFees(prev => prev.length === feePayments.length ? [] : feePayments.map(p => p.id));

  const bulkDeleteTxns = async () => {
    if (!selectedTxns.length || !confirm(`Are you sure you want to delete ${selectedTxns.length} transaction(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await api.post("/api/accounts/transactions/bulk-delete", { ids: selectedTxns });
      setSelectedTxns([]);
      load();
    } catch (err: any) { alert(err?.response?.data?.detail || "Failed to delete"); }
    setBulkDeleting(false);
  };

  const bulkDeleteFees = async () => {
    if (!selectedFees.length || !confirm(`Are you sure you want to delete ${selectedFees.length} fee payment(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await api.post("/api/accounts/fee-payments/bulk-delete", { ids: selectedFees });
      setSelectedFees([]);
      load();
    } catch (err: any) { alert(err?.response?.data?.detail || "Failed to delete"); }
    setBulkDeleting(false);
  };

  const load = () => {
    api.get("/api/accounts/transactions?center_only=false").then((r) => setTransactions(r.data.transactions || []));
    api.get("/api/accounts/transactions?center_only=true").then((r) => setCenterTransactions(r.data.transactions || [])).catch(() => {});
    api.get("/api/accounts/add-money").then((r) => setSummary(r.data)).catch(() => {});
    api.get("/api/accounts/fee-payments").then((r) => setFeePayments(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get("/api/accounts/receipts").then((r) => {
      const map: Record<number, number> = {};
      (Array.isArray(r.data) ? r.data : []).forEach((rc: any) => { if (rc.transaction_id) map[rc.transaction_id] = rc.id; });
      setReceiptMap(map);
    }).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  // Auto-lookup student name when phone number changes
  useEffect(() => {
    if (form.student_phone.length >= 10) {
      setLookupLoading(true);
      const timer = setTimeout(() => {
        api.get(`/api/students/lookup/by-phone/${form.student_phone}`)
          .then(r => setLookupName(r.data.name || null))
          .catch(() => setLookupName(null))
          .finally(() => setLookupLoading(false));
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setLookupName(null);
    }
  }, [form.student_phone]);

  const handleSave = async () => {
    if (!form.student_phone || !form.amount) { alert("Mobile number and amount are required"); return; }
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/api/accounts/transactions", {
        student_phone: form.student_phone,
        amount: parseFloat(form.amount),
        transaction_type: form.transaction_type,
        payment_mode: form.payment_mode,
        utr_number: form.utr_number,
        notes: form.notes,
        proof_url: form.proof_url,
      });
      setShowForm(false);
      setForm({ student_phone: "", amount: "", transaction_type: "credit", payment_mode: "bank_transfer", utr_number: "", account_details: "", notes: "", proof_url: "" });
      setLookupName(null);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
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

  const pendingPayments = feePayments.filter(p => p.status === "pending");

  const approvePayment = async (pid: number) => {
    if (!confirm("Are you sure you want to approve this payment?")) return;
    try {
      await api.put(`/api/accounts/fee-payments/${pid}/approve`);
      load();
    } catch { /* empty */ }
  };

  const rejectPayment = async () => {
    try {
      await api.put(`/api/accounts/fee-payments/${rejectModal.id}/reject`, { reason: rejectReason });
      setRejectModal({id: 0, show: false});
      setRejectReason("");
      load();
    } catch { /* empty */ }
  };

  const searchStatement = async () => {
    if (!stmtPhone.trim()) return;
    setStmtLoading(true);
    try {
      const res = await api.get(`/api/accounts/student-statement?phone=${stmtPhone.trim()}`);
      setStatement(res.data);
    } catch { setStatement(null); }
    setStmtLoading(false);
  };

  const deleteTransaction = async (tid: number) => {
    if (!confirm("Are you sure you want to delete this transaction? This cannot be undone.")) return;
    setDeletingId(tid);
    try {
      await api.delete(`/api/accounts/transactions/${tid}`);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to delete");
    }
    setDeletingId(null);
  };

  const downloadReceipt = async (receiptId: number) => {
    setDownloadingReceipt(receiptId);
    try {
      const res = await api.get(`/api/accounts/receipt-data/${receiptId}`);
      const d = res.data;
      const b = d.branding || {};
      const s = d.student || {};
      const p = d.payment || {};
      const f = d.fee_summary || {};
      const fmtD = d.date ? new Date(d.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '';
      const fmtAmt = (v: number) => new Intl.NumberFormat('en-IN').format(v);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${d.receipt_no}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#e2e8f0;padding:30px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:800px;margin:0 auto;background:#fff;position:relative;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.15)}
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:110px;font-weight:900;color:rgba(30,64,175,0.03);letter-spacing:10px;pointer-events:none;z-index:0}
.accent-bar{height:6px;background:linear-gradient(90deg,#1e40af 0%,#7c3aed 40%,#ec4899 70%,#f97316 100%)}
.header{padding:35px 40px 25px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e40af;position:relative;z-index:1}
.header-left h1{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-0.3px}
.header-left .tagline{font-size:11px;color:#64748b;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;margin-top:3px}
.header-left .contact{font-size:11px;color:#94a3b8;margin-top:6px}
.header-right{text-align:right}
.header-right .receipt-title{font-size:13px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:2px}
.header-right .receipt-no{font-size:22px;font-weight:900;color:#1e40af;margin-top:2px}
.header-right .receipt-date{font-size:12px;color:#64748b;margin-top:4px}
.status-bar{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #bbf7d0;padding:12px 40px;display:flex;align-items:center;gap:10px;position:relative;z-index:1}
.status-badge{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#16a34a}
.dot{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.content{padding:30px 40px;position:relative;z-index:1}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
.info-section{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden}
.sec-title{background:linear-gradient(135deg,#1e293b,#334155);color:#fff;padding:12px 18px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
.sec-body{padding:16px 18px}
.info-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed #e2e8f0;font-size:12px}
.info-row:last-child{border-bottom:none}
.lbl{color:#64748b;font-weight:500}
.val{color:#1e293b;font-weight:600;text-align:right}
.amount-box{background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:14px;padding:28px 30px;display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;position:relative;overflow:hidden}
.amount-box::after{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08)}
.amount-left .amount-label{font-size:13px;color:rgba(255,255,255,0.75);font-weight:500;margin-bottom:4px}
.amount-left .amount-value{font-size:36px;font-weight:900;color:#fff;letter-spacing:-1px}
.amount-right{text-align:right}
.amount-right .mode{font-size:13px;color:rgba(255,255,255,0.8);font-weight:500}
.amount-right .mode-val{font-size:16px;color:#fff;font-weight:700;margin-top:2px}
.amount-right .utr{font-size:11px;color:rgba(255,255,255,0.6);margin-top:8px}
.amount-right .utr-val{font-size:12px;color:rgba(255,255,255,0.9);font-weight:600}
.fee-cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px}
.fee-card{border-radius:12px;padding:18px 16px;text-align:center}
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
.progress-wrap{margin-bottom:28px}
.progress-header{display:flex;justify-content:space-between;margin-bottom:6px}
.progress-header span{font-size:11px;font-weight:600;color:#64748b}
.progress-bar{height:8px;background:#e2e8f0;border-radius:100px;overflow:hidden}
.progress-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,#22c55e,#16a34a)}
.footer{background:#f8fafc;border-top:2px solid #e2e8f0;padding:25px 40px;text-align:center}
.footer .disclaimer{font-size:11px;color:#94a3b8;font-weight:500;margin-bottom:8px}
.footer .company-info{font-size:11px;color:#b0b8c4}
.footer .powered{margin-top:12px;font-size:10px;color:#cbd5e1}
@media print{body{padding:0;background:#fff}.page{box-shadow:none;max-width:100%}@page{margin:0;size:A4}}
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
    <div class="receipt-date">${fmtD}</div>
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
      </div>
    </div>
    <div class="info-section">
      <div class="sec-title">Academic Details</div>
      <div class="sec-body">
        ${s.university ? '<div class="info-row"><span class="lbl">University</span><span class="val">'+s.university+'</span></div>' : ''}
        ${s.course ? '<div class="info-row"><span class="lbl">Course</span><span class="val">'+s.course+'</span></div>' : ''}
        ${s.branch ? '<div class="info-row"><span class="lbl">Branch</span><span class="val">'+s.branch+'</span></div>' : ''}
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
    <div class="fee-card total-card"><div class="fc-label">Total Fees</div><div class="fc-amt">&#8377;${fmtAmt(Number(f.total_fees||0))}</div></div>
    <div class="fee-card paid-card"><div class="fc-label">Total Paid</div><div class="fc-amt">&#8377;${fmtAmt(Number(f.total_paid||0))}</div></div>
    <div class="fee-card pending-card"><div class="fc-label">Balance Due</div><div class="fc-amt">&#8377;${fmtAmt(Number(f.pending||0))}</div></div>
  </div>
  <div class="progress-wrap">
    <div class="progress-header"><span>Payment Progress</span><span>${f.total_fees > 0 ? Math.round((Number(f.total_paid||0)/Number(f.total_fees))*100) : 0}%</span></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${f.total_fees > 0 ? Math.round((Number(f.total_paid||0)/Number(f.total_fees))*100) : 0}%"></div></div>
  </div>
</div>
<div class="footer">
  <div class="disclaimer">${b.receipt_footer || 'This is a computer generated receipt.'}</div>
  <div class="company-info">${b.company_name || 'ASFF Education Hub'}${b.company_address ? ' &bull; '+b.company_address : ''}${b.company_phone ? ' &bull; '+b.company_phone : ''}</div>
  <div class="powered">Powered by Education Hub Management System</div>
</div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to load receipt data');
    }
    setDownloadingReceipt(null);
  };

  const deleteFeePayment = async (pid: number) => {
    if (!confirm("Are you sure you want to delete this fee payment? This cannot be undone.")) return;
    setDeletingId(pid);
    try {
      await api.delete(`/api/accounts/fee-payments/${pid}`);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to delete");
    }
    setDeletingId(null);
  };

  // ---- CSV Downloads ----
  const downloadTxnCSV = () => {
    const header = ["Date", "Student", "Phone", "Amount", "Type", "Payment Mode", "UTR", "Notes"];
    const rows = transactions.map(t => [fmtDate(t.created_at), t.student_name || "", t.student_phone || "", t.amount.toString(), t.transaction_type, t.payment_mode, t.utr_number || "", t.notes || t.description || ""]);
    downloadCSV([header, ...rows], `transactions_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const downloadFeeCSV = () => {
    const header = ["Date", "Student", "Phone", "Amount", "Mode", "UTR", "Status", "Remarks", "Approved At", "Approved By"];
    const rows = feePayments.map(p => [fmtDate(p.created_at), p.student_name || "", p.student_phone || "", p.amount.toString(), p.payment_mode, p.utr_number || "", p.status, p.remarks || "", fmtDate(p.approved_at), p.approved_by_name || ""]);
    downloadCSV([header, ...rows], `online_payments_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const downloadStmtCSV = () => {
    if (!statement?.student) return;
    const s = statement.student;
    const header = ["Date", "Description", "Mode", "UTR", "Credit", "Debit", "Status", "Running Balance"];
    let balance = 0;
    const sorted = [...statement.payments].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    const rows = sorted.map(p => {
      const isCredit = p.status === "approved" || p.status === "completed";
      if (isCredit) balance += p.amount;
      return [fmtDate(p.created_at), p.source === "online" ? "Online Payment" : "Admin Entry", p.payment_mode?.toUpperCase() || "", p.utr_number || "", isCredit ? p.amount.toString() : "", !isCredit ? p.amount.toString() : "", p.status, balance.toString()];
    });
    const info = [["Student Statement - " + s.name], ["Phone: " + s.phone, "Email: " + s.email], ["University: " + (s.university_name || "")], ["Total Fees: " + fmtCurrency(statement.summary.total_fees), "Total Paid: " + fmtCurrency(statement.summary.total_paid), "Pending: " + fmtCurrency(statement.summary.pending)], []];
    downloadCSV([...info, header, ...rows], `statement_${s.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
  };

  // ---- PDF Downloads ----
  const downloadTxnPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text("A Step Forward Education Hub", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Transaction Report - ${new Date().toLocaleDateString("en-IN")}`, 14, 22);
    doc.setDrawColor(37, 99, 235);
    doc.line(14, 25, 196, 25);
    autoTable(doc, {
      startY: 30,
      head: [["Date", "Student", "Amount", "Type", "Mode", "UTR", "Notes"]],
      body: transactions.map(t => [fmtDate(t.created_at), t.student_name || "—", `${t.transaction_type === "credit" ? "+" : "-"}${fmtCurrency(t.amount)}`, t.transaction_type, t.payment_mode, t.utr_number || "—", t.notes || t.description || ""]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 255] },
    });
    doc.save(`transactions_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const downloadFeePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text("A Step Forward Education Hub", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Online Payments Report - ${new Date().toLocaleDateString("en-IN")}`, 14, 22);
    doc.setDrawColor(37, 99, 235);
    doc.line(14, 25, 196, 25);
    autoTable(doc, {
      startY: 30,
      head: [["Date", "Student", "Phone", "Amount", "Mode", "UTR", "Status", "Approved"]],
      body: feePayments.map(p => [fmtDate(p.created_at), p.student_name || "—", p.student_phone || "", fmtCurrency(p.amount), p.payment_mode, p.utr_number || "—", p.status.toUpperCase(), fmtDate(p.approved_at)]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      didParseCell: (data: any) => {
        if (data.column.index === 6 && data.section === "body") {
          const val = data.cell.raw as string;
          if (val === "APPROVED") data.cell.styles.textColor = [22, 163, 74];
          else if (val === "PENDING") data.cell.styles.textColor = [217, 119, 6];
          else if (val === "REJECTED") data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
    doc.save(`online_payments_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const downloadStmtPDF = () => {
    if (!statement?.student) return;
    const s = statement.student;
    const doc = new jsPDF();
    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255);
    doc.setFontSize(18);
    doc.text("STUDENT ACCOUNT STATEMENT", 14, 18);
    doc.setFontSize(10);
    doc.text("A Step Forward Education Hub", 14, 26);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 33);
    // Student Info Box
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(14, 46, 182, 38, 3, 3, "F");
    doc.setDrawColor(37, 99, 235);
    doc.roundedRect(14, 46, 182, 38, 3, 3, "S");
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.text(s.name, 20, 56);
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Phone: ${s.phone}  |  Email: ${s.email || "—"}`, 20, 63);
    doc.text(`University: ${s.university_name || "—"}  |  Course: ${s.course_name || "—"}`, 20, 75);
    // Summary Boxes
    const sumY = 92;
    const boxW = 58;
    // Total Fees
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, sumY, boxW, 22, 2, 2, "F");
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(8);
    doc.text("Total Fees", 18, sumY + 8);
    doc.setFontSize(14);
    doc.text(fmtCurrency(statement.summary.total_fees), 18, sumY + 17);
    // Total Paid
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(76, sumY, boxW, 22, 2, 2, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(8);
    doc.text("Total Paid", 80, sumY + 8);
    doc.setFontSize(14);
    doc.text(fmtCurrency(statement.summary.total_paid), 80, sumY + 17);
    // Pending
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(138, sumY, boxW, 22, 2, 2, "F");
    doc.setTextColor(217, 119, 6);
    doc.setFontSize(8);
    doc.text("Balance Due", 142, sumY + 8);
    doc.setFontSize(14);
    doc.text(fmtCurrency(statement.summary.pending), 142, sumY + 17);
    // Statement Table
    let balance = 0;
    const sorted = [...statement.payments].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    const tableData = sorted.map(p => {
      const isCredit = p.status === "approved" || p.status === "completed";
      if (isCredit) balance += p.amount;
      return [fmtDate(p.created_at), p.source === "online" ? "Online Payment" : "Admin Entry", p.payment_mode?.toUpperCase() || "—", p.utr_number || "—", isCredit ? fmtCurrency(p.amount) : "—", !isCredit ? fmtCurrency(p.amount) : "—", p.status.toUpperCase(), fmtCurrency(balance)];
    });
    autoTable(doc, {
      startY: sumY + 30,
      head: [["Date", "Description", "Mode", "UTR/Ref", "Credit", "Debit", "Status", "Balance"]],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 250, 255] },
      columnStyles: { 4: { halign: "right", textColor: [22, 163, 74] }, 5: { halign: "right", textColor: [220, 38, 38] }, 7: { halign: "right", fontStyle: "bold" } },
      didParseCell: (data: any) => {
        if (data.column.index === 6 && data.section === "body") {
          const val = data.cell.raw as string;
          if (val === "APPROVED" || val === "COMPLETED") data.cell.styles.textColor = [22, 163, 74];
          else if (val === "PENDING") data.cell.styles.textColor = [217, 119, 6];
          else if (val === "REJECTED") data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("This is a computer-generated statement from A Step Forward Education Hub. For queries, contact the admin office.", 14, 287);
      doc.text(`Page ${i} of ${pageCount}`, 180, 287);
    }
    doc.save(`statement_${s.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const tabs = [
    { id: "transactions", label: "Transactions", count: transactions.length },
    { id: "center-fees", label: "Center Fees", count: centerTransactions.length },
    { id: "online-fees", label: "Online Payments", count: feePayments.length, badge: pendingPayments.length },
    { id: "student-statement", label: "Student Statement" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><IndianRupee className="h-6 w-6 text-blue-600" /> Accounts</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      {/* Pending Payment Alert Banner */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">{pendingPayments.length} Payment{pendingPayments.length > 1 ? "s" : ""} Pending Approval</p>
            <p className="text-sm text-amber-700">Students have submitted fee payments that need your approval.</p>
          </div>
          <button onClick={() => setTab("online-fees")} className="text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 font-medium whitespace-nowrap">
            Review Now
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-600">Total Fees</p>
            <p className="text-2xl font-bold text-blue-800">₹{(summary as any).total_fees?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-600">Total Received</p>
            <p className="text-2xl font-bold text-green-800">₹{(summary as any).total_paid?.toLocaleString() || summary.total_collected?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">Total Pending</p>
            <p className="text-2xl font-bold text-red-800">₹{summary.total_pending?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm text-purple-600">Collection %</p>
            <p className="text-2xl font-bold text-purple-800">{(summary as any).total_fees > 0 ? Math.round(((summary as any).total_paid || summary.total_collected || 0) / (summary as any).total_fees * 100) : 0}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-2 ${tab === t.id ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-900"}`}>
            {t.label}
            {t.count !== undefined && <span className="text-xs text-gray-400">({t.count})</span>}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && selectedTxns.length > 0 && (
                <button onClick={bulkDeleteTxns} disabled={bulkDeleting} className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-xs font-medium disabled:opacity-50">
                  <Trash2 className="h-3 w-3" /> {bulkDeleting ? "Deleting..." : `Delete ${selectedTxns.length}`}
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={downloadTxnCSV} className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 text-xs font-medium border border-green-200">
                <Download className="h-3 w-3" /> CSV
              </button>
              <button onClick={downloadTxnPDF} className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 text-xs font-medium border border-red-200">
                <Download className="h-3 w-3" /> PDF
              </button>
            </div>
          </div>
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {isAdmin && <th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedTxns.length === transactions.length && transactions.length > 0} onChange={toggleAllTxns} className="rounded" /></th>}
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">UTR</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Mode</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Proof</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Date</th>
                {isAdmin && <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className={`hover:bg-gray-50 ${selectedTxns.includes(t.id) ? "bg-blue-50" : ""}`}>
                  {isAdmin && <td className="px-4 py-3 w-10"><input type="checkbox" checked={selectedTxns.includes(t.id)} onChange={() => toggleTxnSelect(t.id)} className="rounded" /></td>}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${t.transaction_type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                        <Wallet className={`h-4 w-4 ${t.transaction_type === "credit" ? "text-green-600" : "text-red-600"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.student_name || "—"}</p>
                        {t.student_phone && <p className="text-xs text-blue-600 font-mono">{t.student_phone}</p>}
                        <p className="text-xs text-gray-500">{t.notes || t.description || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-sm">
                    <span className={t.transaction_type === "credit" ? "text-green-600" : "text-red-600"}>
                      {t.transaction_type === "credit" ? "+" : "-"}₹{t.amount?.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell"><span className={`text-xs px-2 py-1 rounded-full ${t.transaction_type === "credit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.transaction_type}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{t.utr_number || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{t.payment_mode}</td>
                  <td className="px-4 py-3 text-sm hidden lg:table-cell">
                    {t.proof_url ? <a href={API + t.proof_url} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 inline-flex items-center gap-1"><FileText className="h-3 w-3" />Proof</a> : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{t.created_at?.split("T")[0]}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {receiptMap[t.id] && (
                          <button onClick={() => downloadReceipt(receiptMap[t.id])} disabled={downloadingReceipt === receiptMap[t.id]} className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs font-medium disabled:opacity-50 shadow-sm">
                            <Download className="h-3.5 w-3.5" /> Receipt
                          </button>
                        )}
                        <button onClick={() => deleteTransaction(t.id)} disabled={deletingId === t.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && <div className="p-8 text-center text-gray-500">No transactions found</div>}
        </div>
      )}

      {/* Center Fees Tab - Only center student transactions */}
      {tab === "center-fees" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" /> Center Students Fee Collection
            </h3>
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">{centerTransactions.length} transactions</span>
          </div>
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
            <strong>Note:</strong> Fees for center students can only be collected by the center or the student themselves. Admin cannot collect fees for center students.
          </div>
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Center</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Mode</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">UTR</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {centerTransactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{t.student_name || "—"}</p>
                      {t.student_phone && <p className="text-xs text-blue-600 font-mono">{t.student_phone}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{t.center_name || "—"}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-sm text-green-600">+₹{t.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{t.payment_mode || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{t.utr_number || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{t.created_at?.split("T")[0]}</td>
                  <td className="px-4 py-3 text-right">
                    {receiptMap[t.id] && (
                      <button onClick={() => downloadReceipt(receiptMap[t.id])} disabled={downloadingReceipt === receiptMap[t.id]} className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs font-medium disabled:opacity-50 shadow-sm">
                        <Download className="h-3.5 w-3.5" /> Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {centerTransactions.length === 0 && <div className="p-8 text-center text-gray-500">No center fee transactions found</div>}
        </div>
      )}

      {/* Online Fees Payment Tab - ONLY fee_payments */}
      {tab === "online-fees" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              {isAdmin && <input type="checkbox" checked={selectedFees.length === feePayments.length && feePayments.length > 0} onChange={toggleAllFees} className="rounded" />}
              Online Fee Payments from Students
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && selectedFees.length > 0 && (
                <button onClick={bulkDeleteFees} disabled={bulkDeleting} className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-xs font-medium disabled:opacity-50">
                  <Trash2 className="h-3 w-3" /> {bulkDeleting ? "Deleting..." : `Delete ${selectedFees.length}`}
                </button>
              )}
              <button onClick={downloadFeeCSV} className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 text-xs font-medium border border-green-200">
                <Download className="h-3 w-3" /> CSV
              </button>
              <button onClick={downloadFeePDF} className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 text-xs font-medium border border-red-200">
                <Download className="h-3 w-3" /> PDF
              </button>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{pendingPayments.length} Pending</span>
            </div>
          </div>
          {feePayments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No online fee payments yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {feePayments.map((p) => (
                <div key={p.id} className={`px-4 py-4 hover:bg-gray-50 ${p.status === "pending" ? "bg-amber-50 border-l-4 border-l-amber-400" : ""} ${selectedFees.includes(p.id) ? "bg-blue-50" : ""}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {isAdmin && <input type="checkbox" checked={selectedFees.includes(p.id)} onChange={() => toggleFeeSelect(p.id)} className="rounded flex-shrink-0" />}
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        p.status === "approved" ? "bg-green-100" : p.status === "rejected" ? "bg-red-100" : "bg-amber-100"
                      }`}>
                        {p.status === "approved" ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                         p.status === "rejected" ? <XCircle className="h-5 w-5 text-red-600" /> :
                         <Clock className="h-5 w-5 text-amber-600" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{p.student_name} <span className="text-xs text-gray-400 font-normal">{p.student_phone}</span></p>
                        <p className="text-sm text-gray-600">₹{p.amount?.toLocaleString()} via {p.payment_mode?.toUpperCase()}</p>
                        <p className="text-xs text-gray-400">
                          UTR: {p.utr_number || "N/A"} | {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", {day: "2-digit", month: "short", year: "numeric"}) : ""}
                        </p>
                        {p.remarks && <p className="text-xs text-gray-500 mt-1">Note: {p.remarks}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.proof_url && (
                        <a href={API + p.proof_url} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Proof
                        </a>
                      )}
                      {p.status === "pending" && (
                        <>
                          <button onClick={() => approvePayment(p.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 inline-flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                          <button onClick={() => setRejectModal({id: p.id, show: true})} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 inline-flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                      {p.status === "approved" && <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Approved</span>}
                      {p.status === "rejected" && (
                        <div>
                          <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full">Rejected</span>
                          {p.rejection_reason && <p className="text-xs text-red-500 mt-1">{p.rejection_reason}</p>}
                        </div>
                      )}
                      {isAdmin && (
                        <button onClick={() => deleteFeePayment(p.id)} disabled={deletingId === p.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student Statement Tab - Bank Statement Style */}
      {tab === "student-statement" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Phone className="h-5 w-5 text-blue-600" /> Search Student Statement</h3>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={stmtPhone} onChange={(e) => setStmtPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchStatement()}
                  placeholder="Enter student mobile number..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <button onClick={searchStatement} disabled={stmtLoading} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {stmtLoading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </div>
          </div>

          {statement && !statement.student && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{statement.message || "No student found"}</div>
          )}

          {statement && statement.student && (
            <>
              {/* Bank Statement Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                {/* Statement Header - like bank */}
                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-wide">ACCOUNT STATEMENT</h2>
                      <p className="text-blue-200 text-sm">A Step Forward Education Hub</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={downloadStmtCSV} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg hover:bg-white/30 text-xs font-medium border border-white/30">
                        <Download className="h-3 w-3" /> CSV
                      </button>
                      <button onClick={downloadStmtPDF} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg hover:bg-white/30 text-xs font-medium border border-white/30">
                        <Download className="h-3 w-3" /> PDF
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-blue-200 text-xs uppercase tracking-wider">Account Holder</p>
                      <p className="font-bold text-lg">{statement.student.name}</p>
                      <p className="text-blue-100">Phone: {statement.student.phone}</p>
                    </div>
                    <div className="space-y-1 md:text-right">
                      <p className="text-blue-200 text-xs uppercase tracking-wider">Contact Details</p>
                      <p className="text-blue-100">{statement.student.phone}</p>
                      <p className="text-blue-100">{statement.student.email}</p>
                    </div>
                  </div>
                  {(statement.student.university_name || statement.student.course_name) && (
                    <div className="mt-3 pt-3 border-t border-blue-500/50 text-sm text-blue-100">
                      {statement.student.university_name && <span>{statement.student.university_name}</span>}
                      {statement.student.course_name && <span> | {statement.student.course_name}</span>}
                    </div>
                  )}
                </div>

                {/* Summary Row - like bank balance row */}
                <div className="grid grid-cols-3 border-b">
                  <div className="p-4 text-center border-r">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Fees</p>
                    <p className="text-xl font-bold text-gray-900">₹{statement.summary.total_fees.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="p-4 text-center border-r bg-green-50/50">
                    <p className="text-xs text-green-600 uppercase tracking-wider mb-1">Total Paid</p>
                    <p className="text-xl font-bold text-green-700">₹{statement.summary.total_paid.toLocaleString("en-IN")}</p>
                  </div>
                  <div className={`p-4 text-center ${statement.summary.pending > 0 ? "bg-red-50/50" : "bg-green-50/50"}`}>
                    <p className={`text-xs uppercase tracking-wider mb-1 ${statement.summary.pending > 0 ? "text-red-600" : "text-green-600"}`}>Balance Due</p>
                    <p className={`text-xl font-bold ${statement.summary.pending > 0 ? "text-red-700" : "text-green-700"}`}>₹{statement.summary.pending.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Statement Date Range */}
                <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex justify-between">
                  <span>Statement as on: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  <span>{statement.payments.length} transaction(s)</span>
                </div>

                {/* Transaction Table - bank style */}
                {statement.payments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No transactions found for this student</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Mode</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">UTR/Ref No.</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-green-700 uppercase tracking-wider">Credit</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-red-700 uppercase tracking-wider">Debit</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          let runningBalance = 0;
                          const sorted = [...statement.payments].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
                          return sorted.map((p, i) => {
                            const isCredit = p.status === "approved" || p.status === "completed";
                            if (isCredit) runningBalance += p.amount;
                            return (
                              <tr key={i} className={`hover:bg-blue-50/30 ${p.status === "pending" ? "bg-amber-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap font-mono">{fmtDate(p.created_at)}</td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-gray-800">{p.source === "online" ? "Online Fee Payment" : "Admin Transaction"}</p>
                                  {p.remarks && <p className="text-xs text-gray-500">{p.remarks}</p>}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{p.payment_mode?.toUpperCase() || "—"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 font-mono hidden md:table-cell">{p.utr_number || "—"}</td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-green-700 whitespace-nowrap">{isCredit ? `₹${p.amount.toLocaleString("en-IN")}` : ""}</td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 whitespace-nowrap">{!isCredit ? `₹${p.amount.toLocaleString("en-IN")}` : ""}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    p.status === "approved" || p.status === "completed" ? "bg-green-100 text-green-700" :
                                    p.status === "pending" ? "bg-amber-100 text-amber-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>{p.status.toUpperCase()}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 whitespace-nowrap">₹{runningBalance.toLocaleString("en-IN")}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                      <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-700 text-right">TOTAL:</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-green-700">₹{statement.summary.total_paid.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-red-600">—</td>
                          <td></td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">₹{statement.summary.total_paid.toLocaleString("en-IN")}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Footer - like bank statement */}
                <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-400 flex items-center justify-between">
                  <span>This is a computer-generated statement. For queries, contact the admin office.</span>
                  <span>Generated: {new Date().toLocaleString("en-IN")}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Reject Payment</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection (optional)" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none mb-4" rows={3} />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal({id: 0, show: false}); setRejectReason(""); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={rejectPayment} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Transaction</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Mobile Number *</label>
                <input type="text" value={form.student_phone} onChange={(e) => setForm({ ...form, student_phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Enter 10-digit mobile number" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" maxLength={10} />
                {lookupLoading && <p className="text-xs text-blue-500 mt-1">Looking up student...</p>}
                {lookupName && <p className="text-xs text-green-600 mt-1 font-medium">✓ Student: {lookupName}</p>}
                {form.student_phone.length >= 10 && !lookupLoading && !lookupName && <p className="text-xs text-red-500 mt-1">✗ No student found with this number</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                    <option value="credit">Credit (Received)</option><option value="debit">Debit (Paid)</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                    <option value="bank_transfer">Bank Transfer</option><option value="upi">UPI</option><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="online">Online</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">UTR Number</label><input type="text" value={form.utr_number} onChange={(e) => setForm({ ...form, utr_number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" rows={2} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Proof</label>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 text-sm w-fit">
                  <Upload className="h-4 w-4" /> {uploadingProof ? "Uploading..." : form.proof_url ? "Proof Uploaded" : "Choose File"}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofUpload} disabled={uploadingProof} />
                </label>
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{saving ? "Saving..." : "Save Transaction"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
