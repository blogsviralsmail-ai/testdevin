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


  return (
    <div className="min-h-screen flex bg-[#0a0e1a] relative overflow-hidden">
      {/* Organic Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px]" style={{borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', background: 'radial-gradient(ellipse, rgba(14,165,184,0.1), transparent 70%)', animation: 'morphBlob 15s ease-in-out infinite'}} />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px]" style={{borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%', background: 'radial-gradient(ellipse, rgba(167,139,250,0.08), transparent 70%)', animation: 'morphBlob 18s ease-in-out infinite reverse'}} />
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative" style={{background: 'linear-gradient(135deg, rgba(14,165,184,0.08), rgba(167,139,250,0.05))'}}>
        <div className="absolute inset-0" style={{background: 'linear-gradient(135deg, rgba(14,165,184,0.1) 0%, rgba(167,139,250,0.08) 50%, rgba(255,107,107,0.05) 100%)'}} />
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold text-white" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>IP</div>
            <span className="text-3xl font-bold gradient-text">InternPro</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-5 leading-tight">Manage Internships<br/>with Ease</h2>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            Auto attendance, certificates, tasks, payments &mdash; everything managed in one platform.
          </p>
          <div className="space-y-4">
            {["Auto Offer Letter & Certificates", "QR & Online Attendance", "Pre-recorded Video LMS", "Stipend Auto-Calculation"].map((item) => (
              <div key={item} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 transition-all group-hover:shadow-[0_0_15px_rgba(14,165,184,0.3)]" style={{background: 'rgba(14,165,184,0.15)', border: '1px solid rgba(14,165,184,0.2)', color: '#22d3ee'}}>&#10003;</div>
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>IP</div>
            <span className="text-xl font-bold gradient-text">InternPro</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 mb-8">Enter your credentials to access your dashboard</p>

          {error && (
            <div className="px-4 py-3 rounded-xl mb-6 text-sm" style={{background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5'}}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-white transition-all"
                style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-white transition-all"
                style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium transition-colors" style={{color: '#22d3ee'}}>Forgot Password?</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-[0_0_30px_rgba(14,165,184,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)'}}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-400 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium transition-colors" style={{color: '#22d3ee'}}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
