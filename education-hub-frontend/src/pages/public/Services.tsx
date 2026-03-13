import { useState, useEffect } from "react";
import { GraduationCap, Users, FileCheck, Building2, Headphones, Award, BookOpen, Globe } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

const icons = [GraduationCap, Users, FileCheck, Building2, Headphones, Award, BookOpen, Globe];
const colors = ["bg-blue-100 text-blue-600", "bg-green-100 text-green-600", "bg-purple-100 text-purple-600", "bg-orange-100 text-orange-600", "bg-pink-100 text-pink-600", "bg-amber-100 text-amber-600", "bg-teal-100 text-teal-600", "bg-indigo-100 text-indigo-600"];

const defaultServices = [
  { title: "University Admissions", desc: "End-to-end admission support for 15+ partner universities. We handle the entire process from application to enrollment." },
  { title: "Expert Counseling", desc: "Personalized guidance from experienced education counselors to help you choose the right university and course." },
  { title: "Document Processing", desc: "Complete document verification, attestation, and submission support. We ensure all paperwork is handled properly." },
  { title: "Branch Network", desc: "Wide network of branches across India for easy access to our services. Walk into any branch for instant assistance." },
  { title: "Student Support", desc: "24/7 student support through phone, email, and WhatsApp. We're always here to help you." },
  { title: "Scholarship Assistance", desc: "Help students find and apply for scholarships. We connect deserving students with financial aid opportunities." },
  { title: "Course Selection", desc: "Expert advice on course selection based on career goals, interests, and market trends." },
  { title: "Online & Distance Education", desc: "Support for online and distance learning programs from top universities. Study from anywhere." },
];

const defaultProcess = [
  { title: "Enquiry", desc: "Submit your enquiry online or visit our branch" },
  { title: "Counseling", desc: "Get expert guidance on course and university selection" },
  { title: "Application", desc: "We handle your application and documentation" },
  { title: "Admission", desc: "Get confirmed admission and start your journey" },
];

export default function Services() {
  const [s, setS] = useState<Record<string, string>>({});
  useEffect(() => { api.get("/api/settings").then((r) => setS(r.data || {})).catch(() => {}); }, []);

  const services = Array.from({ length: 8 }, (_, i) => ({
    icon: icons[i],
    title: s[`service_${i + 1}_title`] || defaultServices[i].title,
    desc: s[`service_${i + 1}_desc`] || defaultServices[i].desc,
    color: colors[i],
  }));

  const process = Array.from({ length: 4 }, (_, i) => ({
    step: String(i + 1).padStart(2, "0"),
    title: s[`services_process_${i + 1}_title`] || defaultProcess[i].title,
    desc: s[`services_process_${i + 1}_desc`] || defaultProcess[i].desc,
  }));

  return (
    <div>
      <SEO
        title="Our Services - Education Consulting"
        description="Comprehensive education consulting services including university admissions, expert counseling, document processing, scholarship assistance, and career support."
        keywords="education services, university admission support, document processing, scholarship assistance, career guidance, education consulting India"
        canonical="/services"
      />
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">{s.services_hero_subtitle || "Comprehensive education consulting services to help you achieve your academic goals"}</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((svc, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-all hover:-translate-y-1 group">
              <div className={`w-14 h-14 ${svc.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <svc.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{svc.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{svc.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{s.services_cta_title || "Need Help Choosing the Right Path?"}</h2>
          <p className="text-gray-600 mb-8">{s.services_cta_subtitle || "Our expert counselors are ready to guide you. Get personalized advice for your education journey."}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25">Contact Us</a>
            <a href="/courses" className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors">View Courses</a>
          </div>
        </div>
      </div>

      {/* Process */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {process.map((p, i) => (
            <div key={i} className="text-center relative">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{p.step}</div>
              <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
