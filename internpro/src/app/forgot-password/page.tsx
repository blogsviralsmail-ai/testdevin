"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg border">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#0EA5B8] flex items-center justify-center text-white font-bold text-sm">IP</div>
          <span className="text-xl font-bold text-gray-900">InternPro</span>
        </div>

        {sent ? (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600 mb-6">If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link. Please check your inbox (and spam folder).</p>
            <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700 text-sm">
              ← Back to Login
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600 mb-6">Enter your email address and we&apos;ll send you a link to reset your password.</p>

            {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="you@example.com" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#0EA5B8] text-white py-3 rounded-lg font-semibold hover:bg-[#0891b2] disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center mt-4 text-gray-600 text-sm">
              Remember your password?{" "}
              <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Sign In</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
