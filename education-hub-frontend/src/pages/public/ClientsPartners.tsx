import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Handshake, Building2, Globe, Award, GraduationCap, ArrowRight, ExternalLink } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

const API = import.meta.env.VITE_API_URL || "";

export default function ClientsPartners() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/universities").then(r => setUniversities(r.data || [])).catch(() => {});
    api.get("/api/categories").then(r => setCategories(r.data || [])).catch(() => {});
  }, []);

  const imgSrc = (p: string) => { if (!p) return ""; if (p.startsWith("http")) return p; return API + p + "?v=" + Date.now(); };

  // Count courses per university
  const coursesByUni = new Map<number, number>();
  categories.forEach(c => {
    const uid = c.university_id;
    coursesByUni.set(uid, (coursesByUni.get(uid) || 0) + 1);
  });

  const partners = [
    { name: "National Skill Development Corporation", type: "Government Partner", abbr: "NSDC", color: "from-blue-500 to-blue-700" },
    { name: "University Grants Commission (UGC)", type: "Regulatory Body", abbr: "UGC", color: "from-green-500 to-green-700" },
    { name: "All India Council for Technical Education (AICTE)", type: "Regulatory Body", abbr: "AICTE", color: "from-purple-500 to-purple-700" },
    { name: "Distance Education Bureau (DEB)", type: "Regulatory Body", abbr: "DEB", color: "from-orange-500 to-orange-700" },
    { name: "National Assessment and Accreditation Council (NAAC)", type: "Accreditation Body", abbr: "NAAC", color: "from-red-500 to-red-700" },
  ];

  return (
    <div>
      <SEO
        title="Our Partners - University & Institutional Partners"
        description="Trusted by leading universities and institutions across India. Education Hub partners with UGC recognized, NAAC accredited universities for quality education."
        keywords="university partners, education partners, UGC recognized, NAAC accredited, partner universities India, institutional partners"
        canonical="/clients"
      />
      <div className="bg-gradient-to-r from-amber-900 to-amber-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-semibold rounded-full mb-4 border border-white/20">OUR PARTNERS</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Our Clients & Partners</h1>
          <p className="text-lg text-amber-200 max-w-2xl mx-auto">Trusted by leading universities, institutions, and organizations across India</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: `${universities.length}+`, label: "University Partners", icon: Building2, color: "bg-blue-600" },
            { value: "750+", label: "Education Consultants", icon: Handshake, color: "bg-green-600" },
            { value: "50+", label: "Cities Covered", icon: Globe, color: "bg-purple-600" },
            { value: "10000+", label: "Students Enrolled", icon: Award, color: "bg-orange-600" },
          ].map((s, i) => (
            <div key={i} className={`${s.color} text-white rounded-xl p-5 text-center shadow-lg`}>
              <s.icon className="h-8 w-8 mx-auto mb-2 opacity-90" />
              <p className="text-2xl md:text-3xl font-bold">{s.value}</p>
              <p className="text-sm opacity-90">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* University Partners */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">University Partners</h2>
        <p className="text-center text-gray-600 mb-10">We partner with India&apos;s top universities to provide quality education</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {universities.map(u => (
            <Link key={u.id} to={`/courses?university=${u.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group overflow-hidden">
              <div className="p-6 text-center">
                {u.logo ? (
                  <img src={imgSrc(u.logo)} alt={u.name} className="h-20 w-20 object-contain mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" loading="lazy" decoding="async" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const next = (e.target as HTMLImageElement).nextElementSibling; if (next) (next as HTMLElement).style.display = 'flex'; }} />
                ) : null}
                <div className={`h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl items-center justify-center mx-auto mb-4 text-white font-bold text-xl ${u.logo ? 'hidden' : 'flex'}`}>
                  {u.code?.substring(0, 2) || u.name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{u.name}</h3>
                <p className="text-xs text-blue-600 font-semibold mb-2">{u.code}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>{coursesByUni.get(u.id) || 0} Courses</span>
                </div>
                {u.website && (
                  <a href={u.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 mt-2">
                    <ExternalLink className="h-3 w-3" /> Website
                  </a>
                )}
              </div>
              <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5 flex items-center justify-center gap-1 text-xs text-blue-600 font-semibold">
                View Courses <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Institutional Partners */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">Institutional Partners</h2>
          <p className="text-center text-gray-600 mb-10">Recognized and supported by leading institutions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {partners.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`h-16 w-16 bg-gradient-to-br ${p.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-sm shadow-lg`}>
                  {p.abbr}
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">{p.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{p.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Want to Partner With Us?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">We&apos;re always looking for new partnerships to expand our reach and provide better services to students.</p>
        <Link to="/contact" className="inline-block px-8 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/25">Contact Us for Partnership</Link>
      </div>
    </div>
  );
}
