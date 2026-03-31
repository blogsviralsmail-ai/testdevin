import { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Globe, Headphones, Loader2 } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/api/settings").then((r) => setSettings(r.data || {})).catch(() => {});
  }, []);

  const lat = settings.map_latitude || "26.9124";
  const lng = settings.map_longitude || "75.7873";
  const mapSrc = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/enquiries", { name: form.name, email: form.email || null, phone: form.phone || null, message: form.message || null, source: "contact" });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SEO
        title="Contact Us - Get in Touch"
        description="Contact A Step For Future - Education Hub for admission queries, course information, and expert counseling. Visit us in Jaipur. We respond within 24 hours."
        keywords="contact education hub, education consultancy Jaipur, admission helpline, counseling contact, education hub phone number, education hub address"
        canonical="/contact"
      />
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={settings.contact_hero_image || "https://sageuniversity.edu.in/assets/images/blog/sage-university-bhopal-advisory-meet-national-international-experts.webp"} alt="Office" className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-semibold rounded-full mb-4 border border-white/20">GET IN TOUCH</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">Contact Us</h1>
          <p className="text-blue-200 max-w-2xl mx-auto text-lg">
            {settings.contact_hero_subtitle || "Have questions? We'd love to hear from you. Get in touch with our team."}
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: MapPin, title: "Visit Us", text: settings.company_address || "OASIS COMPLEX, 46 SHASHTRINAGAR ROAD, NEAR PNB BANK AJMER", sub: "India", color: "blue" },
            { icon: Phone, title: "Call Us", text: settings.company_phone || "+919251295969", sub: "Mon-Sat, 9AM-7PM", color: "green" },
            { icon: Mail, title: "Email Us", text: settings.company_email || "info@asffeducationhub.com", sub: "We reply within 24 hours", color: "purple" },
            { icon: Clock, title: "Working Hours", text: settings.contact_working_hours || "Mon - Sat: 9AM - 7PM", sub: settings.contact_working_hours_off || "Sunday: Closed", color: "orange" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
              <div className={`h-14 w-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                item.color === "blue" ? "bg-blue-100" : item.color === "green" ? "bg-green-100" : item.color === "purple" ? "bg-purple-100" : "bg-orange-100"
              }`}>
                <item.icon className={`h-7 w-7 ${
                  item.color === "blue" ? "text-blue-600" : item.color === "green" ? "text-green-600" : item.color === "purple" ? "text-purple-600" : "text-orange-600"
                }`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Info + Map */}
          <div>
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full mb-4">REACH OUT</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Let&apos;s Start a Conversation</h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Feel free to reach out to us for any queries regarding admissions, courses, or general information. Our team of expert counselors is here to help you make the right choice.
            </p>

            <div className="space-y-6 mb-8">
              {[
                { icon: MessageCircle, title: "Chat With Us", desc: "Our expert counselors are available for live chat during working hours" },
                { icon: Headphones, title: "24/7 Support", desc: "Get round-the-clock support for urgent queries via email" },
                { icon: Globe, title: "Online Consultation", desc: "Book a free online consultation with our education experts" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
                    <item.icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Google Map - managed via admin settings lat/long */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 h-72 bg-gray-100">
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Map location can be updated from Admin &gt; Settings</p>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Send Us a Message</h2>
            <p className="text-sm text-gray-500 mb-6">Fill the form below and we&apos;ll get back to you within 24 hours.</p>

            {submitted && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100">
                Thank you for reaching out! We&apos;ll get back to you soon.
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm" placeholder="Your name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm" placeholder="How can we help you?" />
              </div>
              <button type="submit" disabled={submitting} className="btn-3d btn-3d-blue w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-base disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
