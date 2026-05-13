"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import WhatsAppWidget from "@/components/WhatsAppWidget";

interface Program {
  id: string;
  title: string;
  domain: string;
  mode: string;
  duration: number;
  feeType: string;
  feeAmount: number | null;
  maxSeats: number;
  description: string | null;
  thumbnail: string | null;
  batches: { _count: { enrollments: number } }[];
  _count: { batches: number };
}

const domainColors: Record<string, string> = {
  Technology: "#0EA5B8", Marketing: "#a78bfa", Design: "#FF6B6B", Business: "#f59e0b",
  Finance: "#34d399", Science: "#60a5fa", Arts: "#f472b6", default: "#94a3b8",
};

export default function VacanciesPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/programs?published=true").then(r => r.ok ? r.json() : []).then(setPrograms).catch(() => {});
  }, []);

  const filtered = programs.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.domain.toLowerCase().includes(search.toLowerCase());
    const matchMode = modeFilter === "all" || p.mode.split(",").includes(modeFilter);
    return matchSearch && matchMode;
  });

  return (
    <div className="min-h-screen" style={{background: '#0a0e1a', color: '#f1f5f9'}}>
      {/* SEO: Server-readable content for Google crawler */}
      <noscript>
        <div>
          <h1>Internship Openings 2026 - KKHS Media, Jaipur</h1>
          <p>Apply for paid internship programs at KKHS Media, Jaipur. Available programs: Video Editing Internship, Digital Marketing Internship, Web Development Internship, Graphic Design Internship, Content Writing Internship. All programs include certificate, mentorship, and performance-based stipend. Duration: 1-3 months. Mode: Online and Offline available.</p>
          <h2>Available Internship Programs</h2>
          <ul>
            <li>Video Editing Internship - Learn Adobe Premiere Pro, After Effects, Color Grading</li>
            <li>Digital Marketing Internship - SEO, Google Ads, Social Media Marketing</li>
            <li>Web Development Internship - React, Node.js, Full Stack Development</li>
            <li>Graphic Design Internship - Photoshop, Illustrator, UI/UX Design</li>
            <li>Content Writing Internship - SEO Writing, Blogging, Copywriting</li>
          </ul>
          <p>Location: Jaipur, Rajasthan. Apply now at KKHS Media for the best internship experience with real projects and industry mentorship.</p>
          <a href="/register">Apply Now for Internship</a>
        </div>
      </noscript>
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px]" style={{borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', background: 'radial-gradient(ellipse, rgba(14,165,184,0.08), transparent 70%)', animation: 'morphBlob 15s ease-in-out infinite'}} />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px]" style={{borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%', background: 'radial-gradient(ellipse, rgba(167,139,250,0.06), transparent 70%)', animation: 'morphBlob 18s ease-in-out infinite reverse'}} />
      </div>

      <PublicNavbar activePath="/vacancies" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold tracking-wider uppercase mb-3 inline-block" style={{color: '#22d3ee'}}>Opportunities</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            All Internship{" "}
            <span style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Openings</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">Browse available programs and apply for the ones that match your career goals</p>
          
          {/* Search */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-5 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all focus:shadow-[0_0_20px_rgba(14,165,184,0.2)]"
              style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[{v: "all", l: "All"}, {v: "online", l: "💻 Online"}, {v: "offline", l: "🏢 Offline"}, {v: "hybrid", l: "🔄 Hybrid"}].map((f) => (
              <button key={f.v} onClick={() => setModeFilter(f.v)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${modeFilter === f.v ? "text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                style={modeFilter === f.v ? {background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 0 20px rgba(14,165,184,0.3)'} : {background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)'}}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-slate-500 text-lg">No openings found. Try a different search or check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((program) => {
              const totalEnrolled = program.batches.reduce((sum, b) => sum + b._count.enrollments, 0);
              const seatsLeft = program.maxSeats - totalEnrolled;
              const color = domainColors[program.domain] || domainColors.default;
              return (
                <div key={program.id} className="group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                  {program.thumbnail && (
                    <img src={program.thumbnail} alt={program.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs px-3 py-1 rounded-full font-medium" style={{background: `${color}15`, color, border: `1px solid ${color}30`}}>{program.domain}</span>
                      {program.mode.split(",").map((m: string) => (
                        <span key={m} className="text-xs px-3 py-1 rounded-full font-medium" style={{background: 'rgba(14,165,184,0.1)', color: '#22d3ee', border: '1px solid rgba(14,165,184,0.2)'}}>
                          {m === "online" ? "💻 Online" : m === "offline" ? "🏢 Offline" : m === "hybrid" ? "🔄 Hybrid" : m}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#22d3ee] transition-colors">{program.title}</h3>
                    {program.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{program.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <span>⏲ {program.duration} days</span>
                      <span>👥 {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}</span>
                    </div>
                    <Link href={`/register?program=${encodeURIComponent(program.title)}`} className="block text-center py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(14,165,184,0.3)]" style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)'}}>
                      Apply for this Program
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PublicFooter />
      <WhatsAppWidget />
    </div>
  );
}
