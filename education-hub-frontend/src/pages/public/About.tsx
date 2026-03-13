import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import SEO from "../../components/SEO";
import { GraduationCap, Target, Users, Award, Heart, CheckCircle, ArrowRight, Sparkles, BookOpen, Shield, Clock, Building2, TrendingUp } from "lucide-react";

export default function About() {
  const [s, setS] = useState<Record<string, string>>({});
  useEffect(() => { api.get("/api/settings").then((r) => setS(r.data || {})).catch(() => {}); }, []);

  const values = [
    { icon: Heart, title: s.about_value_1_title || "Student First", desc: s.about_value_1_desc || "Every decision we make is centered around student welfare and success.", color: "red" },
    { icon: Award, title: s.about_value_2_title || "Quality", desc: s.about_value_2_desc || "We partner only with accredited, recognized universities.", color: "yellow" },
    { icon: Users, title: s.about_value_3_title || "Transparency", desc: s.about_value_3_desc || "Complete transparency in fees, processes, and communication.", color: "blue" },
    { icon: Target, title: s.about_value_4_title || "Excellence", desc: s.about_value_4_desc || "We strive for excellence in every interaction and service.", color: "green" },
  ];

  const stats = [
    { value: s.about_stat_1_value || "15+", label: s.about_stat_1_label || "Universities" },
    { value: s.about_stat_2_value || "46+", label: s.about_stat_2_label || "Courses" },
    { value: s.about_stat_3_value || "5000+", label: s.about_stat_3_label || "Students" },
    { value: s.about_stat_4_value || "10+", label: s.about_stat_4_label || "Years Experience" },
  ];

  return (
    <div>
      <SEO
        title="About Us - India's Trusted Education Partner"
        description="Learn about Education Hub - India's premier education consultancy with 10+ years of experience, 15+ partner universities, and 5000+ students enrolled."
        keywords="about education hub, education consultancy India, university admission support, UGC recognized, NAAC accredited, Jaipur education"
        canonical="/about"
      />
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={s.about_hero_image || "https://adypu.edu.in/wp-content/uploads/2025/03/ADYPU-Banner-scaled.webp"} alt="Students" className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-semibold rounded-full mb-4 border border-white/20">ABOUT US</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">About {s.site_name || "Education Hub"}</h1>
          <p className="text-blue-200 max-w-2xl mx-auto text-lg">
            {s.about_hero_subtitle || "Your trusted partner in education, connecting students with the best universities across India since 2014."}
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full mb-4">WHO WE ARE</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6">{s.about_who_title || "Empowering Students to Achieve Their Dreams"}</h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-4">
                {s.about_who_description_1 || "Education Hub is a premier education consultancy that works with multiple UGC-recognized and NAAC-accredited universities across India. We provide end-to-end support for students seeking admission in undergraduate, postgraduate, diploma, and professional courses."}
              </p>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                {s.about_who_description_2 || "With a team of experienced counselors and education experts, we guide students through every step of the admission process - from choosing the right course and university to completing documentation and securing enrollment."}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-5 w-5 text-green-500" /> {s.about_badge_1 || "UGC Recognized Partners"}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-5 w-5 text-green-500" /> {s.about_badge_2 || "NAAC Accredited"}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-5 w-5 text-green-500" /> {s.about_badge_3 || "10+ Years Experience"}</div>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img src={s.about_image_1 || "https://adypu.edu.in/wp-content/uploads/2025/12/banner-1.jpeg"} alt="Students studying" className="rounded-2xl w-full h-72 object-cover shadow-lg" loading="lazy" decoding="async" />
                <img src={s.about_image_2 || "https://www.uudoon.in/assets/images/sliders/Slider-Convocation-2025-v1.jpg"} alt="Graduation" className="rounded-2xl w-full h-52 object-cover shadow-lg mt-20" loading="lazy" decoding="async" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-float">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center"><Sparkles className="h-6 w-6 text-blue-600" /></div>
                  <div><div className="text-xl font-extrabold text-gray-900">{s.about_stat_3_value || "5000+"}</div><div className="text-xs text-gray-500">Happy Students</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50/50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
                <Target className="h-7 w-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">Our Mission</h2>
              <p className="text-gray-500 leading-relaxed">
                {s.about_mission || "To make quality education accessible to every student by providing comprehensive admission support, expert guidance, and seamless processes. We bridge the gap between students and top universities, ensuring every individual finds the right path to their academic and professional goals."}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center mb-5">
                <GraduationCap className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">Our Vision</h2>
              <p className="text-gray-500 leading-relaxed">
                {s.about_vision || "To become India's leading education consultancy that empowers students with the knowledge and resources they need to make informed decisions about their education. We envision a future where every student has equal access to quality higher education opportunities."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-full mb-4">OUR VALUES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Our Core <span className="text-indigo-600">Values</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`h-14 w-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                  v.color === "red" ? "bg-red-100" : v.color === "yellow" ? "bg-yellow-100" : v.color === "blue" ? "bg-blue-100" : "bg-green-100"
                }`}>
                  <v.icon className={`h-7 w-7 ${
                    v.color === "red" ? "text-red-600" : v.color === "yellow" ? "text-yellow-600" : v.color === "blue" ? "text-blue-600" : "text-green-600"
                  }`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-50 text-green-600 text-sm font-semibold rounded-full mb-4">SERVICES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">What We <span className="text-green-600">Offer</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "Admission Guidance", desc: "Expert counseling to help you choose the right course and university based on your interests and career goals.", color: "blue" },
              { icon: Shield, title: "Verified Universities", desc: "We only partner with UGC recognized and NAAC accredited universities ensuring quality education.", color: "green" },
              { icon: Clock, title: "Quick Processing", desc: "Fast and efficient admission processing with complete documentation support at every step.", color: "orange" },
              { icon: Building2, title: "Multiple Universities", desc: "Access to 15+ top universities across India offering diverse courses in various disciplines.", color: "indigo" },
              { icon: Users, title: "Personal Counselor", desc: "Dedicated counselor assigned to each student for personalized support throughout the journey.", color: "purple" },
              { icon: TrendingUp, title: "Career Support", desc: "Post-admission career guidance and placement support to help students achieve their professional goals.", color: "pink" },
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-5 ${
                  item.color === "blue" ? "bg-blue-100" : item.color === "green" ? "bg-green-100" : item.color === "orange" ? "bg-orange-100" : item.color === "indigo" ? "bg-indigo-100" : item.color === "purple" ? "bg-purple-100" : "bg-pink-100"
                }`}>
                  <item.icon className={`h-7 w-7 ${
                    item.color === "blue" ? "text-blue-600" : item.color === "green" ? "text-green-600" : item.color === "orange" ? "text-orange-600" : item.color === "indigo" ? "text-indigo-600" : item.color === "purple" ? "text-purple-600" : "text-pink-600"
                  }`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={s.hero_bg_image || "https://www.gla.ac.in/images/capgemini-codexperience-center.webp"} alt="Students" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/90" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-4xl sm:text-5xl font-extrabold">{stat.value}</div>
                <div className="text-blue-200 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{s.about_cta_title || "Ready to Start Your Journey?"}</h2>
          <p className="text-gray-500 text-lg mb-8 max-w-2xl mx-auto">{s.about_cta_subtitle || "Get in touch with our expert counselors and take the first step towards your dream career."}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/enquiry" className="btn-3d btn-3d-blue inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-lg">
              Apply Now <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/contact" className="btn-3d btn-3d-green inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
