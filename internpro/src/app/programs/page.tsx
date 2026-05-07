"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface ProgramType {
  id: string;
  title: string;
  fees: string;
  feesNote: string;
  duration: string;
  mode: string;
  modeIcon: string;
  image: string;
  color: string;
  idealFor: string;
  highlights: string[];
}

// Fallback images for each program type — high quality stock photos from Unsplash
const fallbackImages: Record<string, string> = {
  premium_paid_training:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&q=80",
  basic_certification:
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop&q=80",
  free_hybrid_internship:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop&q=80",
  stipend_office_internship:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&q=80",
};

// SVG icons for each mode
function ModeIcon({ type, color }: { type: string; color: string }) {
  if (type === "office") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
      </svg>
    );
  }
  if (type === "hybrid") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  // Default: laptop (online)
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function FeeBadge({ fees, feesNote, color }: { fees: string; feesNote: string; color: string }) {
  const isFree = fees === "₹0";
  const isStipend = feesNote.toLowerCase().includes("stipend") || feesNote.toLowerCase().includes("earn");
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
      style={{
        backgroundColor: isFree ? "#ecfdf5" : isStipend ? "#fef2f2" : `${color}15`,
        color: isFree ? "#059669" : isStipend ? "#dc2626" : color,
      }}
    >
      {isStipend ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
      )}
      {fees} {feesNote && <span className="font-normal opacity-75">({feesNote})</span>}
    </div>
  );
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/program-types")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setPrograms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                IP
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                InternPro
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-indigo-600 transition font-medium">Home</Link>
              <Link href="/programs" className="text-indigo-600 font-semibold">Our Programs</Link>
              <Link href="/vacancies" className="text-gray-600 hover:text-indigo-600 transition font-medium">Openings</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 font-medium transition">Login</Link>
              <Link href="/register" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition font-medium">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 12 3 12 0v-5" /></svg>
            KKHS Media Private Limited
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Our <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Programs</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the program that fits your goals. From free internships to premium training — we have something for every student.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Industry Projects
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Certificates & Letters
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Expert Mentorship
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Pre-placement Offers
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 animate-pulse">
                IP
              </div>
              <p className="text-gray-500">Loading programs...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {programs.map((program, idx) => {
                const imgSrc = program.image || fallbackImages[program.id] || fallbackImages.premium_paid_training;
                const isExpanded = expandedId === program.id;
                return (
                  <div
                    key={program.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Image Header */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={program.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Program number badge */}
                      <div
                        className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ backgroundColor: program.color }}
                      >
                        {idx + 1}
                      </div>

                      {/* Fee badge top right */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold shadow-lg" style={{ color: program.color }}>
                          {program.fees}
                        </div>
                      </div>

                      {/* Title overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg">
                          {program.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                            <ModeIcon type={program.modeIcon} color="#fff" />
                            {program.mode}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {program.duration}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <FeeBadge fees={program.fees} feesNote={program.feesNote} color={program.color} />

                      {/* Highlights */}
                      <div className="mt-4">
                        <ul className="space-y-2.5">
                          {(isExpanded ? program.highlights : program.highlights.slice(0, 4)).map((h, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={program.color} strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              {h}
                            </li>
                          ))}
                        </ul>
                        {program.highlights.length > 4 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : program.id)}
                            className="mt-2 text-sm font-medium hover:underline"
                            style={{ color: program.color }}
                          >
                            {isExpanded ? "Show Less" : `+${program.highlights.length - 4} more`}
                          </button>
                        )}
                      </div>

                      {/* Ideal For */}
                      <div className="mt-5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ideal For</p>
                        <p className="text-sm text-gray-700">{program.idealFor}</p>
                      </div>

                      {/* CTA */}
                      <Link
                        href="/register"
                        className="mt-5 block text-center py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg"
                        style={{ backgroundColor: program.color }}
                      >
                        Apply for This Program
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Compare Programs</h2>
            <p className="text-gray-600">Side-by-side comparison to help you choose the right program</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 border-b">Feature</th>
                  {programs.map((p) => (
                    <th key={p.id} className="text-center py-4 px-4 text-sm font-semibold border-b min-w-[160px]" style={{ color: p.color }}>
                      {p.title.split(" ").slice(0, 2).join(" ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">Fees / Stipend</td>
                  {programs.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-center text-sm font-bold" style={{ color: p.color }}>{p.fees}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">Duration</td>
                  {programs.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-center text-sm text-gray-600">{p.duration}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">Mode</td>
                  {programs.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-center text-sm text-gray-600">{p.mode}</td>
                  ))}
                </tr>
                {["Certificate", "Experience Letter", "Live Projects", "Mentorship", "Stipend"].map((feature) => (
                  <tr key={feature} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-700 font-medium">{feature}</td>
                    {programs.map((p) => {
                      const has = feature === "Stipend"
                        ? p.id === "stipend_office_internship"
                        : feature === "Live Projects"
                        ? p.id !== "basic_certification"
                        : feature === "Experience Letter"
                        ? p.id === "premium_paid_training" || p.id === "stipend_office_internship"
                        : feature === "Mentorship"
                        ? p.id !== "basic_certification"
                        : true;
                      return (
                        <td key={p.id} className="py-3 px-4 text-center">
                          {has ? (
                            <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : (
                            <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Career Journey?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join KKHS Media and get real industry experience, certificates, and career growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition shadow-xl"
            >
              Apply Now — Free Registration
            </Link>
            <a
              href="tel:+919782005500"
              className="border-2 border-white/50 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition"
            >
              Call Us: +91 9782005500
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                IP
              </div>
              <span className="text-xl font-bold text-white">InternPro</span>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">KKHS Media Private Limited</p>
              <p className="text-gray-500 text-xs mt-1">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
            </div>
            <div className="flex gap-6">
              <Link href="/programs" className="text-gray-400 hover:text-white transition text-sm">Programs</Link>
              <Link href="/vacancies" className="text-gray-400 hover:text-white transition text-sm">Openings</Link>
              <Link href="/login" className="text-gray-400 hover:text-white transition text-sm">Login</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} KKHS Media Private Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
