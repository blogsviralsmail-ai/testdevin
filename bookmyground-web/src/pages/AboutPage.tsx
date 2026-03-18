import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, MapPin, Shield, Star, Zap, Heart, Target, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export default function AboutPage() {
  const [cmsContent, setCmsContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicPage('about')
      .then((page: Record<string, unknown>) => {
        if (page && page.content && String(page.content) !== '<p>Coming soon</p>') {
          setCmsContent(String(page.content));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const stats = [
    { label: 'Grounds Listed', value: '500+', icon: MapPin },
    { label: 'Happy Players', value: '10,000+', icon: Users },
    { label: 'Cities Covered', value: '50+', icon: Target },
    { label: 'Bookings Done', value: '25,000+', icon: CheckCircle },
  ];

  const features = [
    { icon: Zap, title: 'Instant Booking', desc: 'Book your favourite ground in just a few taps. No calls, no waiting - instant confirmation.' },
    { icon: Shield, title: 'Secure Payments', desc: 'Multiple payment options including UPI, cards, net banking & wallet with 100% secure transactions.' },
    { icon: Star, title: 'Verified Grounds', desc: 'Every ground is verified for quality, facilities, and accurate information before listing.' },
    { icon: Heart, title: 'Cashback Rewards', desc: 'Earn cashback on every booking. Refer friends and earn even more rewards.' },
    { icon: Trophy, title: 'Tournaments', desc: 'Organize and participate in tournaments. Manage teams, fixtures, and scores all in one place.' },
    { icon: Award, title: 'Premium Support', desc: '24/7 customer support to help you with bookings, payments, and any queries.' },
  ];

  const team = [
    { name: 'KKHS Media Private Limited', role: 'Technology & Innovation', desc: 'BookAGround is a product of KKHS Media Private Limited. We build innovative sports tech solutions to make ground booking seamless for every player in India. Address: 190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012. GSTIN: 08AAICK3853C1ZL' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">&#127951;</div>
          <div className="absolute bottom-10 right-10 text-8xl">&#9917;</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl opacity-5">&#127947;</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Trophy size={16} /> India's #1 Sports Ground Booking Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              About <span className="text-yellow-300">BookAGround</span>
            </h1>
            <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to make sports accessible to everyone. BookAGround connects players 
              with the best sports facilities across India, making ground booking as easy as ordering food online.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* CMS Dynamic Content (if admin has set it) */}
      {cmsContent && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100">
            <div className="prose prose-green max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-a:text-green-600 prose-strong:text-gray-800" 
              dangerouslySetInnerHTML={{ __html: cmsContent }} 
            />
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <stat.icon className="mx-auto text-green-600 mb-3" size={28} />
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                BookAGround was born from a simple frustration - finding and booking a sports ground shouldn't be this hard. 
                As cricket and sports enthusiasts ourselves, we experienced the pain of calling multiple ground owners, 
                negotiating prices, and dealing with last-minute cancellations.
              </p>
              <p>
                We built BookAGround to solve this problem once and for all. Our platform brings together ground owners 
                and players on a single, transparent marketplace where booking is instant, payments are secure, 
                and the entire experience is seamless.
              </p>
              <p>
                Today, we're proud to serve thousands of players across India, helping them find and book 
                cricket grounds, football turfs, badminton courts, tennis courts, and more - all at the tap of a button.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <Target size={24} /> Our Mission
            </h3>
            <p className="text-green-700 leading-relaxed mb-6">
              To make sports accessible to every Indian by providing a seamless, reliable, and affordable 
              platform for discovering and booking sports grounds instantly.
            </p>
            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <Star size={24} /> Our Vision
            </h3>
            <p className="text-green-700 leading-relaxed">
              To become the largest and most trusted sports facility marketplace in India, empowering 
              millions of players and thousands of ground owners.
            </p>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose BookAGround?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Everything you need for the perfect sports experience, all in one platform.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="group p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:bg-green-200 transition-colors">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sports We Cover */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Sports We Cover</h2>
          <p className="text-gray-500">Find grounds for all your favourite sports</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {[
            { emoji: '\u{1F3CF}', name: 'Cricket' },
            { emoji: '\u26BD', name: 'Football' },
            { emoji: '\u{1F3F8}', name: 'Badminton' },
            { emoji: '\u{1F3BE}', name: 'Tennis' },
            { emoji: '\u{1F3CA}', name: 'Swimming' },
            { emoji: '\u{1F3C0}', name: 'Basketball' },
            { emoji: '\u{1F3D0}', name: 'Volleyball' },
            { emoji: '\u{1F3D3}', name: 'Table Tennis' },
            { emoji: '\u{1F93C}', name: 'Kabaddi' },
          ].map((sport) => (
            <div key={sport.name} className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-2">{sport.emoji}</div>
              <div className="text-xs font-medium text-gray-700">{sport.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* For Ground Owners */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">For Ground Owners</h2>
              <p className="text-green-100 mb-8 leading-relaxed">
                Join BookAGround and grow your business. Our platform helps you manage bookings, 
                payments, and customers efficiently - all from one dashboard.
              </p>
              <div className="space-y-4">
                {['Increase your ground visibility', 'Get instant online bookings', 'Secure payment settlement', 'Manage slots & pricing easily', 'Analytics & performance reports'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-yellow-300 flex-shrink-0" />
                    <span className="text-green-50">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="text-5xl mb-4">&#127962;</div>
                <h3 className="text-2xl font-bold mb-3">List Your Ground</h3>
                <p className="text-green-100 mb-6 text-sm">Start receiving bookings within 24 hours of registration</p>
                <Link to="/owner" className="inline-flex items-center gap-2 bg-yellow-400 text-green-900 px-6 py-3 rounded-xl font-semibold hover:bg-yellow-300 transition">
                  Register Now <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team / Powered By */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered By</h2>
        </div>
        <div className="max-w-lg mx-auto">
          {team.map((member) => (
            <div key={member.name} className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                K
              </div>
              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
              <p className="text-green-600 font-medium text-sm mb-3">{member.role}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{member.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of players who trust BookAGround for their sports bookings. 
            Find and book the best grounds near you instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition">
              Browse Grounds <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition border border-white/20">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
