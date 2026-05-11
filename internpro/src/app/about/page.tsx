"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface AboutData {
  heroTitle: string;
  heroSubtitle: string;
  mission: string;
  vision: string;
  story: string;
  values: { title: string; desc: string }[];
  stats: { value: string; label: string }[];
  team: { name: string; role: string; desc: string }[];
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export default function AboutPage() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/site-content?slug=about-us")
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

  const valueIcons = ["🎯", "🏆", "🌍", "🔍"];

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a', color: '#f1f5f9' }}>
      {/* Blob animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-40 w-96 h-96 rounded-full opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, #0EA5B8, transparent 70%)' }} />
        <div className="absolute bottom-20 -right-40 w-96 h-96 rounded-full opacity-15 animate-pulse" style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', animationDelay: '2s' }} />
      </div>

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
            <Link href="/about" className="text-sm text-white font-semibold transition">About Us</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-300 hover:text-white transition px-4 py-2">Login</Link>
            <Link href="/register" className="text-sm text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(14,165,184,0.3)]" style={{ background: 'linear-gradient(135deg, #0EA5B8, #0891b2)' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6" style={{ background: 'rgba(14,165,184,0.1)', border: '1px solid rgba(14,165,184,0.2)', color: '#22d3ee' }}>
            About Our Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa, #FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.heroTitle}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">{data.heroSubtitle}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {data.stats.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-3xl md:text-4xl font-bold" style={{ color: '#22d3ee' }}>{s.value}</p>
              <p className="text-sm text-slate-400 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 md:p-12 rounded-3xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-3xl font-bold mb-6" style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Our Story</h2>
            <p className="text-slate-300 leading-relaxed text-lg">{data.story}</p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(14,165,184,0.1), rgba(14,165,184,0.02))', border: '1px solid rgba(14,165,184,0.15)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6" style={{ background: 'rgba(14,165,184,0.15)' }}>🎯</div>
            <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
            <p className="text-slate-300 leading-relaxed">{data.mission}</p>
          </div>
          <div className="p-8 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.02))', border: '1px solid rgba(167,139,250,0.15)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6" style={{ background: 'rgba(167,139,250,0.15)' }}>🔭</div>
            <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
            <p className="text-slate-300 leading-relaxed">{data.vision}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {data.values.map((v, i) => (
              <div key={i} className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{valueIcons[i] || "💡"}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{v.title}</h4>
                    <p className="text-slate-400 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {data.team && data.team.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12" style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Our Team</h2>
            <div className="grid gap-6">
              {data.team.map((t, i) => (
                <div key={i} className="p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)' }}>🏢</div>
                  <h4 className="text-xl font-bold text-white">{t.name}</h4>
                  <p className="text-[#22d3ee] text-sm mb-3">{t.role}</p>
                  <p className="text-slate-400 max-w-lg mx-auto">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 md:p-12 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(14,165,184,0.1), rgba(167,139,250,0.05))', border: '1px solid rgba(14,165,184,0.15)' }}>
            <h2 className="text-3xl font-bold text-white mb-4">Get In Touch</h2>
            <p className="text-slate-400 mb-8">Have questions? We&apos;d love to hear from you.</p>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xl">📧</span>
                <span className="text-slate-300">{data.contactEmail}</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xl">📍</span>
                <span className="text-slate-300">{data.address}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)' }}>IP</div>
            <span className="text-sm text-slate-500">InternPro by KKHS Media</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/about" className="hover:text-white transition">About Us</Link>
            <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link>
          </div>
          <p className="text-sm text-slate-600">&copy; {new Date().getFullYear()} InternPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
