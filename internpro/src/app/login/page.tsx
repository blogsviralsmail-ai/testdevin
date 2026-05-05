"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const credentials: Record<string, { email: string; password: string }> = {
      admin: { email: "admin@internpro.com", password: "admin123" },
      organization: { email: "org@internpro.com", password: "admin123" },
      mentor: { email: "mentor@internpro.com", password: "mentor123" },
      student: { email: "student@internpro.com", password: "student123" },
    };
    const cred = credentials[role];
    if (cred) {
      setEmail(cred.email);
      setPassword(cred.password);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
        <div className="text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">IP</div>
            <span className="text-3xl font-bold">InternPro</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Manage Internships with Ease</h2>
          <p className="text-lg text-indigo-100 mb-8">
            Auto attendance, certificates, tasks, payments — everything managed in one platform.
          </p>
          <div className="space-y-4">
            {["Auto Offer Letter & Certificates", "QR & Online Attendance", "Pre-recorded Video LMS", "Stipend Auto-Calculation"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                <span className="text-indigo-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">IP</div>
            <span className="text-xl font-bold gradient-text">InternPro</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600 mb-8">Enter your credentials to access your dashboard</p>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-3 text-center">Quick Demo Login:</p>
            <div className="grid grid-cols-2 gap-2">
              {["admin", "organization", "mentor", "student"].map((role) => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition capitalize text-gray-600"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center mt-6 text-gray-600 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:text-indigo-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
