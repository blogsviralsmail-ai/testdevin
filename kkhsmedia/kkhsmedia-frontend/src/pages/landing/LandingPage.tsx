import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicAPI } from '../../services/api';
import {
  Play, Upload, Radio, Monitor, Facebook, Youtube, Twitch, Instagram,
  Check, ChevronDown, ChevronUp, Send, Menu, X, Globe, Clock, Shield, Zap, CreditCard
} from 'lucide-react';

interface Product {
  id: string; name: string; durationType: string; price: Record<string, number>;
  features: string[]; streamQuality: string; durationValue: number;
}

export default function LandingPage() {
  const { settings, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('');

  const brandName = settings?.brandName || 'KKHS Media';
  const primary = settings?.primaryColor || '#6366f1';

  useEffect(() => {
    publicAPI.getProducts().then(res => setProducts(res.data)).catch(() => {});
  }, []);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await publicAPI.submitContact(contactForm);
      setContactStatus('Message sent! We will get back to you soon.');
      setContactForm({ name: '', email: '', message: '' });
    } catch { setContactStatus('Failed to send. Please try again.'); }
  };

  const faqs = [
    { q: 'What is ' + brandName + '?', a: brandName + ' is a professional 24/7 live streaming platform that allows you to stream pre-recorded videos continuously on YouTube, Facebook, Twitch, Instagram, and custom RTMP destinations.' },
    { q: 'How does it work?', a: 'Simply upload your video, enter your stream key from YouTube/Facebook/etc, and click Start Stream. Our servers will continuously loop your video as a live stream 24 hours a day, 7 days a week.' },
    { q: 'Which platforms are supported?', a: 'We support YouTube, Facebook, Twitch, Instagram, and any Custom RTMP destination. You can stream to multiple platforms simultaneously with different slots.' },
    { q: 'Can I stream multiple videos?', a: 'Each streaming slot supports one video at a time. You can purchase multiple slots to stream different videos on different platforms simultaneously.' },
    { q: 'What video formats are supported?', a: 'We support MP4, MKV, AVI, and other common video formats. For best results, use MP4 with H.264 encoding.' },
    { q: 'How do I get a stream key?', a: 'Go to your YouTube Studio or Facebook Live dashboard, create a new live stream, and copy the stream key. Paste it into your slot settings on ' + brandName + '.' },
    { q: 'Is there a free trial?', a: 'We offer affordable daily plans starting from just ₹33/day so you can test the platform with minimal commitment.' },
    { q: 'What happens if the stream stops?', a: 'Our system monitors all active streams and automatically restarts them if they stop unexpectedly. You will also receive notifications.' },
  ];

  const getDurationLabel = (type: string) => {
    switch (type) { case 'day': return '/day'; case 'week': return '/week'; case 'month': return '/month'; default: return ''; }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={brandName} className="h-8" />
              ) : (
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>
                  {brandName.charAt(0)}
                </div>
              )}
              <span className="font-bold text-xl">{brandName}</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</a>
              {user ? (
                <Link to="/dashboard" className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primary }}>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium" style={{ color: primary }}>Login</Link>
                  <Link to="/register" className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primary }}>
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-gray-600" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#pricing" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" className="block text-gray-600" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#contact" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Contact</a>
            <div className="pt-2 flex gap-3">
              <Link to="/login" className="px-4 py-2 border rounded-lg text-sm" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: primary }} onClick={() => setMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32" style={{ background: `linear-gradient(135deg, ${primary}10 0%, ${primary}05 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            {settings?.heroTitle || `Stream Live 24/7`}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {settings?.heroSubtitle || 'Stream your Pre-Recorded videos 24x7 on YouTube, Facebook, Twitch & more. Get more views with continuous live streaming.'}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-3 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: primary }}>
              Start Streaming Free
            </Link>
            <a href="#how-it-works" className="px-8 py-3 rounded-xl border-2 font-semibold text-lg" style={{ borderColor: primary, color: primary }}>
              How It Works
            </a>
          </div>
          <div className="mt-12 flex justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2"><Youtube size={28} /> YouTube</div>
            <div className="flex items-center gap-2"><Facebook size={28} /> Facebook</div>
            <div className="flex items-center gap-2"><Twitch size={28} /> Twitch</div>
            <div className="flex items-center gap-2"><Instagram size={28} /> Instagram</div>
          </div>
        </div>
      </section>

      {/* 3 Steps */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Start Streaming in 3 Simple Steps</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Get your live stream up and running in minutes, not hours.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, title: 'Upload Video', desc: 'Upload your pre-recorded video. We support MP4, MKV, and more.' },
              { icon: Radio, title: 'Add Stream Key', desc: 'Paste your YouTube, Facebook, Twitch, or custom RTMP stream key.' },
              { icon: Play, title: 'Go Live!', desc: 'Click Start Stream and your video will broadcast 24/7 continuously.' },
            ].map((step, i) => (
              <div key={i} className="text-center p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: primary + '15' }}>
                  <step.icon size={28} style={{ color: primary }} />
                </div>
                <div className="text-sm font-bold mb-2" style={{ color: primary }}>STEP {i + 1}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20" style={{ backgroundColor: primary + '08' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Powerful Features</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Everything you need for professional 24/7 live streaming.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: '24/7 Streaming', desc: 'Continuous non-stop streaming. Your content runs even while you sleep.' },
              { icon: Globe, title: 'Multi-Platform', desc: 'Stream to YouTube, Facebook, Twitch, Instagram & Custom RTMP.' },
              { icon: Monitor, title: 'Cloud-Based', desc: 'No need to keep your computer on. We handle everything in the cloud.' },
              { icon: Shield, title: 'Auto-Restart', desc: 'If a stream drops, our system automatically restarts it instantly.' },
              { icon: Zap, title: 'HD Quality', desc: 'Stream in up to 1080p Full HD quality for the best viewer experience.' },
              { icon: Upload, title: 'Easy Upload', desc: 'Drag & drop video upload with fast cloud storage.' },
              { icon: Radio, title: 'Multiple Slots', desc: 'Run multiple streams on different platforms simultaneously.' },
              { icon: CreditCard, title: 'Affordable Plans', desc: 'Start from just ₹33/day. No hidden fees. Cancel anytime.' },
            ].map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <f.icon size={24} style={{ color: primary }} className="mb-3" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Choose the plan that works for you. All plans include all features.</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {products.map((product, i) => (
              <div key={product.id} className={`rounded-2xl border-2 p-8 text-center relative ${i === 1 ? 'shadow-xl scale-105' : ''}`}
                style={{ borderColor: i === 1 ? primary : '#e5e7eb' }}>
                {i === 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-bold" style={{ backgroundColor: primary }}>
                    POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{product.streamQuality} Quality</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₹{product.price.INR}</span>
                  <span className="text-gray-500">{getDurationLabel(product.durationType)}</span>
                  <p className="text-xs text-gray-400 mt-1">+ 18% GST</p>
                </div>
                <ul className="text-left space-y-2 mb-6">
                  {product.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check size={16} style={{ color: primary }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block w-full py-3 rounded-xl font-semibold ${i === 1 ? 'text-white' : ''}`}
                  style={i === 1 ? { backgroundColor: primary } : { border: `2px solid ${primary}`, color: primary }}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20" style={{ backgroundColor: primary + '05' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-medium"
                >
                  {faq.q}
                  {faqOpen === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-gray-600 text-sm">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
              <p className="text-gray-600 mb-8">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Send size={18} style={{ color: primary }} />
                  <span>{settings?.contactEmail || 'info@kkhsmedia.com'}</span>
                </div>
                {settings?.address && (
                  <div className="flex items-start gap-3 text-gray-600">
                    <Globe size={18} style={{ color: primary }} className="mt-0.5" />
                    <span>{settings.address}</span>
                  </div>
                )}
              </div>
            </div>
            <form onSubmit={handleContact} className="space-y-4">
              <input
                type="text" placeholder="Your Name" required value={contactForm.name}
                onChange={e => setContactForm({...contactForm, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': primary } as React.CSSProperties}
              />
              <input
                type="email" placeholder="Your Email" required value={contactForm.email}
                onChange={e => setContactForm({...contactForm, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent"
              />
              <textarea
                placeholder="Your Message" required rows={4} value={contactForm.message}
                onChange={e => setContactForm({...contactForm, message: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
              />
              <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: primary }}>
                Send Message
              </button>
              {contactStatus && <p className="text-sm text-green-600">{contactStatus}</p>}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>
                  {brandName.charAt(0)}
                </div>
                <span className="font-bold text-white text-lg">{brandName}</span>
              </div>
              <p className="text-sm">{settings?.footerText || 'The Best Professional Pre-Recorded Video Live Streaming Platform.'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <a href="#features" className="block hover:text-white">Features</a>
                <a href="#pricing" className="block hover:text-white">Pricing</a>
                <a href="#faq" className="block hover:text-white">FAQ</a>
                <a href="#contact" className="block hover:text-white">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to="/privacy-policy" className="block hover:text-white">Privacy Policy</Link>
                <Link to="/terms-of-service" className="block hover:text-white">Terms of Service</Link>
                <Link to="/refund-policy" className="block hover:text-white">Refund Policy</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            &copy; {new Date().getFullYear()} {settings?.companyName || 'KKHS Media Private Limited'}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
