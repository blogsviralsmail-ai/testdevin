import { Link } from 'react-router-dom';
import { Search, GraduationCap, Shield, Video, Star, Users, BookOpen, IndianRupee } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Best Teachers, <br className="hidden md:block" />
            <span className="text-yellow-300">Best Education</span>
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 mb-10 max-w-3xl mx-auto">
            Find expert teachers near you for online & offline classes. Book classes, pay securely with our escrow system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-indigo-50 transition shadow-lg"
            >
              <Search size={22} /> Find Teachers
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-800 text-white rounded-xl font-bold text-lg hover:bg-indigo-900 transition border border-indigo-400"
            >
              <GraduationCap size={22} /> Become a Teacher
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">Why GuruConnect?</h2>
          <p className="text-gray-500 text-center mb-12 text-lg">India's most trusted teaching platform</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Search size={32} />, title: 'Smart Search', desc: 'Search by location, subject, class level, price range & rating' },
              { icon: <Shield size={32} />, title: 'Escrow Payment', desc: 'Secure payments - money released only after class completion' },
              { icon: <Video size={32} />, title: 'Live Classes', desc: 'Free video classes via Jitsi Meet - no extra charges' },
              { icon: <Star size={32} />, title: 'Verified Teachers', desc: 'Admin verified teachers with ratings & reviews' },
            ].map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition group">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Users size={28} />, num: '100+', label: 'Expert Teachers' },
              { icon: <BookOpen size={28} />, num: '30+', label: 'Subjects' },
              { icon: <Star size={28} />, num: '4.8', label: 'Avg Rating' },
              { icon: <IndianRupee size={28} />, num: '100-250', label: 'Per Hour (Rs)' },
            ].map((s, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto mb-3">
                  {s.icon}
                </div>
                <div className="text-3xl font-bold text-gray-800">{s.num}</div>
                <div className="text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Search & Find', desc: 'Search teachers by subject, location, class level. Filter by price & rating.' },
              { step: '2', title: 'Book & Pay', desc: 'Book a class slot. Pay securely - money stays in escrow until class is done.' },
              { step: '3', title: 'Learn & Review', desc: 'Join live class via free Jitsi Meet link. Rate & review your teacher.' },
            ].map((s, i) => (
              <div key={i} className="text-center p-8 bg-white rounded-2xl shadow-md">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{s.title}</h3>
                <p className="text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-indigo-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
        <p className="text-indigo-200 mb-8 text-lg">Join thousands of students finding the best teachers near them</p>
        <Link
          to="/register"
          className="inline-block px-10 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-indigo-50 transition"
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center">
        <p>GuruConnect - India's Trusted Teaching Platform</p>
        <p className="text-sm mt-2">Secure Escrow Payments | Free Live Classes | Verified Teachers</p>
      </footer>
    </div>
  );
}
