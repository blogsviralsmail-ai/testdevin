"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Settings {
  company_name?: string;
  company_logo?: string;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/vacancies", label: "Openings" },
  { href: "/blog", label: "Blog" },
  { href: "/team", label: "Our Team" },
  { href: "/contact", label: "Contact Us" },
  { href: "/about", label: "About Us" },
];

const btn3d = "relative transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0";

export default function PublicNavbar({ activePath }: { activePath?: string }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    fetch("/api/settings/public").then(r => r.ok ? r.json() : {}).then(setSettings).catch(() => {});
  }, []);

  return (
    <nav aria-label="Main navigation" className="fixed top-0 w-full z-50" style={{background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {settings.company_logo ? (
            <img src={settings.company_logo} alt="KKHS Media logo" className="h-10 w-auto" width={40} height={40} />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{background: 'linear-gradient(135deg, #0EA5B8, #a78bfa)'}}>KM</div>
          )}
          <span className="text-xl font-bold" style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            {settings.company_name || "KKHS Media"}
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${l.href === activePath ? "text-white" : "text-slate-400 hover:text-white"}`}
              style={l.href === activePath ? {background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 3px 0 #0a7c8a, 0 4px 12px rgba(14,165,184,0.3)'} : {background: 'rgba(255,255,255,0.05)', boxShadow: '0 3px 0 rgba(255,255,255,0.03), 0 4px 8px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)'}}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className={`text-sm text-white px-5 py-2.5 rounded-xl font-semibold ${btn3d}`}
            style={{background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 0 #3730a3, 0 6px 15px rgba(99,102,241,0.3)'}}>
            Login
          </Link>
          <Link href="/register" className={`hidden sm:inline-flex text-sm text-white px-5 py-2.5 rounded-xl font-semibold ${btn3d}`}
            style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 0 #0a7c8a, 0 6px 15px rgba(14,165,184,0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
            Get Started
          </Link>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white text-2xl ml-2" aria-label={mobileMenu ? "Close menu" : "Open menu"} aria-expanded={mobileMenu}>
            {mobileMenu ? "\u2715" : "\u2630"}
          </button>
        </div>
      </div>
      {mobileMenu && (
        <div className="md:hidden px-6 pb-4 space-y-2" style={{background: 'rgba(10,14,26,0.95)'}}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileMenu(false)} className="block text-sm px-4 py-2.5 rounded-xl text-slate-300 hover:text-white transition" style={{background: 'rgba(255,255,255,0.05)'}}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
