"use client";

import { useState, useEffect } from "react";

interface PaymentBlockMessageProps {
  feature?: string; // e.g. "Offer Letter", "Study Material", etc.
}

export default function PaymentBlockMessage({ feature = "this content" }: PaymentBlockMessageProps) {
  const [enrollmentId, setEnrollmentId] = useState("");
  const [amount, setAmount] = useState(0);
  const [program, setProgram] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/my-enrollment")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.enrollment?.feeType === "paid" && data.enrollment.paymentStatus === "pending") {
          setShow(true);
          setEnrollmentId(data.enrollment.id);
          setAmount(data.enrollment.feeAmount || 0);
          setProgram(data.enrollment.batch?.program?.title || "Internship");
        }
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="max-w-lg w-full mx-auto animate-[fadeInUp_0.6s_ease-out]">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Top gradient strip */}
          <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 to-orange-500" />

          <div className="p-8 text-center">
            {/* Animated lock icon */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-50 to-amber-50 rounded-full flex items-center justify-center border-2 border-red-200">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Required to Access {feature}</h3>

            {/* Explanation */}
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              {feature} is locked because your fee payment is pending. Complete the payment of{" "}
              <span className="font-bold text-amber-600">₹{amount.toLocaleString()}</span> for{" "}
              <span className="font-semibold text-gray-700">{program}</span> to unlock full access to your internship — including offer letter, study materials, tasks, and more.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Unlock Now</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* What's locked */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Features locked until payment:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "📄", label: "Offer Letter" },
                  { icon: "🎥", label: "Study Material" },
                  { icon: "💼", label: "Workspace & Tasks" },
                  { icon: "🏆", label: "Certificates" },
                  { icon: "📊", label: "Progress Tracking" },
                  { icon: "📧", label: "Document Emails" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount + Pay button */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-4 border border-amber-200">
              <p className="text-xs text-amber-600 font-medium mb-1">Amount Due</p>
              <p className="text-3xl font-extrabold text-amber-600">₹{amount.toLocaleString()}</p>
            </div>

            <a
              href={`/dashboard/pay?enrollmentId=${enrollmentId}`}
              className="block w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              Complete Payment — ₹{amount.toLocaleString()}
            </a>

            <p className="text-xs text-gray-400 mt-3">
              UPI, Bank Transfer, Cash — multiple options available
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
