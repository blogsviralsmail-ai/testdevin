import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, MessageSquare, Building, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cmsContent, setCmsContent] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicPage('contact')
      .then((page: Record<string, unknown>) => {
        if (page && page.content && String(page.content) !== '<p>Coming soon</p>') {
          setCmsContent(String(page.content));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.submitContactForm(form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: Mail, label: 'Email Us', value: 'info@bookaground.com', desc: 'We reply within 24 hours', href: 'mailto:info@bookaground.com' },
    { icon: Phone, label: 'Call Us', value: '+91 9782005500', desc: 'Mon-Sat, 9AM - 7PM', href: 'tel:+919782005500' },
    { icon: MapPin, label: 'Visit Us', value: '190A Krishna Kunj, Kalwar Road', desc: 'Jaipur, Rajasthan 302012', href: '#' },
    { icon: Clock, label: 'Business Hours', value: 'Mon-Sat: 9AM-7PM', desc: 'Sun: 10AM-5PM', href: '#' },
  ];

  const subjects = [
    'General Inquiry',
    'Booking Issue',
    'Payment Problem',
    'Ground Listing',
    'Partnership',
    'Technical Support',
    'Feedback',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-8xl">&#128172;</div>
          <div className="absolute bottom-10 left-10 text-8xl">&#128231;</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MessageSquare size={16} /> We'd Love to Hear From You
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contact <span className="text-yellow-300">Us</span>
            </h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Have a question, feedback, or need support? We're here to help. 
              Reach out to us and we'll respond as quickly as possible.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Contact Info Cards */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contactInfo.map((info) => (
            <a key={info.label} href={info.href} className="bg-white rounded-2xl shadow-lg p-5 text-center hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                <info.icon size={22} />
              </div>
              <div className="text-xs text-gray-400 mb-1">{info.label}</div>
              <div className="text-sm font-bold text-gray-900">{info.value}</div>
              <div className="text-xs text-gray-400 mt-1">{info.desc}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Main Content - Form + Info */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-gray-500 text-sm mb-8">Fill out the form below and we'll get back to you within 24 hours.</p>

              {success ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Message Sent Successfully!</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Thank you for reaching out. Our team will review your message and get back to you within 24 hours.
                  </p>
                  <button onClick={() => setSuccess(false)} className="text-green-600 font-semibold hover:text-green-700 transition">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">{error}</div>
                  )}

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject <span className="text-red-500">*</span></label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm bg-white"
                        required
                      >
                        <option value="">Select a subject</option>
                        {subjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message <span className="text-red-500">*</span></label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Write your message here..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Help</h3>
              <div className="space-y-3">
                {[
                  { q: 'How do I book a ground?', a: 'Search for grounds, select a slot, and pay online or choose cash payment.' },
                  { q: 'Can I cancel my booking?', a: 'Yes, cancel before 24 hours for a full refund. Within 24 hours, 50% refund applies.' },
                  { q: 'How do I list my ground?', a: 'Register as an owner, add your ground details, and start receiving bookings.' },
                  { q: 'Is my payment secure?', a: 'Yes, all payments are processed through secure payment gateways.' },
                ].map((faq) => (
                  <details key={faq.q} className="group border border-gray-100 rounded-xl overflow-hidden">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-between">
                      {faq.q}
                      <ArrowRight size={14} className="text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-4 pb-3 text-xs text-gray-500">{faq.a}</div>
                  </details>
                ))}
              </div>
            </div>

            {/* For Ground Owners */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center">
                  <Building size={20} className="text-green-700" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800">For Ground Owners</h3>
                  <p className="text-xs text-green-600">Want to list your ground?</p>
                </div>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Contact us at info@bookaground.com or register directly through our Owner Panel.
              </p>
              <Link to="/owner" className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 transition">
                Go to Owner Panel <ArrowRight size={14} />
              </Link>
            </div>

            {/* Social / Follow */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Follow Us</h3>
              <p className="text-sm text-gray-500 mb-4">
                Stay connected with us on social media for the latest updates, offers, and sports news.
              </p>
              <div className="flex gap-3">
                {['Facebook', 'Twitter', 'Instagram', 'YouTube'].map((social) => (
                  <div key={social} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-green-100 hover:text-green-600 cursor-pointer transition text-xs font-medium">
                    {social[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CMS Dynamic Content (if admin has set it) */}
      {cmsContent && (
        <div className="max-w-6xl mx-auto px-4 pb-12">
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100">
            <div className="prose prose-green max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-a:text-green-600 prose-strong:text-gray-800" 
              dangerouslySetInnerHTML={{ __html: cmsContent }} 
            />
          </div>
        </div>
      )}

      {/* Map / Location Section */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Our Office</h2>
          <p className="text-gray-400 mb-2">KKHS Media Private Limited</p>
          <p className="text-gray-400 text-sm mb-1">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
          <p className="text-gray-500 text-sm">GSTIN: 08AAICK3853C1ZL | Phone: +91 9782005500</p>
        </div>
      </div>
    </div>
  );
}
