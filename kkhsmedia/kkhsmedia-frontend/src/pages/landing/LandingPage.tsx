import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicAPI } from '../../services/api';
import {
  ArrowRight, ChevronDown, Mail, Check,
  Youtube, Menu, X,
  Play, Upload, Key, UserPlus,
  Monitor, Clock, HardDrive, Headphones,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function TypingText({ words }: { words: string[] }) {
  const [wi, setWi] = useState(0);
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const word = words[wi];
    const t = setTimeout(() => {
      if (!del) {
        if (ci < word.length) setCi(ci + 1);
        else setTimeout(() => setDel(true), 1800);
      } else {
        if (ci > 0) setCi(ci - 1);
        else { setDel(false); setWi((wi + 1) % words.length); }
      }
    }, del ? 40 : 80);
    return () => clearTimeout(t);
  }, [ci, del, wi, words]);

  return <>{words[wi].slice(0, ci)}<span className="animate-pulse text-purple-300">|</span></>;
}

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let s = 0;
        const step = end / 120;
        const go = () => {
          s += step;
          if (s >= end) { setCount(end); return; }
          setCount(Math.floor(s));
          requestAnimationFrame(go);
        };
        go();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function Reveal({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface PlanData {
  id: string;
  name: string;
  durationType: string;
  durationValue: number;
  price: { INR: number; USD: number } | number;
  features: string[];
  streamQuality: string;
  isActive: boolean;
  sortOrder: number;
}

interface SiteSettings {
  brandName?: string;
  companyName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  footerText?: string;
  contactEmail?: string;
  headerLogoUrl?: string;
  footerLogoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  socialLinks?: Record<string, string>;
}

export default function LandingPage() {
  useAuth();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [scrolled, setScrolled] = useState(false);
  const [contactStatus, setContactStatus] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  useEffect(() => {
    publicAPI.getProducts().then((r: { data: PlanData[] }) => setPlans(r.data)).catch(() => {});
    publicAPI.getSettings().then((r: { data: SiteSettings }) => setSiteSettings(r.data)).catch(() => {});
  }, []);

  const brandName = siteSettings.brandName || 'StreamAdda';
  const companyName = siteSettings.companyName || 'STREAMADDA LLP';
  const contactEmail = siteSettings.contactEmail || 'info.streamadda@gmail.com';
  const footerText = siteSettings.footerText || 'The Best Professional Pre-Recorded Video Live Streaming Platform. Stream your Pre-Recorded videos 24x7 & get more Suggested and Browse feature video views.';

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const getPrice = (price: PlanData['price']): number => {
    if (typeof price === 'number') return price;
    if (price && typeof price === 'object') {
      if (currency === 'USD' && 'USD' in price) return price.USD;
      if ('INR' in price) return price.INR;
    }
    return 0;
  };

  const getDurationLabel = (type: string, val: number) => {
    if (val === 1) {
      switch (type) { case 'day': return 'Per Day'; case 'week': return 'Per Week'; case 'month': return 'Per Month'; default: return ''; }
    }
    return `Per ${val} ${type}s`;
  };

  const getSavePercent = (idx: number) => {
    const percents = [26, 46, 56];
    return percents[idx] || 0;
  };

  const getOrigPrice = (price: number, idx: number) => {
    const multipliers = [1.36, 1.86, 2.28];
    return Math.round(price * (multipliers[idx] || 1.5));
  };

  const faqs = [
    { q: 'What is StreamAdda?', a: 'StreamAdda is a professional platform for 24/7 pre-recorded video live streaming to YouTube, Facebook & more. Stream your videos continuously without any setup.' },
    { q: 'How does it work?', a: 'Simply create an account, choose a plan, upload your pre-recorded video, set your stream key, and click start. Your video will broadcast continuously 24/7.' },
    { q: 'Which platforms are supported?', a: 'Currently we support YouTube and Facebook live streaming. More platforms coming soon!' },
    { q: 'Do you need access to my channel?', a: "No! We don't need any access to your channel or account. You just provide your stream key and we handle the rest." },
    { q: 'What video formats are supported?', a: 'MP4, MKV, AVI, MOV, FLV and most common video formats are supported.' },
    { q: 'Can I change my video while streaming?', a: 'Yes! You can swap videos anytime you want without stopping the stream.' },
  ];

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await publicAPI.submitContact(contactForm);
      setContactForm({ name: '', email: '', message: '' });
      setContactStatus('Message sent!');
    } catch {
      setContactStatus('Failed to send.');
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Home', id: 'hero' },
    { label: 'How it Works', id: 'how-it-works' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
    { label: 'Contact Us', id: 'contact' },
  ];

  const defaultPlans = [
    { name: 'Basic', price: 33, orig: 45, duration: 'Per Day', save: 26, features: ['Stream Pre-recorded Videos', '24-hour Continuous Loop', '1 Live Streaming Slot', '2GB Video Storage Space', 'Crystal-Clear HD 720p Stream', 'Swap Videos Anytime', 'Effortless Control Panel'] },
    { name: 'Popular', price: 169, orig: 315, duration: 'Per Week', save: 46, features: ['Stream Pre-recorded Videos', 'Non-stop 24x7 Streaming', '1 Live Streaming Slot', '2GB of Secure Storage', 'Full HD 1080p Quality', 'Change Videos Without Limits', 'No Cap on Stream Duration', 'Fast-Track Priority Support', 'Effortless Control Panel'] },
    { name: 'Business', price: 592, orig: 1350, duration: 'Per Month', save: 56, features: ['Stream Pre-recorded Videos', 'Non-stop 24x7 Streaming', '1 Live Streaming Slot', '2GB of Secure Storage', 'Full HD 1080p Quality', 'Change Videos Without Limits', 'No Cap on Stream Duration', 'Fast-Track Priority Support', 'Effortless Control Panel'] },
  ];

  const currSymbol = currency === 'INR' ? '\u20B9' : '$';

  const renderPlanCard = (
    name: string, priceVal: number, origPrice: number, durationLabel: string,
    savePercent: number, features: string[], idx: number, keyVal: string | number,
  ) => {
    const popular = idx === 1;
    return (
      <Reveal key={keyVal} delay={idx * 0.12}>
        <div className={`relative rounded-2xl bg-white shadow-sm border-2 overflow-hidden h-full flex flex-col ${
          popular ? 'border-purple-500 shadow-lg scale-[1.02]' : 'border-gray-200'
        }`}>
          {savePercent > 0 && (
            <div className={`text-center py-1 text-xs font-bold text-white ${
              popular ? 'bg-gradient-to-r from-orange-400 to-yellow-400' : 'bg-purple-500'
            }`}>
              {popular && <span className="block text-[10px] uppercase tracking-wider">POPULAR</span>}
              SAVE {savePercent}%
            </div>
          )}
          <div className="p-7 flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black text-gray-900">
                {currSymbol}{Math.round(priceVal)}
              </span>
              <span className="text-xs text-red-400 font-medium">*</span>
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="line-through text-gray-400">{currSymbol}{origPrice}</span>
              {' '}{durationLabel}
            </div>
            <p className="text-xs text-gray-500 mt-2 mb-6 leading-relaxed">
              {idx === 0 ? 'Perfect way to dive into the future of Live Streaming and skyrocket your views to 50k.' :
               idx === 1 ? 'Top pick to supercharge your video views.' :
               'Revamp your Creator journey with unmatched power through the Business Plan.'}
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {features.map((feat, fi) => (
                <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link to="/register"
              className={`w-full py-3 rounded-xl font-bold text-center text-sm transition-all block ${
                popular
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>
              Choose Plan
            </Link>
          </div>
        </div>
      </Reveal>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-6xl mx-auto h-16 flex items-center px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{brandName}</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 ml-12">
            {navLinks.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium">
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Link to="/dashboard"
              className="hidden sm:inline-flex items-center px-5 py-2 rounded-lg border-2 border-purple-600 text-purple-600 text-sm font-semibold hover:bg-purple-600 hover:text-white transition-all">
              Dashboard
            </Link>
            <a href="https://www.youtube.com/@Stream_Adda" target="_blank" rel="noopener noreferrer" className="hidden md:block text-gray-400 hover:text-red-500 transition-colors">
              <Youtube size={18} />
            </a>
            <button className="md:hidden p-2 text-gray-600 hover:text-purple-600 transition-colors"
              onClick={() => setMobileMenu(p => !p)}>
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg md:hidden"
          >
            <div className="px-5 py-4 space-y-1">
              {navLinks.map(s => (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  className="block w-full text-left py-3 text-sm text-gray-700 hover:text-purple-600 border-b border-gray-50 last:border-0">{s.label}</button>
              ))}
              <Link to="/dashboard" onClick={() => setMobileMenu(false)}
                className="block w-full text-center py-3 mt-2 bg-purple-600 text-white rounded-lg font-semibold text-sm">
                Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 30%, #a855f7 60%, #c084fc 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-6">
                {brandName} - Stream Live 24/7
                <br />
                <span className="text-white/80">
                  <TypingText words={['YouTube Automation', 'Facebook Live', 'Non-Stop Streaming', '24x7 Live']} />
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-white/80 mb-3 leading-relaxed max-w-2xl">
                Stream your Pre-Recorded videos 24x7 &amp; get more suggested and browse feature video views
              </p>
              <p className="text-base text-white/70 mb-3">
                Unlock the new Technique of Growing Subscribers &amp; Earn More Revenue.
              </p>
              <p className="text-base text-white/70 mb-8">
                No studio, no webcam &mdash; just upload and go live.
              </p>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all">
                Get Started Now <ArrowRight size={18} />
              </Link>
              <p className="text-sm text-white/60 mt-4">
                *We don&apos;t need any access to your channel or account!
              </p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-8">24x7 NonStop YouTube Live Stream Service</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: UserPlus, title: 'Create Account', desc: 'Create Account & Choose Plan' },
                { icon: Upload, title: 'Upload Videos', desc: 'Upload Pre-Recorded Videos in Gallery' },
                { icon: Play, title: 'Start Streaming', desc: 'Just Click To Start Stream' },
              ].map((step, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="w-14 h-14 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                    <step.icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/70">{step.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-5 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
                How does <span className="text-purple-600">{brandName}</span> work?
              </h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto leading-relaxed">
                Have you noticed streams on YouTube that replay on channels for days on end without a presenter, but at the same time they always have active viewers? These are continuous streams.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: UserPlus, title: 'Create Account & Choose Your Plan', color: 'bg-purple-100 text-purple-600' },
              { icon: Upload, title: 'Upload Your Pre-Recorded Videos', color: 'bg-blue-100 text-blue-600' },
              { icon: Key, title: 'Set Your Live Stream Key', color: 'bg-green-100 text-green-600' },
              { icon: Play, title: 'Just Click & Start Streaming', color: 'bg-orange-100 text-orange-600' },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${step.color}`}>
                    <step.icon size={24} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-10">See How It Works</h3>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { title: 'Launch', desc: 'Launch your branded live video on your channel or page in just a few simple steps, using our easy-to-use video uploading dashboard.' },
              { title: 'Grow', desc: `Unlock the true potential of your videos with ${brandName} and our automatic loop video streaming system. Supercharge your reach.` },
              { title: 'Earn More', desc: `Join ${brandName} and stay ahead of the social media streaming game. Build a stable, sustainable & scalable business.` },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <h4 className="text-xl font-bold text-purple-600 mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="max-w-2xl mx-auto">
              <div className="relative pb-[56.25%] rounded-2xl overflow-hidden shadow-xl">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/upWCA4yd62g"
                  title="How To Live 24/7 On Youtube"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WHAT YOU WILL GET */}
      <section className="py-24 px-5 lg:px-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a855f7 100%)' }}>
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">What you will get?</h2>
              <h3 className="text-xl font-bold text-white/90">YouTube, Facebook Live Stream</h3>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-10">
            <Reveal delay={0.1}>
              <div>
                <h4 className="text-lg font-bold text-white mb-3">YouTube:</h4>
                <p className="text-white/80 leading-relaxed">
                  Stream loop live on YouTube with pre-recorded videos effortlessly. No dedicated computer or internet setup needed &mdash; {brandName} simplifies your streaming.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Facebook:</h4>
                <p className="text-white/80 leading-relaxed">
                  Go live on Facebook with pre-recorded content easily. No special equipment or internet setup required &mdash; stream seamlessly with {brandName}.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHY STREAM */}
      <section className="py-24 px-5 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="bg-white rounded-3xl p-10 shadow-lg border border-purple-100">
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Your Benefits</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 mb-6">
                Why You Need To Stream From <span className="text-purple-600">{brandName}?</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Have you noticed streams on YouTube channels that replay for several days, but always have an active audience?
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Because continuous stream keeps viewers active and attracts new viewers. And stream ads are often more expensive.
              </p>
              <p className="text-gray-900 font-bold">
                So, don&apos;t just stick with the regular videos, <span className="text-purple-600">Go Live and earn more &amp; more.</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-24 px-5 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black text-center text-gray-900 mb-16">
              Why You Should Choose Us?
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Play, title: 'Live Stream Quickly', desc: 'Start streaming in minutes with our simple 3-step process. No technical knowledge required.' },
              { icon: Monitor, title: 'Best Platform', desc: 'Enterprise-grade infrastructure ensures your streams run 24/7 without interruption.' },
              { icon: Upload, title: 'Pre-Recorded Videos', desc: 'Upload once and stream continuously. Your videos loop automatically.' },
              { icon: Clock, title: '24/7 Non-Stop', desc: 'Your streams run around the clock, even while you sleep.' },
              { icon: HardDrive, title: 'Cloud Storage', desc: 'Your videos are stored safely in our cloud with 2GB per slot.' },
              { icon: Headphones, title: 'Priority Support', desc: 'Get fast-track support from our streaming experts whenever you need help.' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all h-full">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                    <f.icon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-5 lg:px-8"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: 10000, suffix: '+', label: 'Active Streamers' },
              { val: 99, suffix: '.9%', label: 'Uptime Guarantee' },
              { val: 50, suffix: '+', label: 'Countries Served' },
              { val: 24, suffix: '/7', label: 'Support Available' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  <CountUp end={s.val} suffix={s.suffix} />
                </div>
                <div className="text-sm text-white/70 mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-5 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                Are you ready to try?
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                It&apos;s time to go beyond YouTube and Facebook to reach the maximum number of viewers around the world
              </p>
            </div>
          </Reveal>

          <div className="flex items-center justify-center gap-3 mb-4">
            <span className={`text-sm font-semibold ${currency === 'INR' ? 'text-purple-600' : 'text-gray-400'}`}>INR</span>
            <button onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ backgroundColor: currency === 'USD' ? '#7c3aed' : '#d1d5db' }}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                currency === 'USD' ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
            <span className={`text-sm font-semibold ${currency === 'USD' ? 'text-purple-600' : 'text-gray-400'}`}>USD</span>
          </div>
          <p className="text-xs text-gray-500 text-center mb-12">* Prices are exclusive of GST. Applicable taxes will be added at checkout.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.length > 0
              ? plans.map((plan, i) => renderPlanCard(
                  plan.name, getPrice(plan.price), getOrigPrice(getPrice(plan.price), i),
                  getDurationLabel(plan.durationType, plan.durationValue),
                  getSavePercent(i), plan.features, i, plan.id || i,
                ))
              : defaultPlans.map((plan, i) => renderPlanCard(
                  plan.name,
                  currency === 'INR' ? plan.price : Math.round(plan.price / 83),
                  currency === 'INR' ? plan.orig : Math.round(plan.orig / 83),
                  plan.duration, plan.save, plan.features, i, `default-${i}`,
                ))
            }
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-5 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Frequently Asked Questions</h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  faqOpen === i ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200 hover:border-purple-200'
                }`}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left group">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.3 }}
                      className="text-gray-400 flex-shrink-0 ml-4">
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {faqOpen === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 px-5 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Get In Touch</h2>
              <p className="text-gray-600">Ready to start your journey? Contact us today!</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-10">
            <Reveal delay={0.1}>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h3>
                <form onSubmit={handleContact} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input type="text" placeholder="Your name" value={contactForm.name}
                      onChange={e => setContactForm(p => ({...p, name: e.target.value}))}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input type="email" placeholder="your@email.com" value={contactForm.email}
                      onChange={e => setContactForm(p => ({...p, email: e.target.value}))}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea placeholder="Your message..." rows={4} value={contactForm.message}
                      onChange={e => setContactForm(p => ({...p, message: e.target.value}))}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                      required />
                  </div>
                  <button type="submit"
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all flex items-center justify-center gap-2">
                    <Mail size={16} /> Send Message
                  </button>
                  {contactStatus && <p className="text-sm text-purple-600 text-center mt-2">{contactStatus}</p>}
                </form>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                  <div className="space-y-5">
                    <a href={`mailto:${contactEmail}`} className="flex items-start gap-3 group">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Mail size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-sm font-medium text-gray-900 group-hover:text-purple-600 transition-colors">{contactEmail}</div>
                      </div>
                    </a>
                    <a href="mailto:help.streamadda@gmail.com" className="flex items-start gap-3 group">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Headphones size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Help &amp; Support</div>
                        <div className="text-sm font-medium text-gray-900 group-hover:text-purple-600 transition-colors">help.streamadda@gmail.com</div>
                      </div>
                    </a>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Address</div>
                        <div className="text-sm font-medium text-gray-900">5 Sagra Jabalpur, Madhya Pradesh, Jabalpur, India, 483220</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-600 rounded-2xl p-8 text-white">
                  <h4 className="text-lg font-bold mb-3">Ready to get started?</h4>
                  <p className="text-white/80 text-sm mb-6">Join thousands of satisfied customers who have transformed their business with {brandName}.</p>
                  <Link to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all">
                    Get Started Now <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-16 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">S</span>
                </div>
                <h3 className="text-xl font-bold">{brandName}</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">{footerText}</p>
              <div className="flex items-center gap-4">
                <a href="https://www.youtube.com/@Stream_Adda" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                  <Youtube size={20} />
                </a>
                <a href="https://x.com/stream_adda" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.instagram.com/stream__adda" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Features</h4>
              <ul className="space-y-2">
                {navLinks.slice(0, 4).map(item => (
                  <li key={item.id}>
                    <button onClick={() => scrollTo(item.id)} className="text-sm text-gray-400 hover:text-purple-400 transition-colors">{item.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Refund Policy</Link></li>
                <li><Link to="/contact" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {brandName}. Owned and operated by <strong className="text-gray-400">{companyName}</strong>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
