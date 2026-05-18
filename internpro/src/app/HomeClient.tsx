"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
  isPublished: boolean;
  thumbnail: string | null;
  batches: { _count: { enrollments: number } }[];
  _count: { batches: number };
}

interface SiteSettings {
  whatsapp_number?: string;
  homepage_video_url?: string;
  homepage_video_enabled?: string;
  company_name?: string;
  company_logo?: string;
  adsense_ad_before?: string;
  adsense_ad_after?: string;
  [key: string]: string | undefined;
}

interface HomeContent {
  heroTitle?: string;
  heroHighlight?: string;
  heroSubtitle?: string;
  heroBadge?: string;
  benefits?: { icon: string; title: string; desc: string }[];
  features?: { icon: string; title: string; desc: string }[];
  testimonials?: { name: string; role: string; text: string; rating: number }[];
  stats?: { number: string; label: string; icon: string }[];
  steps?: { step: string; title: string; desc: string }[];
  whyChooseTitle?: string;
  whyChooseSubtitle?: string;
  programsSectionTitle?: string;
  programsSectionSubtitle?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
}

const defaultBenefits = [
  { icon: "🎯", title: "Industry-Ready Skills", desc: "Work on real projects used by companies. Build a portfolio that gets you hired, not just a certificate." },
  { icon: "📜", title: "UGC-Compliant Certificate", desc: "Get a verified certificate with QR code. Recognized by universities and employers across India." },
  { icon: "💼", title: "Offer Letter on Day 1", desc: "Receive a professional offer letter as soon as you join. Perfect for college credit and placement records." },
  { icon: "🎥", title: "Learn at Your Own Pace", desc: "Pre-recorded video lessons + daily tasks. No fixed timing — study when it suits you best." },
  { icon: "👨‍🏫", title: "Expert Mentorship", desc: "Get guidance from industry professionals. Ask questions, get feedback, and grow faster." },
  { icon: "🏆", title: "Experience Letter + LOR", desc: "Complete your internship and receive an experience letter and letter of recommendation." },
];

const defaultFeatures = [
  { icon: "📚", title: "Program Management", desc: "Create online/offline/hybrid programs with flexible pricing — Free, Paid, or Stipend models." },
  { icon: "📅", title: "Smart Attendance", desc: "QR code scan for offline, auto login tracking for online. Real-time reports & reminders." },
  { icon: "🎥", title: "Video LMS", desc: "Upload video lessons & materials. Students learn at their own pace and complete daily tasks." },
  { icon: "📝", title: "Task & Grading", desc: "Assign daily tasks, auto-grade submissions. Students submit work reports directly in the platform." },
  { icon: "🏆", title: "Auto Certificates", desc: "Generate certificates with QR verification. Offer letters, NOC, experience letters — all automated." },
  { icon: "💰", title: "Payment Tracking", desc: "Collect fees via gateway. Auto-calculate stipends based on attendance. Complete financial control." },
  { icon: "👥", title: "Team Management", desc: "Assign team leaders, track progress per batch. Review student work with built-in tools." },
  { icon: "📊", title: "Analytics Dashboard", desc: "Real-time stats — revenue, attendance, performance tracking for admin, leaders, and students." },
];

const defaultTestimonials = [
  { name: "Priya Sharma", role: "Digital Marketing Intern", text: "This platform made my internship experience seamless. The daily video lessons and task system helped me learn faster than any classroom.", rating: 5 },
  { name: "Arjun Mehta", role: "Web Development Intern", text: "Got my offer letter on day 1 and certificate with QR verification. My college accepted it instantly for placement credit.", rating: 5 },
  { name: "Sneha Patel", role: "Graphic Design Intern", text: "The mentorship was amazing. I built a real portfolio during the internship that helped me land my first freelance client.", rating: 5 },
];

const defaultStats = [
  { number: "10,000+", label: "Students Certified", icon: "🎓" },
  { number: "500+", label: "Programs Created", icon: "📚" },
  { number: "100+", label: "Institutes Trust Us", icon: "🏛️" },
  { number: "95%", label: "Satisfaction Rate", icon: "⭐" },
];

const defaultSteps = [
  { step: "01", title: "Choose Your Program", desc: "Browse 13+ internship domains — Marketing, Tech, Design, HR and more. Pick what excites you." },
  { step: "02", title: "Get Your Offer Letter", desc: "Register, get instant offer letter. Start your internship journey with professional documentation." },
  { step: "03", title: "Learn & Build Daily", desc: "Watch video lessons, complete daily tasks, submit work. Track your progress on the dashboard." },
  { step: "04", title: "Get Certified", desc: "Complete the program and receive your QR-verified certificate, experience letter, and LOR." },
];

const btn3d = "relative transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0";
const btn3dStyle = (bg: string, shadow: string) => ({
  background: bg,
  boxShadow: `0 4px 0 ${shadow}, 0 6px 20px rgba(0,0,0,0.3)`,
  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
});

interface HomeClientProps {
  initialPrograms: Program[];
  initialSettings: SiteSettings;
  initialCms: HomeContent;
}

export default function HomeClient({ initialPrograms, initialSettings, initialCms }: HomeClientProps) {
  const [programs] = useState<Program[]>(initialPrograms);
  const [isVisible] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [showPopup, setShowPopup] = useState(false);
  const [settings] = useState<SiteSettings>(initialSettings);
  const [cms] = useState<HomeContent>(initialCms);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);



  const benefits = cms.benefits?.length ? cms.benefits : defaultBenefits;
  const features = cms.features?.length ? cms.features : defaultFeatures;
  const testimonials = cms.testimonials?.length ? cms.testimonials : defaultTestimonials;
  const stats = cms.stats?.length ? cms.stats : defaultStats;
  const steps = cms.steps?.length ? cms.steps : defaultSteps;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Apply Now popup after 20 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 20000);
    return () => clearTimeout(timer);
  }, []);

  const domainColors: Record<string, string> = {
    Technology: "#0EA5B8", Marketing: "#a78bfa", Design: "#FF6B6B", Business: "#f59e0b",
    Finance: "#34d399", Science: "#60a5fa", Arts: "#f472b6", default: "#94a3b8",
  };

  const videoEnabled = settings.homepage_video_enabled === "true";
  const videoUrl = settings.homepage_video_url || "https://www.youtube.com/watch?v=elz6HHphxP4";
  const getYoutubeId = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/);
    return m ? m[1] : "";
  };

  return (
    <div className="min-h-screen" style={{background: '#0a0e1a', color: '#f1f5f9'}}>
      {/* Organic Background Blobs — static on mobile for performance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px]" style={{borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', background: 'radial-gradient(ellipse, rgba(14,165,184,0.08), transparent 70%)'}} />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px]" style={{borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%', background: 'radial-gradient(ellipse, rgba(167,139,250,0.06), transparent 70%)'}} />
      </div>

      <PublicNavbar activePath="/" />

      {/* ===== HERO SECTION ===== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{background: 'rgba(14,165,184,0.1)', border: '1px solid rgba(14,165,184,0.2)', color: '#22d3ee'}}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{background: '#22d3ee'}} />
            {cms.heroBadge || "A Product of KKHS Media Private Limited"}
          </div>

          <h1 className={`text-5xl sm:text-6xl md:text-7xl font-black leading-tight mb-6 tracking-tight transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {cms.heroTitle || "Launch Your Career with"}{" "}
            <span style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa, #FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              {cms.heroHighlight || "Real Internships"}
            </span>
          </h1>

          <p className={`text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {cms.heroSubtitle || "Real Experience, Real Growth. Get industry-ready with video lessons, daily tasks, expert mentorship, and verified certificates — powered by KKHS Media."}
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link href="/register" className={`text-white px-8 py-4 rounded-2xl text-lg font-semibold ${btn3d}`}
              style={btn3dStyle('linear-gradient(135deg, #0EA5B8, #0891b2)', '#0a7c8a')}>
              Start Your Internship — Free
            </Link>
            <Link href="/programs" className={`px-8 py-4 rounded-2xl text-lg font-semibold ${btn3d}`}
              style={{border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', boxShadow: '0 4px 0 rgba(255,255,255,0.03), 0 6px 15px rgba(0,0,0,0.2)'}}>
              Explore Programs →
            </Link>
          </div>

          <div className={`flex flex-wrap justify-center gap-8 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {["No Credit Card Required", "Instant Offer Letter", "UGC Compliant", "100% Online"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="w-4 h-4" style={{color: '#22d3ee'}} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="relative py-16" style={{background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)'}}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.number}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ad Before Content */}
      {settings.adsense_ad_before && (
        <div className="max-w-4xl mx-auto px-6 py-4 text-center" dangerouslySetInnerHTML={{ __html: settings.adsense_ad_before }} />
      )}

      {/* ===== WHY CHOOSE US (BENEFITS) ===== */}
      <section id="benefits" className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold tracking-wider uppercase mb-4 inline-block" style={{color: '#22d3ee'}}>Why Choose Us</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              {cms.whyChooseTitle || "Your Internship,"}{" "}
              <span style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{cms.whyChooseSubtitle || "Your Advantage"}</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              {cms.heroSubtitle ? "" : "More than just an internship — we give you the skills, proof, and connections to launch your career."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div key={b.title} className="group p-7 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                animationDelay: `${i * 0.1}s`,
              }}>
                <div className="text-4xl mb-4 transition-transform group-hover:scale-110">{b.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{b.title}</h3>
                <p className="text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* YouTube Video Section — Lite facade for performance */}
          {videoEnabled && (
            <div className="mt-16">
              <div className="max-w-3xl mx-auto">
                <div className="relative w-full rounded-2xl overflow-hidden" style={{paddingBottom: '56.25%', background: '#000', border: '1px solid rgba(255,255,255,0.08)'}}>
                  {videoLoaded ? (
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${getYoutubeId(videoUrl)}?rel=0&autoplay=1`}
                      title="About KKHS Media"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      className="absolute top-0 left-0 w-full h-full cursor-pointer border-0 bg-black"
                      onClick={() => setVideoLoaded(true)}
                      aria-label="Play video about KKHS Media"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${getYoutubeId(videoUrl)}/hqdefault.jpg`}
                        alt="Video thumbnail"
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background: 'rgba(255,0,0,0.9)'}}>
                          <svg viewBox="0 0 24 24" width="32" height="32" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative py-24" style={{background: 'rgba(255,255,255,0.01)'}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold tracking-wider uppercase mb-4 inline-block" style={{color: '#a78bfa'}}>Process</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Start in{" "}
              <span style={{background: 'linear-gradient(135deg, #a78bfa, #FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>4 Simple Steps</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="relative p-7 rounded-3xl group transition-all duration-500 hover:-translate-y-2" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div className="text-5xl font-black mb-4 transition-transform group-hover:scale-110" style={{
                  background: `linear-gradient(135deg, ${['#0EA5B8','#a78bfa','#FF6B6B','#f59e0b'][i]}, transparent)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', opacity: 0.3
                }}>{s.step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-3 text-slate-700 text-xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES (For Institutes) ===== */}
      <section id="features" className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold tracking-wider uppercase mb-4 inline-block" style={{color: '#FF6B6B'}}>Platform Features</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Everything to{" "}
              <span style={{background: 'linear-gradient(135deg, #FF6B6B, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Run Your Program</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              Complete internship lifecycle management — from enrollment to certification.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl group transition-all duration-500 hover:-translate-y-1" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div className="text-3xl mb-3 transition-transform group-hover:scale-110">{f.icon}</div>
                <h3 className="text-base font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="relative py-24" style={{background: 'rgba(255,255,255,0.01)'}}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold tracking-wider uppercase mb-4 inline-block" style={{color: '#f59e0b'}}>Student Stories</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              What Our{" "}
              <span style={{background: 'linear-gradient(135deg, #f59e0b, #FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Students Say</span>
            </h2>
          </div>
          <div className="relative">
            {testimonials.map((t, i) => (
              <div key={t.name} className="transition-all duration-500" style={{
                display: i === activeTestimonial ? 'block' : 'none',
              }}>
                <div className="p-10 rounded-3xl text-center" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(t.rating)].map((_, j) => (
                      <span key={j} className="text-xl" style={{color: '#f59e0b'}}>★</span>
                    ))}
                  </div>
                  <p className="text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="font-bold text-white text-lg">{t.name}</p>
                    <p className="text-slate-400 text-sm">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center gap-3 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} className="w-3 h-3 rounded-full transition-all p-3 flex items-center justify-center" aria-label={`Show testimonial ${i + 1}`}><span className="block w-2.5 h-2.5 rounded-full" style={{background: i === activeTestimonial ? '#0EA5B8' : 'rgba(255,255,255,0.15)'}} /></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROGRAMS SECTION ===== */}
      <section id="programs" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold tracking-wider uppercase mb-4 inline-block" style={{color: '#22d3ee'}}>Opportunities</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Current{" "}
              <span style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Internship Openings</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Apply now for ongoing internship programs across 13+ domains</p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {[{v: "all", l: "All"}, {v: "online", l: "💻 Online"}, {v: "offline", l: "🏢 Offline"}, {v: "hybrid", l: "🔄 Hybrid"}].map((f) => (
                <button key={f.v} onClick={() => setModeFilter(f.v)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${modeFilter === f.v ? "text-white" : "text-slate-400 hover:text-white"}`}
                  style={modeFilter === f.v ? {background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 3px 0 #0a7c8a, 0 4px 15px rgba(14,165,184,0.3)'} : {background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 3px 0 rgba(255,255,255,0.02)'}}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.filter((p) => modeFilter === "all" || p.mode.split(",").includes(modeFilter)).slice(0, 6).map((p) => {
              const enrolled = p.batches?.reduce((sum, b) => sum + (b._count?.enrollments || 0), 0) || 0;
              const seatsLeft = Math.max(0, p.maxSeats - enrolled);
              const color = domainColors[p.domain] || domainColors.default;
              return (
                <div key={p.id} className="group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="text-xs px-3 py-1 rounded-full font-medium" style={{background: `${color}15`, color, border: `1px solid ${color}30`}}>{p.domain}</span>
                      {p.mode.split(",").map((m: string) => (
                        <span key={m} className="text-xs px-3 py-1 rounded-full font-medium" style={{background: 'rgba(14,165,184,0.1)', color: '#22d3ee', border: '1px solid rgba(14,165,184,0.2)'}}>
                          {m === "online" ? "💻 Online" : m === "offline" ? "🏢 Offline" : m === "hybrid" ? "🔄 Hybrid" : m}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#22d3ee] transition-colors">{p.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{p.description || `${p.title} — ${p.duration} day program`}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-5">
                      <span className="flex items-center gap-1">⏲ {p.duration} days</span>
                      <span className="flex items-center gap-1">👥 {seatsLeft} seats left</span>
                    </div>
                    <Link href={`/register?program=${encodeURIComponent(p.title)}`} className={`block w-full text-center py-3 rounded-xl text-sm font-semibold text-white ${btn3d}`}
                      style={btn3dStyle('linear-gradient(135deg, #0EA5B8, #0891b2)', '#0a7c8a')}>
                      Apply for this Program
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          {programs.length > 6 && (
            <div className="text-center mt-10">
              <Link href="/vacancies" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${btn3d}`}
                style={{border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', boxShadow: '0 3px 0 rgba(255,255,255,0.03), 0 4px 12px rgba(0,0,0,0.2)'}}>
                View All {programs.length} Programs →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-12 md:p-16 rounded-3xl text-center relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(14,165,184,0.15), rgba(167,139,250,0.1))',
            border: '1px solid rgba(14,165,184,0.2)',
          }}>
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20" style={{background: 'radial-gradient(ellipse, #0EA5B8, transparent)'}} />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-20" style={{background: 'radial-gradient(ellipse, #a78bfa, transparent)'}} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Ready to Start Your Career?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Join 10,000+ students who launched their careers with our internship programs. Free to start, no credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className={`text-white px-8 py-4 rounded-2xl text-lg font-semibold ${btn3d}`}
                  style={btn3dStyle('linear-gradient(135deg, #0EA5B8, #0891b2)', '#0a7c8a')}>
                  Start Free Internship
                </Link>
                <Link href="/login" className={`px-8 py-4 rounded-2xl text-lg font-semibold ${btn3d}`}
                  style={{border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', boxShadow: '0 4px 0 rgba(255,255,255,0.03), 0 6px 15px rgba(0,0,0,0.2)'}}>
                  Login to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad After Content */}
      {settings.adsense_ad_after && (
        <div className="max-w-4xl mx-auto px-6 py-4 text-center" dangerouslySetInnerHTML={{ __html: settings.adsense_ad_after }} />
      )}

      {/* ===== FOOTER ===== */}
      <PublicFooter />

      {/* ===== APPLY NOW POPUP (20 sec) ===== */}
      {showPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)'}}>
          <div className="relative max-w-md w-full rounded-3xl p-8 text-center animate-bounce-in" style={{background: '#111827', border: '1px solid rgba(14,165,184,0.3)', boxShadow: '0 0 60px rgba(14,165,184,0.15)'}}>
            <button onClick={() => setShowPopup(false)} className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${btn3d}`}
              style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 3px 0 #991b1b'}} aria-label="Close popup">
              ✕
            </button>
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-black text-white mb-2">Ready to Apply?</h3>
            <p className="text-slate-400 mb-6">Start your internship journey today. Free to join, no credit card required!</p>
            <Link href="/register" onClick={() => setShowPopup(false)} className={`inline-block text-white px-8 py-4 rounded-2xl text-lg font-semibold w-full ${btn3d}`}
              style={btn3dStyle('linear-gradient(135deg, #0EA5B8, #0891b2)', '#0a7c8a')}>
              Apply Now — Free
            </Link>
          </div>
        </div>
      )}

      <WhatsAppWidget />

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
      `}</style>
    </div>
  );
}
