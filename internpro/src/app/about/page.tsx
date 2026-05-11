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
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch("/api/site-content?slug=about-us")
      .then(r => r.json())
      .then(d => { setData(JSON.parse(d.content)); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/settings/public").then(r => r.ok ? r.json() : {}).then(setSettings).catch(() => {});
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
  const navLinks = [
    { href: "/", label: "Home" }, { href: "/programs", label: "Programs" }, { href: "/vacancies", label: "Openings" },
    { href: "/team", label: "Our Team" }, { href: "/contact", label: "Contact Us" }, { href: "/about", label: "About Us" },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a', color: '#f1f5f9' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-40 w-96 h-96 rounded-full opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, #0EA5B8, transparent 70%)' }} />
        <div className="absolute bottom-20 -right-40 w-96 h-96 rounded-full opacity-15 animate-pulse" style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', animationDelay: '2s' }} />
      </div>

      <nav className="fixed top-0 w-full z-50" style={{ background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {settings.company_logo ? <img src={settings.company_logo} alt="Logo" className="h-10 w-auto" /> : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>KM</div>}
            <span className="text-xl font-bold" style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{settings.company_name || "KKHS Media"}</span>
          </Link>
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 ${l.href === "/about" ? "text-white" : "text-slate-400 hover:text-white"}`}
                style={l.href === "/about" ? {background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 3px 0 #0a7c8a'} : {background: 'rgba(255,255,255,0.05)', boxShadow: '0 3px 0 rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'}}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1" style={{background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 0 #3730a3'}}>Login</Link>
            <Link href="/register" className="hidden sm:inline-flex text-sm text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1" style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 0 #0a7c8a'}}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6" style={{ background: 'rgba(14,165,184,0.1)', border: '1px solid rgba(14,165,184,0.2)', color: '#22d3ee' }}>
            About KKHS Media
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

      {/* Services */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold tracking-wider uppercase mb-4 inline-block" style={{color: '#FF6B6B'}}>Our Services</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">What We Offer</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {icon: "🌐", title: "Web Development", desc: "Custom websites and web applications that drive business growth."},
              {icon: "☁️", title: "Cloud Services", desc: "Scalable, secure cloud solutions for your business needs."},
              {icon: "🛡️", title: "Cyber Security", desc: "Protection, threat analysis, and comprehensive risk management."},
              {icon: "📢", title: "Digital Marketing", desc: "SEO, social media, and brand strategy for real results."},
              {icon: "📱", title: "App Development", desc: "Mobile and web apps with modern frameworks."},
              {icon: "🛒", title: "CMS & E-commerce", desc: "Dynamic web pages and e-commerce solutions."},
              {icon: "✨", title: "Generative AI", desc: "AI-driven tools for automation and content creation."},
              {icon: "🎨", title: "UI/UX Design", desc: "Beautiful, intuitive designs for web and mobile."},
            ].map((s) => (
              <div key={s.title} className="p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-base font-bold text-white mb-1">{s.title}</h3>
                <p className="text-slate-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.values.map((v, i) => (
              <div key={i} className="p-6 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-3xl mb-3">{valueIcons[i] || "⭐"}</div>
                <h3 className="text-lg font-bold text-white mb-2">{v.title}</h3>
                <p className="text-slate-400 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-10 rounded-3xl" style={{background: 'linear-gradient(135deg, rgba(14,165,184,0.1), rgba(167,139,250,0.05))', border: '1px solid rgba(14,165,184,0.15)'}}>
            <div className="w-20 h-20 mx-auto rounded-full mb-4 flex items-center justify-center text-3xl font-bold" style={{background: 'linear-gradient(135deg, rgba(14,165,184,0.3), rgba(167,139,250,0.3))', border: '2px solid rgba(14,165,184,0.4)'}}>HS</div>
            <h3 className="text-2xl font-bold text-white mb-1">Hari Soni</h3>
            <p className="text-sm mb-4" style={{color: '#a78bfa'}}>Founder & CEO</p>
            <p className="text-slate-400 max-w-lg mx-auto">{data.team[0]?.desc || "Visionary entrepreneur who founded KKHS Media in 2020. Leading innovation in digital solutions and internship management."}</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-3xl text-center" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
            <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center"><p className="text-2xl mb-2">📧</p><p className="text-slate-400 text-sm">{data.contactEmail}</p></div>
              <div className="text-center"><p className="text-2xl mb-2">📞</p><p className="text-slate-400 text-sm">{data.contactPhone}</p></div>
              <div className="text-center"><p className="text-2xl mb-2">📍</p><p className="text-slate-400 text-sm">{data.address}</p></div>
            </div>
            <div className="mt-6">
              <Link href="/contact" className="inline-flex text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1"
                style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 0 #0a7c8a'}}>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative py-12" style={{borderTop: '1px solid rgba(255,255,255,0.04)'}}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-slate-600 text-sm">&copy; 2020 KKHS Media Private Limited. All rights reserved.</p>
        </div>
      </footer>

      {settings.whatsapp_number && (
        <a href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl transition-all hover:scale-110"
          style={{background: '#25d366', boxShadow: '0 4px 0 #1da851, 0 6px 20px rgba(37,211,102,0.3)'}}>
          💬
        </a>
      )}
    </div>
  );
}
