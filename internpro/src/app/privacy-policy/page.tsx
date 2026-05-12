"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface PolicyData {
  lastUpdated: string;
  sections: { title: string; body: string }[];
}

export default function PrivacyPolicyPage() {
  const [data, setData] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/site-content?slug=privacy-policy")
      .then(r => r.json())
      .then(d => { setData(JSON.parse(d.content)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e1a' }}>
      <div className="w-10 h-10 border-2 border-t-[#0EA5B8] border-white/10 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e1a', color: '#f1f5f9' }}>
      <p>Page not found</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a', color: '#f1f5f9' }}>
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50" style={{ background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)' }}>IP</div>
            <span className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>InternPro</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition">Home</Link>
            <Link href="/programs" className="text-sm text-slate-400 hover:text-white transition">Programs</Link>
            <Link href="/about" className="text-sm text-slate-400 hover:text-white transition">About Us</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-300 hover:text-white transition px-4 py-2">Login</Link>
            <Link href="/register" className="text-sm text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(14,165,184,0.3)]" style={{ background: 'linear-gradient(135deg, #0EA5B8, #0891b2)' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6" style={{ background: 'rgba(14,165,184,0.1)', border: '1px solid rgba(14,165,184,0.2)', color: '#22d3ee' }}>
              🔒 Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Privacy Policy</span>
            </h1>
            <p className="text-slate-500">Last updated: {data.lastUpdated}</p>
          </div>

          <div className="space-y-8">
            {data.sections.map((s, i) => (
              <div key={i} className="p-6 md:p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)' }}>{i + 1}</span>
                  {s.title}
                </h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)' }}>IP</div>
            <span className="text-sm text-slate-500">InternPro by KKHS Media</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/about" className="hover:text-white transition">About Us</Link>
            <Link href="/privacy-policy" className="hover:text-white transition text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link>
          </div>
          <p className="text-sm text-slate-600">&copy; {new Date().getFullYear()} InternPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
