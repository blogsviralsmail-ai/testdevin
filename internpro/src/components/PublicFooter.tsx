"use client";

import Link from "next/link";

const btn3d = "relative transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0";

export default function PublicFooter() {
  return (
    <footer className="relative py-16" style={{background: 'linear-gradient(180deg, rgba(10,14,26,0.5), #0a0e1a)', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h4 className="text-lg font-bold text-white mb-5">Platform</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { href: "/programs", label: "Programs" },
                { href: "/vacancies", label: "Openings" },
                { href: "/register", label: "Register" },
                { href: "/login", label: "Login" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className={`text-sm px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white ${btn3d}`}
                  style={{background: 'rgba(255,255,255,0.05)', boxShadow: '0 3px 0 rgba(255,255,255,0.03), 0 4px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)'}}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-5">Company</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact Us" },
                { href: "/team", label: "Our Team" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className={`text-sm px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white ${btn3d}`}
                  style={{background: 'rgba(255,255,255,0.05)', boxShadow: '0 3px 0 rgba(255,255,255,0.03), 0 4px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)'}}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-5">Legal</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms & Conditions" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className={`text-sm px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white ${btn3d}`}
                  style={{background: 'rgba(255,255,255,0.05)', boxShadow: '0 3px 0 rgba(255,255,255,0.03), 0 4px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)'}}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-8 text-center" style={{borderTop: '1px solid rgba(255,255,255,0.05)'}}>
          <p className="text-slate-500 text-sm">&copy; 2020 KKHS Media Private Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
