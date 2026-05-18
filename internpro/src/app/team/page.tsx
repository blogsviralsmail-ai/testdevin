"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import WhatsAppWidget from "@/components/WhatsAppWidget";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  order: number;
}

const defaultTeam: TeamMember[] = [
  { id: "1", name: "Hari Soni", role: "Founder & CEO", bio: "Visionary entrepreneur who founded KKHS Media in 2020. Leading innovation in digital solutions and internship management.", photo: "", order: 1 },
  { id: "2", name: "Priya Verma", role: "Head of Operations", bio: "Manages day-to-day operations ensuring smooth program delivery and student satisfaction across all departments.", photo: "", order: 2 },
  { id: "3", name: "Amit Kumar", role: "Technical Lead", bio: "Full-stack developer with 8+ years of experience. Architecting scalable platforms and mentoring the tech team.", photo: "", order: 3 },
  { id: "4", name: "Neha Sharma", role: "Digital Marketing Head", bio: "Expert in SEO, social media, and brand strategy. Driving growth for KKHS Media and client brands.", photo: "", order: 4 },
  { id: "5", name: "Rohit Singh", role: "Program Manager", bio: "Coordinates internship programs, manages batches, and ensures quality learning experiences for all students.", photo: "", order: 5 },
  { id: "6", name: "Ananya Gupta", role: "UI/UX Designer", bio: "Creative designer crafting intuitive interfaces. Passionate about user experience and modern design trends.", photo: "", order: 6 },
  { id: "7", name: "Vikash Jain", role: "Business Development", bio: "Building partnerships with institutes and corporates. Expanding KKHS Media's reach across India.", photo: "", order: 7 },
  { id: "8", name: "Sneha Patel", role: "HR & Student Relations", bio: "Managing talent acquisition, student onboarding, and ensuring a positive experience for every intern.", photo: "", order: 8 },
];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(defaultTeam);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch("/api/team").then(r => r.ok ? r.json() : []).then(data => {
      if (data.length > 0) setTeam(data);
    }).catch(() => {});
    fetch("/api/settings/public").then(r => r.ok ? r.json() : {}).then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{background: '#0a0e1a', color: '#f1f5f9'}}>
      <PublicNavbar activePath="/team" />

      <div className="pt-28 pb-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold tracking-wider uppercase mb-4 inline-block" style={{color: '#22d3ee'}}>Our Team</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Meet the{" "}
            <span style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>People Behind KKHS</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">Dedicated professionals passionate about empowering the next generation of talent.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.sort((a, b) => a.order - b.order).map((m) => (
            <div key={m.id} className="group p-6 rounded-2xl text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
              style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
              <div className="w-24 h-24 mx-auto rounded-full mb-4 overflow-hidden flex items-center justify-center text-3xl font-bold" style={{background: 'linear-gradient(135deg, rgba(14,165,184,0.2), rgba(167,139,250,0.2))', border: '2px solid rgba(14,165,184,0.3)'}}>
                {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : m.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#22d3ee] transition-colors">{m.name}</h3>
              <p className="text-sm font-medium mb-3" style={{color: '#a78bfa'}}>{m.role}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
      <WhatsAppWidget />
    </div>
  );
}
