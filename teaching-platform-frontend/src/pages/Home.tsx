import { Link } from 'react-router-dom';
import { Search, Shield, Video, Star, Users, BookOpen, IndianRupee, ArrowRight, CheckCircle, MapPin, Zap, Clock, Award, Sparkles, Globe, Rocket, GraduationCap } from 'lucide-react';

const POPULAR_SUBJECTS = [
  { name: 'Mathematics', icon: '\ud83d\udcd0', color: 'from-blue-500 to-indigo-600' },
  { name: 'Science', icon: '\ud83d\udd2c', color: 'from-emerald-500 to-teal-600' },
  { name: 'English', icon: '\ud83d\udcdd', color: 'from-purple-500 to-violet-600' },
  { name: 'Physics', icon: '\u26a1', color: 'from-amber-500 to-orange-600' },
  { name: 'Chemistry', icon: '\ud83e\uddea', color: 'from-rose-500 to-pink-600' },
  { name: 'Computer Science', icon: '\ud83d\udcbb', color: 'from-cyan-500 to-blue-600' },
  { name: 'Hindi', icon: '\ud83d\udd24', color: 'from-orange-500 to-red-600' },
  { name: 'Biology', icon: '\ud83e\uddec', color: 'from-green-500 to-emerald-600' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Hero Section - Full 3D Immersive */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-morphBg"></div>
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-40"
              style={{top: `${15 + i * 15}%`, left: `${10 + i * 14}%`, animation: `particleFloat ${4 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s`}}></div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-slideUp">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-emerald-400 text-sm font-medium mb-8 animate-glow">
                <Sparkles size={16} className="animate-pulse" /> India's No.1 Student Coaching Platform
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-8">
                <span className="block">Future of</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 neon-text">Learning</span>
                <span className="block text-4xl md:text-5xl mt-2 text-slate-300">Starts Here</span>
              </h1>
              <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
                Connect with 2100+ expert teachers across Rajasthan. Experience immersive live classes with escrow-protected payments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/search" className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transform">
                  <Search size={22} /> Find Teachers
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center gap-3 px-8 py-4 glass text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all animate-borderGlow border border-emerald-500/30">
                  <Rocket size={20} /> Start Teaching
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-10">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><CheckCircle size={16} className="text-emerald-400" /></div>
                  Verified Teachers
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><Shield size={16} className="text-emerald-400" /></div>
                  Escrow Protection
                </div>
              </div>
            </div>

            <div className="hidden md:block perspective">
              <div className="preserve-3d animate-float">
                <div className="glass rounded-3xl p-10 animate-glow">
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      { num: '2100+', label: 'Expert Teachers', icon: <Users size={24} />, color: 'from-emerald-400 to-teal-500' },
                      { num: '5000+', label: 'Happy Students', icon: <GraduationCap size={24} />, color: 'from-cyan-400 to-blue-500' },
                      { num: '30+', label: 'Subjects', icon: <BookOpen size={24} />, color: 'from-purple-400 to-violet-500' },
                      { num: '4.8', label: 'Avg Rating', icon: <Star size={24} />, color: 'from-amber-400 to-orange-500' },
                    ].map((s, i) => (
                      <div key={i} className="card-3d glass rounded-2xl p-6 text-center group cursor-default">
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                          {s.icon}
                        </div>
                        <div className="text-3xl font-black text-white mb-1">{s.num}</div>
                        <div className="text-sm text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 text-xs">
          <span>Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="relative py-8 border-y border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/50 via-slate-900/50 to-teal-950/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-10 md:gap-20 flex-wrap">
            {[
              { icon: <Shield size={20} />, text: 'Escrow Protected' },
              { icon: <Video size={20} />, text: 'Free Live Classes' },
              { icon: <Star size={20} />, text: 'Verified Reviews' },
              { icon: <MapPin size={20} />, text: '32+ Cities' },
              { icon: <Globe size={20} />, text: '24/7 Support' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-default group">
                <span className="text-emerald-500 group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Subjects - 3D Cards */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slideUp">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-emerald-400 text-sm font-medium mb-4">
              <BookOpen size={16} /> Browse Categories
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Popular <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Subjects</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Choose from 30+ subjects taught by expert teachers</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {POPULAR_SUBJECTS.map((s, i) => (
              <Link key={s.name} to={`/search?subject=${encodeURIComponent(s.name)}`}
                className="card-3d glass rounded-2xl p-7 group cursor-pointer hover:bg-white/10 transition-all"
                style={{animationDelay: `${i * 0.1}s`}}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                  {s.icon}
                </div>
                <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{s.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Expert tutors available</p>
                <ArrowRight size={18} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-2 transition-all mt-3" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - 3D Steps */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-emerald-950/30"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-emerald-400 text-sm font-medium mb-4">
              <Zap size={16} /> Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Works</span>
            </h2>
            <p className="text-slate-400 text-lg">Get started in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', icon: <Search size={32} />, title: 'Search & Compare', desc: 'Browse teachers by subject, location, price, and rating. Compare profiles to find your perfect match.', gradient: 'from-blue-500 to-indigo-600' },
              { num: '02', icon: <Shield size={32} />, title: 'Book & Pay Securely', desc: 'Book a class and pay with our escrow system. Your money is protected until the class is completed.', gradient: 'from-emerald-500 to-teal-600' },
              { num: '03', icon: <Video size={32} />, title: 'Learn & Review', desc: 'Join live classes via free Jitsi Meet. Rate your teacher and help others find great educators.', gradient: 'from-purple-500 to-violet-600' },
            ].map((step, i) => (
              <div key={step.num} className="card-3d glass rounded-3xl p-8 group relative overflow-hidden"
                style={{animationDelay: `${i * 0.2}s`}}>
                <div className="absolute top-4 right-4 text-7xl font-black text-white/5 group-hover:text-emerald-500/10 transition-colors">{step.num}</div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-slate-950 to-slate-950"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-emerald-400 text-sm font-medium mb-6">
                <Award size={16} /> Why Choose Us
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-8">
                Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">GuruConnect</span>
              </h2>
              <div className="space-y-6">
                {[
                  { icon: <Shield size={24} />, title: 'Escrow Payment Protection', desc: 'Money stays safe until class is completed.', color: 'from-emerald-500 to-teal-600' },
                  { icon: <Video size={24} />, title: 'Free Live Video Classes', desc: 'Powered by open-source Jitsi Meet.', color: 'from-blue-500 to-cyan-600' },
                  { icon: <Award size={24} />, title: 'Verified Teacher Profiles', desc: 'Admin-verified with real reviews.', color: 'from-purple-500 to-violet-600' },
                  { icon: <Clock size={24} />, title: 'Flexible Scheduling', desc: 'Book classes at your convenience.', color: 'from-orange-500 to-amber-600' },
                ].map((f, i) => (
                  <div key={i} className="flex gap-5 group cursor-default">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{f.title}</h3>
                      <p className="text-slate-400 mt-1">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="perspective">
              <div className="preserve-3d animate-float-slow">
                <div className="glass rounded-3xl p-8 animate-glow">
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      { icon: <Users size={28} />, num: '2100+', label: 'Verified Teachers', color: 'text-emerald-400' },
                      { icon: <BookOpen size={28} />, num: '30+', label: 'Subjects', color: 'text-cyan-400' },
                      { icon: <MapPin size={28} />, num: '32+', label: 'Cities', color: 'text-purple-400' },
                      { icon: <IndianRupee size={28} />, num: '100-250', label: 'Rs/Hour Range', color: 'text-amber-400' },
                    ].map((s, i) => (
                      <div key={i} className="card-3d glass rounded-2xl p-6 text-center group cursor-default">
                        <div className={`${s.color} mb-3 flex justify-center group-hover:scale-110 transition-transform`}>{s.icon}</div>
                        <div className="text-2xl font-black text-white">{s.num}</div>
                        <div className="text-sm text-slate-400 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-emerald-950/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Thousands</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', city: 'Jaipur', text: 'Found an amazing Physics teacher. The escrow payment gave me peace of mind. Highly recommend!', rating: 5 },
              { name: 'Rahul Verma', city: 'Kota', text: 'As a teacher, GuruConnect helped me reach students across Rajasthan. Great platform for educators!', rating: 5 },
              { name: 'Anita Gupta', city: 'Udaipur', text: 'My daughter grades improved significantly after joining live classes here. Best investment!', rating: 5 },
            ].map((t, i) => (
              <div key={i} className="card-3d glass rounded-2xl p-8 group">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-300 leading-relaxed mb-6 italic">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.city}, Rajasthan</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-slate-950"></div>
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(rgba(16,185,129,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="glass rounded-3xl p-12 md:p-16 animate-glow">
            <Rocket size={48} className="mx-auto text-emerald-400 mb-6 animate-float" />
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Ready to Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Learning?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">Join thousands of students and teachers on the most futuristic teaching marketplace.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transform">
                Get Started Free <ArrowRight size={22} />
              </Link>
              <Link to="/search" className="inline-flex items-center justify-center gap-3 px-10 py-5 glass text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all border border-white/10">
                Browse Teachers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <BookOpen size={20} className="text-white" />
                </div>
                <span className="font-black text-xl text-white">GuruConnect</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">The most futuristic teaching marketplace. Connect, learn, and grow.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">For Students</h4>
              <div className="space-y-3 text-sm">
                <Link to="/search" className="block text-slate-400 hover:text-emerald-400 transition">Find Teachers</Link>
                <Link to="/register" className="block text-slate-400 hover:text-emerald-400 transition">Create Account</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">For Teachers</h4>
              <div className="space-y-3 text-sm">
                <Link to="/register" className="block text-slate-400 hover:text-emerald-400 transition">Start Teaching</Link>
                <Link to="/login" className="block text-slate-400 hover:text-emerald-400 transition">Teacher Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <div className="space-y-3 text-sm text-slate-400">
                <span className="block">Escrow Payments</span>
                <span className="block">Free Live Classes</span>
                <span className="block">Verified Teachers</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center">
            <p className="text-sm text-slate-600">GuruConnect 2026 - The Future of Teaching</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
