"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

interface EnrollmentData {
  id: string;
  status: string;
  feeType: string;
  feeAmount: number;
  paymentStatus: string;
  batch: { name: string; program: { title: string; mode: string; duration: number } };
  student: { name: string; email: string };
}

interface PaymentSettings {
  cashPaymentEnabled: boolean;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
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
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cash">("razorpay");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [paySettings, setPaySettings] = useState<PaymentSettings>({ cashPaymentEnabled: false });

  useEffect(() => {
    if (!enrollmentId) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/student-payment?enrollmentId=${enrollmentId}`).then(r => r.ok ? r.json() : null),
      fetch("/api/settings/public").then(r => r.ok ? r.json() : { settings: {} }),
    ]).then(([data, settingsData]) => {
      setEnrollment(data);
      const s = settingsData.settings || settingsData || {};
      setPaySettings({ cashPaymentEnabled: s.cash_payment_enabled === "true" });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [enrollmentId]);

  const handleRazorpayPayment = async () => {
    if (!enrollment) return;
    setProcessing(true); setError("");

    if (!razorpayReady || !window.Razorpay) {
      setError("Payment gateway is loading. Please wait a moment and try again.");
      setProcessing(false);
      return;
    }

    try {
      const orderRes = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, amount: enrollment.feeAmount }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Failed to create payment order");
        setProcessing(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "KKHS Media Private Limited",
        description: `Fee: ${enrollment.batch.program.title}`,
        order_id: orderData.orderId,
        prefill: {
          name: enrollment.student.name,
          email: enrollment.student.email,
        },
        theme: { color: "#0EA5B8" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                enrollmentId,
                amount: enrollment.feeAmount,
              }),
            });
            if (verifyRes.ok) {
              setSuccess(true);
            } else {
              const d = await verifyRes.json();
              setError(d.error || "Payment verification failed");
            }
          } catch {
            setError("Payment verification failed. Contact admin with your payment ID.");
          }
          setProcessing(false);
        },
        modal: {
          ondismiss: () => { setProcessing(false); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Payment initialization failed: ${msg}. Please refresh and try again.`);
      setProcessing(false);
    }
  };

  const handleCashPayment = async () => {
    if (!enrollment) return;
    setProcessing(true); setError("");
    try {
      const res = await fetch("/api/student-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          paymentMethod: "cash",
          transactionId: `CASH-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPendingCash(true);
      } else {
        setError(data.error || "Failed to submit cash payment request");
      }
    } catch { setError("Network error"); }
    setProcessing(false);
  };

  const handlePayment = () => {
    if (paymentMethod === "cash" && paySettings.cashPaymentEnabled) {
      handleCashPayment();
    } else {
      handleRazorpayPayment();
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5B8]"></div>
    </div>
  );

  if (!enrollmentId || !enrollment) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">❌</p>
        <h2 className="text-xl font-bold text-white">Invalid Payment Link</h2>
        <p className="text-slate-500 mt-2">This payment link is invalid or expired.</p>
      </div>
    </div>
  );

  if (enrollment.paymentStatus === "completed" || success) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-emerald-400">Payment Successful!</h2>
        <p className="text-slate-400 mt-2">Your offer letter has been generated and sent to your email.</p>
        <p className="text-slate-500 text-sm mt-1">Check your email or go to Letters page to download.</p>
        <a href="/dashboard/letters" className="inline-block mt-6 px-6 py-3 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2] font-medium transition">View My Letters</a>
      </div>
    </div>
  );

  if (pendingCash) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🕐</span>
        </div>
        <h2 className="text-2xl font-bold text-amber-400">Cash Payment Submitted</h2>
        <p className="text-slate-400 mt-2">Your cash payment request of <strong className="text-white">₹{enrollment.feeAmount.toLocaleString()}</strong> has been submitted.</p>
        <p className="text-slate-500 text-sm mt-2">Admin will verify and approve your cash payment. Once approved, your offer letter will be generated automatically.</p>
        <a href="/dashboard" className="inline-block mt-6 px-6 py-3 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2] font-medium transition">Go to Dashboard</a>
      </div>
    </div>
  );

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setRazorpayReady(true)} onLoad={() => setRazorpayReady(true)} />
      <div className="max-w-lg mx-auto py-8">
        <div className="rounded-2xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0EA5B8] to-[#a78bfa] p-6 text-white text-center">
            <p className="text-sm opacity-80">Internship Fee Payment</p>
            <p className="text-4xl font-bold mt-2">₹{enrollment.feeAmount.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-1">{enrollment.batch.program.title}</p>
          </div>

          {/* Details */}
          <div className="p-6">
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Student</p><p className="font-medium text-white">{enrollment.student.name}</p></div>
                <div><p className="text-slate-500">Program</p><p className="font-medium text-white">{enrollment.batch.program.title}</p></div>
                <div><p className="text-slate-500">Mode</p><p className="font-medium text-white capitalize">{enrollment.batch.program.mode}</p></div>
                <div><p className="text-slate-500">Duration</p><p className="font-medium text-white">{enrollment.batch.program.duration} days</p></div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              {paySettings.cashPaymentEnabled ? (
                <>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Choose Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Razorpay Option */}
                    <button onClick={() => setPaymentMethod("razorpay")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === "razorpay" ? 'border-[#0EA5B8] bg-[#0EA5B8]/10 ring-1 ring-[#0EA5B8]/30' : 'border-white/[0.08] hover:border-white/20'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">💳</span>
                        <span className={`text-sm font-bold ${paymentMethod === "razorpay" ? 'text-[#22d3ee]' : 'text-slate-300'}`}>Pay Online</span>
                      </div>
                      <p className="text-xs text-slate-500">UPI, Cards, Net Banking, Wallets</p>
                      <div className="flex gap-1 mt-2">
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">GPay</span>
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">PhonePe</span>
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">Cards</span>
                      </div>
                    </button>

                    {/* Cash Option */}
                    <button onClick={() => setPaymentMethod("cash")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === "cash" ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30' : 'border-white/[0.08] hover:border-white/20'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">💵</span>
                        <span className={`text-sm font-bold ${paymentMethod === "cash" ? 'text-amber-400' : 'text-slate-300'}`}>Pay Cash</span>
                      </div>
                      <p className="text-xs text-slate-500">Pay at office in person</p>
                      <div className="flex gap-1 mt-2">
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">Office</span>
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">In-Person</span>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-[#0EA5B8]/10 border border-[#0EA5B8]/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-[#22d3ee] mb-1">💳 Secure Online Payment</p>
                  <p className="text-xs text-[#22d3ee]/70">Powered by Razorpay. Pay securely using UPI, Debit/Credit Card, Net Banking, or Wallets. Your offer letter will be generated instantly after payment.</p>
                </div>
              )}
            </div>

            {/* Cash Info — only when cash enabled and selected */}
            {paySettings.cashPaymentEnabled && paymentMethod === "cash" && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-400 mb-1">💵 Cash Payment</p>
                <p className="text-xs text-amber-300/70">Pay the fee amount at the office. Admin will verify and approve your payment. Your offer letter will be generated after approval.</p>
              </div>
            )}

            {/* Razorpay Info — when cash is enabled and razorpay selected */}
            {paySettings.cashPaymentEnabled && paymentMethod === "razorpay" && (
              <div className="mb-6 bg-[#0EA5B8]/10 border border-[#0EA5B8]/30 rounded-xl p-4">
                <p className="text-sm font-medium text-[#22d3ee] mb-1">💳 Secure Online Payment</p>
                <p className="text-xs text-[#22d3ee]/70">Powered by Razorpay. Pay securely using UPI, Debit/Credit Card, Net Banking, or Wallets. Your offer letter will be generated instantly after payment.</p>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">{error}</p>}

            <button onClick={handlePayment} disabled={processing}
              className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all ${processing ? 'bg-slate-600 cursor-not-allowed text-slate-400' : paymentMethod === "razorpay" ? 'bg-gradient-to-r from-[#0EA5B8] to-[#0891b2] hover:from-[#0891b2] hover:to-[#0EA5B8] text-white shadow-lg shadow-[#0EA5B8]/20 transform hover:scale-[1.02]' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 transform hover:scale-[1.02]'}`}>
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Processing...
                </span>
              ) : (paySettings.cashPaymentEnabled && paymentMethod === "cash")
                ? `Submit Cash Payment — ₹${enrollment.feeAmount.toLocaleString()}`
                : `Pay Now — ₹${enrollment.feeAmount.toLocaleString()}`
              }
            </button>

            <p className="text-center text-xs text-slate-500 mt-4">
              {(paySettings.cashPaymentEnabled && paymentMethod === "cash") ? "Cash payment requires admin approval" : "🔒 Secured by Razorpay • 256-bit encrypted"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
