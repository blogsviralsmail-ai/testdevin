"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import WhatsAppWidget from "@/components/WhatsAppWidget";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch("/api/settings/public").then(r => r.ok ? r.json() : {}).then(setSettings).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setStatus("sent"); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }
    else setStatus("error");
  };

  return (
    <div className="min-h-screen" style={{background: '#0a0e1a', color: '#f1f5f9'}}>
      <PublicNavbar activePath="/contact" />

      <div className="pt-28 pb-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold tracking-wider uppercase mb-4 inline-block" style={{color: '#22d3ee'}}>Get in Touch</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Contact{" "}
            <span style={{background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Us</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">Have a question? We&apos;d love to hear from you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <div className="rounded-2xl p-8" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
            <h2 className="text-xl font-bold text-white mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Your Name *" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
                <input type="email" placeholder="Your Email *" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="tel" placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
                <input type="text" placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
              </div>
              <textarea placeholder="Your Message *" required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none resize-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
              <button type="submit" disabled={status === "sending"}
                className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
                style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 0 #0a7c8a, 0 6px 15px rgba(14,165,184,0.3)'}}>
                {status === "sending" ? "Sending..." : status === "sent" ? "Sent Successfully!" : "Send Message"}
              </button>
              {status === "error" && <p className="text-red-400 text-sm">Failed to send. Please try again.</p>}
            </form>
          </div>

          {/* Map + Info */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden" style={{border: '1px solid rgba(255,255,255,0.06)', height: '300px'}}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3557.0!2d75.726848!3d26.9474799!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDU2JzUxLjAiTiA3NcKwNDMnMzYuNyJF!5e0!3m2!1sen!2sin!4v1"
                width="100%" height="100%" style={{border: 0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <div className="rounded-2xl p-6 space-y-4" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
              <div className="flex items-start gap-4">
                <span className="text-2xl">📍</span>
                <div>
                  <h3 className="font-bold text-white">Address</h3>
                  <p className="text-slate-400 text-sm">{settings.company_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">📞</span>
                <div>
                  <h3 className="font-bold text-white">Phone</h3>
                  <p className="text-slate-400 text-sm">{settings.company_phone || "9782005500"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-bold text-white">Email</h3>
                  <p className="text-slate-400 text-sm">{settings.company_email || "info@kkhsmedia.com"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
      <WhatsAppWidget />
    </div>
  );
}
