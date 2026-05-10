"use client";

import { useState, useEffect } from "react";

export default function PaymentWall() {
  const [show, setShow] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [amount, setAmount] = useState(0);
  const [program, setProgram] = useState("");

  useEffect(() => {
    fetch("/api/my-enrollment")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.enrollment?.feeType === "paid" && data.enrollment.paymentStatus === "pending") {
          setShow(true);
          setEnrollmentId(data.enrollment.id);
          setAmount(data.enrollment.feeAmount || 0);
          setProgram(data.enrollment.batch?.program?.title || "");
        }
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-[slideUp_0.5s_ease-out]">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-white">Payment Required</h2>
          <p className="text-amber-100 text-sm mt-1">Complete payment to access your internship</p>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Congratulations on being selected for <strong className="text-gray-900">{program}</strong>! 
            Please complete the payment to access study materials, tasks, and your offer letter.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">Amount to Pay</p>
            <p className="text-3xl font-bold text-amber-600">₹{amount.toLocaleString()}</p>
          </div>
          <a href={`/dashboard/pay?enrollmentId=${enrollmentId}`}
            className="block w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg">
            Pay Now
          </a>
          <p className="text-xs text-gray-400 mt-3">Your offer letter will be generated immediately after payment</p>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
