import { Link } from 'react-router-dom';
import { Search, Shield, Video, Star, Users, BookOpen, IndianRupee, ArrowRight, CheckCircle, MapPin, Zap, Clock, Award } from 'lucide-react';

const POPULAR_SUBJECTS = [
  { name: 'Mathematics', icon: '\ud83d\udcd0' },
  { name: 'Science', icon: '\ud83d\udd2c' },
  { name: 'English', icon: '\ud83d\udcdd' },
  { name: 'Physics', icon: '\u26a1' },
  { name: 'Chemistry', icon: '\ud83e\uddea' },
  { name: 'Computer Science', icon: '\ud83d\udcbb' },
  { name: 'Hindi', icon: '\ud83d\udd24' },
  { name: 'Biology', icon: '\ud83e\uddec' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(16,185,129,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(20,184,166,0.2) 0%, transparent 50%)'}}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
                <Zap size={14} /> India's #1 Teaching Marketplace
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Find the Perfect
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300"> Teacher </span>
                for You
              </h1>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                Connect with expert teachers across Rajasthan. Book live classes, pay securely with escrow protection, and start learning today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/search" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-base hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">
                  <Search size={20} /> Find Teachers
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 text-white rounded-xl font-semibold text-base hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm">
                  Start Teaching <ArrowRight size={18} />
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-400" /> Verified Teachers</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-400" /> Escrow Protection</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-2xl p-5 text-center backdrop-blur-sm"><div className="text-3xl font-bold text-white">2100+</div><div className="text-sm text-slate-300 mt-1">Expert Teachers</div></div>
                  <div className="bg-white/10 rounded-2xl p-5 text-center backdrop-blur-sm"><div className="text-3xl font-bold text-white">5000+</div><div className="text-sm text-slate-300 mt-1">Happy Students</div></div>
                  <div className="bg-white/10 rounded-2xl p-5 text-center backdrop-blur-sm"><div className="text-3xl font-bold text-white">30+</div><div className="text-sm text-slate-300 mt-1">Subjects</div></div>
                  <div className="bg-emerald-500/20 rounded-2xl p-5 text-center backdrop-blur-sm border border-emerald-500/20"><div className="text-3xl font-bold text-emerald-400">4.8</div><div className="text-sm text-emerald-300 mt-1">Avg Rating</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-8 md:gap-16 text-gray-400 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium"><Shield size={18} /> Escrow Protected</div>
            <div className="flex items-center gap-2 text-sm font-medium"><Video size={18} /> Free Jitsi Classes</div>
            <div className="flex items-center gap-2 text-sm font-medium"><Star size={18} /> Verified Reviews</div>
            <div className="flex items-center gap-2 text-sm font-medium"><MapPin size={18} /> 32+ Cities</div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Popular Subjects</h2>
            <p className="text-gray-500 text-lg">Browse teachers by subject expertise</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {POPULAR_SUBJECTS.map(s => (
              <Link key={s.name} to={`/search?subject=${encodeURIComponent(s.name)}`}
                className="group relative overflow-hidden rounded-2xl p-6 bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">{s.name}</h3>
                <p className="text-sm text-gray-400 mt-1">Expert tutors available</p>
                <ArrowRight size={16} className="absolute top-6 right-6 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 text-lg">Get started in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', icon: <Search size={28} />, title: 'Search & Compare', desc: 'Browse teachers by subject, location, price, and rating. Compare profiles to find your perfect match.', color: 'bg-blue-50 text-blue-600' },
              { num: '02', icon: <Shield size={28} />, title: 'Book & Pay Securely', desc: 'Book a class and pay with our escrow system. Your money is protected until the class is completed.', color: 'bg-emerald-50 text-emerald-600' },
              { num: '03', icon: <Video size={28} />, title: 'Learn & Review', desc: 'Join live classes via free Jitsi Meet. Rate your teacher and help others find great educators.', color: 'bg-purple-50 text-purple-600' },
            ].map(step => (
              <div key={step.num} className="relative bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                <span className="absolute top-6 right-6 text-5xl font-bold text-gray-100 group-hover:text-emerald-100 transition-colors">{step.num}</span>
                <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-5`}>{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Why Choose GuruConnect</h2>
              <div className="space-y-5">
                {[
                  { icon: <Shield size={22} />, title: 'Escrow Payment Protection', desc: 'Money stays safe until class is completed.', color: 'text-emerald-600 bg-emerald-50' },
                  { icon: <Video size={22} />, title: 'Free Live Video Classes', desc: 'Powered by open-source Jitsi Meet.', color: 'text-blue-600 bg-blue-50' },
                  { icon: <Award size={22} />, title: 'Verified Teacher Profiles', desc: 'Admin-verified with real reviews.', color: 'text-purple-600 bg-purple-50' },
                  { icon: <Clock size={22} />, title: 'Flexible Scheduling', desc: 'Book classes at your convenience.', color: 'text-orange-600 bg-orange-50' },
                ].map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center flex-shrink-0`}>{f.icon}</div>
                    <div><h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3><p className="text-gray-500 text-sm">{f.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm"><Users size={24} className="text-emerald-600 mb-3" /><div className="text-2xl font-bold text-gray-900">2100+</div><div className="text-sm text-gray-500">Verified Teachers</div></div>
                <div className="bg-white rounded-2xl p-5 shadow-sm"><BookOpen size={24} className="text-blue-600 mb-3" /><div className="text-2xl font-bold text-gray-900">30+</div><div className="text-sm text-gray-500">Subjects</div></div>
                <div className="bg-white rounded-2xl p-5 shadow-sm"><MapPin size={24} className="text-purple-600 mb-3" /><div className="text-2xl font-bold text-gray-900">32+</div><div className="text-sm text-gray-500">Cities</div></div>
                <div className="bg-white rounded-2xl p-5 shadow-sm"><IndianRupee size={24} className="text-orange-600 mb-3" /><div className="text-2xl font-bold text-gray-900">100-250</div><div className="text-sm text-gray-500">Rs/Hour Range</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">Join thousands of students on GuruConnect.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">Get Started Free <ArrowRight size={20} /></Link>
            <Link to="/search" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/10">Browse Teachers</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center"><BookOpen size={16} className="text-white" /></div><span className="font-bold text-white text-lg">GuruConnect</span></div>
              <p className="text-sm leading-relaxed">India's trusted teaching marketplace.</p>
            </div>
            <div><h4 className="font-semibold text-white mb-3">For Students</h4><div className="space-y-2 text-sm"><Link to="/search" className="block hover:text-white transition">Find Teachers</Link><Link to="/register" className="block hover:text-white transition">Create Account</Link></div></div>
            <div><h4 className="font-semibold text-white mb-3">For Teachers</h4><div className="space-y-2 text-sm"><Link to="/register" className="block hover:text-white transition">Start Teaching</Link><Link to="/login" className="block hover:text-white transition">Teacher Login</Link></div></div>
            <div><h4 className="font-semibold text-white mb-3">Platform</h4><div className="space-y-2 text-sm"><span className="block">Escrow Payments</span><span className="block">Free Live Classes</span><span className="block">Verified Teachers</span></div></div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm"><p>GuruConnect - Teaching Marketplace</p></div>
        </div>
      </footer>
    </div>
  );
}
