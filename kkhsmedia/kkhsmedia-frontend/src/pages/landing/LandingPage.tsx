import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicAPI } from '../../services/api';
import {
  ArrowRight, Zap, Shield, Cloud, Layers, Monitor,
  Radio, ChevronDown, Mail, Check,
  Youtube, Facebook, Twitch, Instagram, Menu, X,
  Play, Wifi, Sparkles, Upload
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

/* === CSS 3D ORB === */

function CSS3DOrb({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
      {/* Main orb */}
      <motion.div
        className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80"
        animate={{
          rotateX: mouse.y * 15,
          rotateY: mouse.x * 15,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Core sphere */}
        <div className="absolute inset-0 rounded-full animate-float"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #22d3ee, #0891b2 40%, #0e7490 70%, #164e63 100%)',
            boxShadow: '0 0 80px rgba(6,182,212,0.4), 0 0 160px rgba(6,182,212,0.2), inset 0 0 60px rgba(6,182,212,0.3)',
          }}
        />
        {/* Highlight */}
        <div className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.25) 0%, transparent 60%)',
          }}
        />
        {/* Glow pulse */}
        <div className="absolute -inset-8 rounded-full animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Ring 1 */}
        <div className="absolute inset-[-20%] animate-spin-slow"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(70deg)' }}>
          <div className="w-full h-full rounded-full border-2 border-purple-500/40" />
        </div>
        {/* Ring 2 */}
        <div className="absolute inset-[-30%] animate-spin-reverse"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) rotateZ(30deg)' }}>
          <div className="w-full h-full rounded-full border border-cyan-400/20" />
        </div>
        {/* Ring 3 */}
        <div className="absolute inset-[-15%] animate-spin-slow-2"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(80deg) rotateY(45deg)' }}>
          <div className="w-full h-full rounded-full border border-blue-400/30" />
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="absolute inset-[-25%]"
            style={{
              animation: `orbit-${i % 2 === 0 ? 'cw' : 'ccw'} ${8 + i * 2}s linear infinite`,
              animationDelay: `${i * -2}s`,
            }}>
            <div className={`absolute w-2 h-2 rounded-full ${
              i % 2 === 0 ? 'bg-purple-400' : 'bg-cyan-400'
            }`}
              style={{
                top: '0', left: '50%', transform: 'translateX(-50%)',
                boxShadow: i % 2 === 0 ? '0 0 10px rgba(139,92,246,0.8)' : '0 0 10px rgba(6,182,212,0.8)',
              }}
            />
          </div>
        ))}
      </motion.div>

      {/* Floating gems */}
      {[
        { x: '10%', y: '20%', size: 12, color: '#8b5cf6', delay: 0 },
        { x: '80%', y: '70%', size: 10, color: '#06b6d4', delay: 1 },
        { x: '15%', y: '75%', size: 8, color: '#a78bfa', delay: 2 },
        { x: '85%', y: '25%', size: 14, color: '#22d3ee', delay: 0.5 },
        { x: '50%', y: '10%', size: 6, color: '#8b5cf6', delay: 1.5 },
      ].map((gem, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: gem.x, top: gem.y, width: gem.size, height: gem.size,
            background: gem.color, borderRadius: '2px',
            transform: 'rotate(45deg)',
            boxShadow: `0 0 ${gem.size}px ${gem.color}60`,
          }}
          animate={{ y: [0, -15, 0], rotate: [45, 90, 45], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: gem.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* === 3D BUTTON === */

function Button3D({ children, href, to, type, onClick, variant = 'primary', size = 'md', className = '' }: {
  children: React.ReactNode; href?: string; to?: string; type?: 'submit' | 'button'; onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' | 'lg'; className?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const sz: Record<string, string> = { sm: 'px-4 py-2 text-xs', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base' };
  const vr: Record<string, string> = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold border border-cyan-400/20',
    secondary: 'bg-white/5 backdrop-blur-sm text-gray-200 font-medium border border-white/10',
    ghost: 'bg-transparent text-gray-300 font-medium border border-transparent',
  };

  const style: React.CSSProperties = {
    transform: pressed
      ? 'perspective(600px) translateY(2px) scale(0.97)'
      : hovered
        ? 'perspective(600px) translateY(-3px) rotateX(2deg) scale(1.02)'
        : 'perspective(600px) translateY(0) rotateX(0) scale(1)',
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: pressed
      ? (variant === 'primary' ? 'inset 0 2px 12px rgba(6,182,212,0.5), 0 2px 8px rgba(6,182,212,0.2)' : 'inset 0 2px 8px rgba(255,255,255,0.05)')
      : hovered
        ? (variant === 'primary' ? '0 8px 30px rgba(6,182,212,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 4px 16px rgba(0,0,0,0.4)')
        : (variant === 'primary' ? '0 4px 15px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 2px 8px rgba(0,0,0,0.3)'),
  };

  const cls = `relative inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer select-none overflow-hidden ${sz[size]} ${vr[variant]} ${className}`;
  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => { setHovered(false); setPressed(false); },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
  };

  const glow = (
    <span
      className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
      style={{
        opacity: hovered ? 1 : 0,
        background: variant === 'primary'
          ? 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.3) 0%, transparent 70%)'
          : 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)',
      }}
    />
  );
  const inner = <span className="relative z-10 flex items-center gap-2">{children}</span>;

  if (to) return <Link to={to} className={cls} style={style} {...handlers}>{glow}{inner}</Link>;
  if (href) return <a href={href} className={cls} style={style} {...handlers}>{glow}{inner}</a>;
  return <button type={type || 'button'} onClick={onClick} className={cls} style={style} {...handlers}>{glow}{inner}</button>;
}

/* === TILT CARD === */

function TiltCard({ children, className = '', glowColor = 'cyan' }: {
  children: React.ReactNode; className?: string; glowColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }, [mx, my]);

  const handleLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  const gc: Record<string, string> = {
    cyan: 'rgba(6,182,212,0.08)',
    purple: 'rgba(139,92,246,0.08)',
    blue: 'rgba(59,130,246,0.08)',
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: '1000px' }}
      className={`relative group rounded-2xl p-px bg-gradient-to-br from-white/[0.08] to-white/[0.02] hover:shadow-2xl transition-shadow duration-500 ${className}`}
    >
      <div className="relative rounded-2xl bg-[#0d0d14] p-6 h-full overflow-hidden">
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${gc[glowColor] || gc.cyan} 0%, transparent 60%)` }}
        />
        <div style={{ transform: 'translateZ(20px)' }} className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}

/* === PARTICLES === */

function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1, duration: Math.random() * 20 + 15,
      delay: Math.random() * 10, opacity: Math.random() * 0.3 + 0.05,
    })),
  []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
            background: p.id % 3 === 0 ? '#06b6d4' : p.id % 3 === 1 ? '#8b5cf6' : '#a78bfa',
            opacity: p.opacity,
          }}
          animate={{ y: [0, -30, 0], opacity: [p.opacity, p.opacity * 1.5, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* === TYPING TEXT === */

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

  return <>{words[wi].slice(0, ci)}<span className="animate-pulse text-cyan-400">|</span></>;
}

/* === COUNT UP === */

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

/* === REVEAL === */

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

/* ========== MAIN ========== */

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
  const [mouse3D, setMouse3D] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [contactStatus, setContactStatus] = useState('');

  useEffect(() => {
    publicAPI.getProducts().then((r: { data: PlanData[] }) => setPlans(r.data)).catch(() => {});
    publicAPI.getSettings().then((r: { data: SiteSettings }) => setSiteSettings(r.data)).catch(() => {});
  }, []);

  const getLogoUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
  };

  const headerLogo = getLogoUrl(siteSettings.headerLogoUrl) || '/header-logo.png';
  const footerLogo = getLogoUrl(siteSettings.footerLogoUrl) || '/footer-logo.png';
  const heroTitle = siteSettings.heroTitle || 'Stream Live 24/7';
  const heroSub = siteSettings.heroSubtitle || 'Stream your pre-recorded videos 24/7 on YouTube, Facebook, Twitch & more. Automated, reliable, and simple.';
  const footerText = siteSettings.footerText || 'The Best Professional Pre-Recorded Video Live Streaming Platform.';
  const brandName = siteSettings.brandName || 'GoLivePro';
  const companyName = siteSettings.companyName || 'KKHS Media Private Limited';
  const contactEmail = siteSettings.contactEmail || 'info@golivepro.in';

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse3D({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    });
  }, []);

  const getPrice = (price: PlanData['price']): number => {
    if (typeof price === 'number') return price;
    if (price && typeof price === 'object' && 'INR' in price) return price.INR;
    return 0;
  };

  const getDurationLabel = (type: string, val: number) => {
    if (val === 1) {
      switch (type) { case 'day': return '/day'; case 'week': return '/week'; case 'month': return '/month'; default: return ''; }
    }
    return `/${val} ${type}s`;
  };

  const features = [
    { icon: Radio, title: '24/7 Streaming', desc: 'Continuous non-stop streaming that runs while you sleep.', color: 'cyan' },
    { icon: Monitor, title: 'Multi-Platform', desc: 'YouTube, Facebook, Twitch, Instagram & custom RTMP.', color: 'purple' },
    { icon: Cloud, title: 'Cloud-Based', desc: 'No computer needed. We handle everything in the cloud.', color: 'blue' },
    { icon: Zap, title: 'Instant Setup', desc: 'Upload video, paste stream key, click start. That simple.', color: 'cyan' },
    { icon: Shield, title: '99.9% Uptime', desc: 'Enterprise-grade reliability with auto-restart on failure.', color: 'purple' },
    { icon: Layers, title: 'Multi-Stream', desc: 'Simulcast to multiple platforms at the same time.', color: 'blue' },
  ];

  const faqs = [
    { q: 'What is GoLivePro?', a: 'GoLivePro is a professional platform for 24/7 pre-recorded video live streaming to YouTube, Facebook, Twitch and more.' },
    { q: 'How does it work?', a: 'Upload your video, paste your stream key, and click start. Your video will broadcast continuously 24/7.' },
    { q: 'Which platforms are supported?', a: 'YouTube, Facebook, Twitch, Instagram, and any custom RTMP server.' },
    { q: 'Can I stream to multiple platforms?', a: 'Yes! With simulcast you can stream to YouTube, Facebook, and Twitch simultaneously.' },
    { q: 'What video formats are supported?', a: 'MP4, MKV, AVI, MOV, FLV and most common video formats.' },
    { q: 'Is there a free trial?', a: 'We offer affordable plans starting from just \u20b933/day so you can test the platform with minimal commitment.' },
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

  return (
    <div className="min-h-screen bg-[#060611] text-white overflow-x-hidden" onMouseMove={handleMouseMove}>
      <Particles />

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#060611]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto h-16 flex items-center px-5 lg:px-8">
          <Link to="/" className="flex items-center group">
            <img src={headerLogo} alt={brandName} className="h-9 object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all" />
          </Link>

          <div className="hidden md:flex items-center gap-8 ml-12">
            {['Features', 'Pricing', 'FAQ', 'Contact'].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`}
                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300 relative group/nav">
                {s}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 group-hover/nav:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button3D to="/login" variant="ghost" size="sm">Log in</Button3D>
            <Button3D to="/register" variant="primary" size="sm" className="hidden sm:inline-flex">
              Get Started <ArrowRight size={14} />
            </Button3D>
            <button className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setMobileMenu(p => !p)}>
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-3 right-3 z-40 rounded-2xl bg-[#0d0d1a]/95 backdrop-blur-2xl border border-white/[0.08] p-5 md:hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          >
            {['Features', 'Pricing', 'FAQ', 'Contact'].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                className="block py-3 text-sm text-gray-300 hover:text-cyan-400 transition-colors border-b border-white/[0.04] last:border-0">{s}</a>
            ))}
            <Button3D to="/register" variant="primary" size="md" className="w-full mt-4">
              Get Started <ArrowRight size={14} />
            </Button3D>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.07] blur-[120px]" />
          <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-blue-500/[0.04] blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left text */}
          <div className="text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] mb-8">
                <Sparkles size={13} className="text-cyan-400" />
                <span className="text-xs font-medium text-cyan-300 tracking-wide">Professional Live Streaming Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] mb-6">
                <span className="text-white">{heroTitle}</span><br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  <TypingText words={['Like a Pro', 'Non-Stop', 'Everywhere', 'Effortlessly']} />
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
                {heroSub}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button3D to="/register" variant="primary" size="lg">
                  <Play size={16} className="fill-current" /> Go Live Now <ArrowRight size={16} />
                </Button3D>
                <Button3D href="#features" variant="secondary" size="lg">
                  Explore Features
                </Button3D>
              </div>

              <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
                {[{ val: '24/7', label: 'Uptime' }, { val: '1080p', label: 'Quality' }, { val: '99.9%', label: 'Reliability' }].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }} className="text-center">
                    <div className="text-2xl font-black text-white">{s.val}</div>
                    <div className="text-xs text-gray-500 mt-1 tracking-wide uppercase">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right 3D Orb */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative h-[350px] sm:h-[450px] lg:h-[500px]">
            <CSS3DOrb mouse={mouse3D} />
          </motion.div>
        </div>

        {/* Platform logos */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-10 text-gray-500">
          {[{ Icon: Youtube, name: 'YouTube' }, { Icon: Facebook, name: 'Facebook' }, { Icon: Twitch, name: 'Twitch' }, { Icon: Instagram, name: 'Instagram' }].map(({ Icon, name }, i) => (
            <motion.div key={i} whileHover={{ scale: 1.15, color: '#06b6d4' }}
              className="flex flex-col items-center gap-1 cursor-default transition-colors">
              <Icon size={22} /><span className="text-[10px] tracking-wide">{name}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-28 px-5 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-[0.2em] mb-3 block">Simple Process</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                Start streaming in <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">3 steps</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Upload Video', desc: 'Upload your video file. MP4, MKV, and more supported.', icon: Upload, c: 'cyan' },
              { num: '02', title: 'Add Stream Key', desc: 'Paste your YouTube, Facebook, or custom RTMP key.', icon: Wifi, c: 'purple' },
              { num: '03', title: 'Go Live!', desc: 'Click start and your video broadcasts 24/7 continuously.', icon: Play, c: 'blue' },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <TiltCard glowColor={step.c}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      step.c === 'cyan' ? 'bg-cyan-500/10 text-cyan-400'
                      : step.c === 'purple' ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      <step.icon size={20} />
                    </div>
                    <span className="text-xs font-black text-gray-600 tracking-widest">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-28 px-5 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-[0.2em] mb-3 block">Features</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                Everything you <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">need</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <TiltCard glowColor={f.color}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    f.color === 'cyan' ? 'bg-cyan-500/10' : f.color === 'purple' ? 'bg-purple-500/10' : 'bg-blue-500/10'
                  }`}>
                    <f.icon size={22} className={
                      f.color === 'cyan' ? 'text-cyan-400' : f.color === 'purple' ? 'text-purple-400' : 'text-blue-400'
                    } />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-20 px-5 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-3xl bg-gradient-to-r from-cyan-500/[0.08] via-purple-500/[0.05] to-blue-500/[0.08] border border-white/[0.06] p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { val: 10000, suffix: '+', label: 'Streams Delivered' },
                  { val: 99, suffix: '.9%', label: 'Uptime Guarantee' },
                  { val: 50, suffix: '+', label: 'Countries Served' },
                  { val: 24, suffix: '/7', label: 'Live Support' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                      <CountUp end={s.val} suffix={s.suffix} />
                    </div>
                    <div className="text-xs text-gray-500 mt-2 tracking-wide uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-28 px-5 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-[0.2em] mb-3 block">Pricing</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                Simple & <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">transparent</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const popular = i === 1;
              const priceNum = getPrice(plan.price);
              return (
                <Reveal key={plan.id || i} delay={i * 0.12}>
                  <div className={`relative rounded-2xl p-px ${
                    popular
                      ? 'bg-gradient-to-br from-cyan-500/50 via-purple-500/50 to-blue-500/50'
                      : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02]'
                  }`}>
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <span className="px-4 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-[11px] font-bold text-white shadow-[0_4px_15px_rgba(6,182,212,0.4)]">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    <div className="relative rounded-2xl bg-[#0a0a16] p-7 h-full">
                      {popular && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-500/[0.06] to-transparent pointer-events-none" />
                      )}
                      <div className="relative z-10">
                        <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mb-5">{plan.streamQuality} Quality</p>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            {'\u20B9'}{Math.round(priceNum)}
                          </span>
                          <span className="text-sm text-gray-500">{getDurationLabel(plan.durationType, plan.durationValue)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-6">+ 18% GST</p>
                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feat, fi) => (
                            <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-300">
                              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <Check size={12} className="text-green-400" />
                              </div>
                              {feat}
                            </li>
                          ))}
                        </ul>
                        <Button3D to="/register" variant={popular ? 'primary' : 'secondary'} size="md" className="w-full">
                          Get started <ArrowRight size={14} />
                        </Button3D>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 px-5 lg:px-8 relative">
        <div className="max-w-2xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-[0.2em] mb-3 block">FAQ</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                Common <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">questions</span>
              </h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  faqOpen === i
                    ? 'bg-white/[0.03] border-cyan-500/20'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
                }`}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left group">
                    <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">{faq.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.3 }}
                      className="text-gray-500 flex-shrink-0 ml-4">
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
                        <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
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
      <section id="contact" className="py-28 px-5 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />
        <div className="max-w-2xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-[0.2em] mb-3 block">Contact</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                Get in <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">touch</span>
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8">
              <div className="flex items-center gap-2.5 mb-8 text-sm text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Mail size={16} className="text-purple-400" />
                </div>
                {contactEmail}
              </div>
              <form onSubmit={handleContact} className="space-y-4">
                <input type="text" placeholder="Name" value={contactForm.name}
                  onChange={e => setContactForm(p => ({...p, name: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 outline-none focus:border-cyan-500/40 transition-all"
                  required />
                <input type="email" placeholder="Email" value={contactForm.email}
                  onChange={e => setContactForm(p => ({...p, email: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 outline-none focus:border-cyan-500/40 transition-all"
                  required />
                <textarea placeholder="Message" rows={4} value={contactForm.message}
                  onChange={e => setContactForm(p => ({...p, message: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 outline-none focus:border-cyan-500/40 transition-all resize-none"
                  required />
                <Button3D type="submit" variant="primary" size="md">
                  <Mail size={14} /> Send message <ArrowRight size={14} />
                </Button3D>
                {contactStatus && <p className="text-sm text-cyan-400 text-center mt-2">{contactStatus}</p>}
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-28 px-5 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-purple-600/20 to-blue-600/20" />
              <div className="absolute inset-0 bg-[#0a0a16]/80" />
              <div className="absolute inset-[1px] rounded-3xl border border-white/[0.06]" />
              <div className="relative z-10 text-center py-16 px-8">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to go live?</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  {footerText}
                </p>
                <Button3D to="/register" variant="primary" size="lg">
                  Start Streaming Free <ArrowRight size={16} />
                </Button3D>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.04] py-10 px-5 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={footerLogo} alt={brandName} className="h-8 object-contain" />
            <span className="text-xs text-gray-600">&copy; {new Date().getFullYear()} {companyName}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">Terms</Link>
            <Link to="/refund-policy" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
