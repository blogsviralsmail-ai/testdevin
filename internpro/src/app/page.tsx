import Link from "next/link";

const features = [
  { icon: "📚", title: "Program Management", desc: "Create online/offline/hybrid internship programs with flexible pricing - Free, Paid, or Stipend." },
  { icon: "📅", title: "Smart Attendance", desc: "QR code scan for offline, login tracking for online. Auto reports & reminders." },
  { icon: "🎥", title: "Pre-recorded LMS", desc: "Upload video lessons & materials. Students learn at their own pace and complete tasks." },
  { icon: "📝", title: "Task Management", desc: "Assign regular & urgent tasks. Students submit work reports. Auto grading system." },
  { icon: "🏆", title: "Auto Certificates", desc: "Generate certificates with QR verification. Offer letters, NOC, experience letters - all auto." },
  { icon: "💰", title: "Payment & Stipend", desc: "Collect fees via payment gateway. Auto-calculate stipends based on attendance." },
  { icon: "👥", title: "Team Management", desc: "Assign team leaders. Track progress per batch. Review student work." },
  { icon: "📊", title: "Analytics Dashboard", desc: "Real-time stats for admin, team leaders, and students. Revenue, attendance, performance tracking." },
];

const stats = [
  { number: "10,000+", label: "Students Certified" },
  { number: "500+", label: "Programs Created" },
  { number: "100+", label: "Institutes" },
  { number: "95%", label: "Satisfaction Rate" },
];

const pricing = [
  { name: "Free", price: "₹0", period: "/month", features: ["1 Program", "20 Students", "Basic Attendance", "Certificates", "Email Support"], highlighted: false },
  { name: "Starter", price: "₹999", period: "/month", features: ["5 Programs", "100 Students", "QR Attendance", "Payment Gateway", "Priority Support", "Custom Certificates"], highlighted: false },
  { name: "Professional", price: "₹2,999", period: "/month", features: ["Unlimited Programs", "500 Students", "Full LMS", "Salary Management", "WhatsApp Notifications", "Analytics Dashboard", "API Access"], highlighted: true },
  { name: "Enterprise", price: "₹9,999", period: "/month", features: ["Everything in Pro", "Unlimited Students", "White-label Branding", "Custom Domain", "Dedicated Support", "Custom Integrations", "SLA Guarantee"], highlighted: false },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">IP</div>
              <span className="text-xl font-bold gradient-text">InternPro</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-600 transition">Pricing</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 transition">How it Works</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 font-medium transition">Login</Link>
              <Link href="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-6">
            UGC Compliant Internship Management
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Internship Management <br />
            <span className="gradient-text">on Auto-Pilot</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Everything you need to run internship programs — student onboarding, pre-recorded video lessons,
            task management, QR attendance, auto certificates, and payment tracking. All in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              Start Free — No Credit Card
            </Link>
            <Link href="/login" className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-indigo-300 transition">
              View Demo Dashboard
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">Free plan includes 20 students • No setup fees • Cancel anytime</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 gradient-bg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-indigo-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Complete internship lifecycle management — from enrollment to certification.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 card-hover border border-gray-100">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">4 simple steps to manage your internship program</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Create Program", desc: "Set up your internship with details, pricing, and materials. Upload pre-recorded videos." },
              { step: "2", title: "Students Enroll", desc: "Students register online. Auto offer letter generated. Bulk import via CSV." },
              { step: "3", title: "Learn & Track", desc: "Students watch videos, complete tasks. QR attendance. Progress auto-tracked." },
              { step: "4", title: "Certify & Pay", desc: "Auto certificates on completion. Stipend calculated by attendance. All automated." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full gradient-bg text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Start free, upgrade as you grow</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((plan) => (
              <div key={plan.name} className={`rounded-xl p-8 card-hover ${plan.highlighted ? "bg-indigo-600 text-white ring-4 ring-indigo-200 scale-105" : "bg-white border border-gray-200"}`}>
                <h3 className={`text-lg font-semibold mb-2 ${plan.highlighted ? "text-indigo-100" : "text-gray-600"}`}>{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  <span className={plan.highlighted ? "text-indigo-200" : "text-gray-500"}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className={plan.highlighted ? "text-indigo-200" : "text-indigo-600"}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-3 px-6 rounded-lg font-semibold transition ${plan.highlighted ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 gradient-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Automate Your Internship Programs?</h2>
          <p className="text-xl text-indigo-100 mb-8">Join 100+ institutes already using InternPro. Start free today.</p>
          <Link href="/register" className="inline-block bg-white text-indigo-600 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition shadow-xl">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">IP</div>
              <span className="text-xl font-bold text-white">InternPro</span>
            </div>
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} InternPro. All rights reserved. Built with Next.js</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
