"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface EnrollmentData {
  id: string;
  status: string;
  feeType: string;
  feeAmount: number;
  paymentStatus: string;
  batch: { name: string; program: { title: string; mode: string; duration: number } };
  student: { name: string; email: string };
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const enrollmentId = searchParams.get("enrollmentId");
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pendingCash, setPendingCash] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (!enrollmentId) { setLoading(false); return; }
    fetch(`/api/student-payment?enrollmentId=${enrollmentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setEnrollment(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [enrollmentId]);

  const handlePayment = async () => {
    if (paymentMethod !== "cash" && !transactionId.trim()) {
      setError("Please enter transaction/reference ID");
      return;
    }
    setProcessing(true); setError("");
    try {
      const res = await fetch("/api/student-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          paymentMethod,
          transactionId: paymentMethod === "cash" ? `CASH-${Date.now()}` : transactionId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (paymentMethod === "cash") {
          setPendingCash(true);
        } else {
          setSuccess(true);
        }
      } else {
        setError(data.error || "Payment failed");
      }
    } catch { setError("Network error"); }
    setProcessing(false);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!enrollmentId || !enrollment) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">❌</p>
        <h2 className="text-xl font-bold text-gray-900">Invalid Payment Link</h2>
        <p className="text-gray-500 mt-2">This payment link is invalid or expired.</p>
      </div>
    </div>
  );

  if (enrollment.paymentStatus === "completed" || success) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
        <p className="text-gray-600 mt-2">Your offer letter has been generated and sent to your email.</p>
        <p className="text-gray-500 text-sm mt-1">Check your email or go to Letters page to download.</p>
        <a href="/dashboard/letters" className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition">View My Letters</a>
      </div>
    </div>
  );

  if (pendingCash) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🕐</span>
        </div>
        <h2 className="text-2xl font-bold text-amber-600">Cash Payment Submitted</h2>
        <p className="text-gray-600 mt-2">Your cash payment request of <strong>₹{enrollment.feeAmount.toLocaleString()}</strong> has been submitted.</p>
        <p className="text-gray-500 text-sm mt-2">Admin will verify and approve your cash payment. Once approved, your offer letter will be generated automatically.</p>
        <a href="/dashboard" className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition">Go to Dashboard</a>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
          <p className="text-sm opacity-80">Internship Fee Payment</p>
          <p className="text-4xl font-bold mt-2">₹{enrollment.feeAmount.toLocaleString()}</p>
          <p className="text-sm opacity-80 mt-1">{enrollment.batch.program.title}</p>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Student</p><p className="font-medium text-gray-900">{enrollment.student.name}</p></div>
              <div><p className="text-gray-500">Program</p><p className="font-medium text-gray-900">{enrollment.batch.program.title}</p></div>
              <div><p className="text-gray-500">Mode</p><p className="font-medium text-gray-900 capitalize">{enrollment.batch.program.mode}</p></div>
              <div><p className="text-gray-500">Duration</p><p className="font-medium text-gray-900">{enrollment.batch.program.duration} days</p></div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {v: "upi", l: "💳 UPI", desc: "Google Pay, PhonePe, Paytm"},
                {v: "bank", l: "🏦 Bank Transfer", desc: "NEFT/RTGS/IMPS"},
                {v: "cash", l: "💵 Cash", desc: "Pay at office"},
                {v: "other", l: "📱 Other", desc: "Card, Wallet, etc."},
              ].map(m => (
                <button key={m.v} onClick={() => setPaymentMethod(m.v)}
                  className={`p-3 rounded-lg border text-left transition-all ${paymentMethod === m.v ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-sm font-medium ${paymentMethod === m.v ? 'text-indigo-700' : 'text-gray-700'}`}>{m.l}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cash info or Transaction ID */}
          {paymentMethod === "cash" ? (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-1">💵 Cash Payment</p>
              <p className="text-xs text-amber-700">Pay the fee amount at the office. Admin will verify and approve your payment. Your offer letter will be generated after approval.</p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction / Reference ID *</label>
              <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter UTR/Transaction ID after payment"
                className="w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              <p className="text-xs text-gray-500 mt-1">Make the payment and enter the transaction ID here for verification</p>
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button onClick={handlePayment} disabled={processing}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'}`}>
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Processing...
              </span>
            ) : paymentMethod === "cash" 
              ? `Submit Cash Payment Request — ₹${enrollment.feeAmount.toLocaleString()}`
              : `Confirm Payment — ₹${enrollment.feeAmount.toLocaleString()}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
